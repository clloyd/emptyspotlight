/* */ 
"format cjs";
"use strict";

exports.__esModule = true;

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _lodashCollectionIncludes = require("lodash/collection/includes");

var _lodashCollectionIncludes2 = _interopRequireDefault(_lodashCollectionIncludes);

var _visitors = require("./visitors");

var _index = require("./index");

var _index2 = _interopRequireDefault(_index);

var _lodashObjectDefaults = require("lodash/object/defaults");

var _lodashObjectDefaults2 = _interopRequireDefault(_lodashObjectDefaults);

var _messages = require("../messages");

var messages = _interopRequireWildcard(_messages);

var _binding = require("./binding");

var _binding2 = _interopRequireDefault(_binding);

var _globals = require("globals");

var _globals2 = _interopRequireDefault(_globals);

var _lodashArrayFlatten = require("lodash/array/flatten");

var _lodashArrayFlatten2 = _interopRequireDefault(_lodashArrayFlatten);

var _lodashObjectExtend = require("lodash/object/extend");

var _lodashObjectExtend2 = _interopRequireDefault(_lodashObjectExtend);

var _helpersObject = require("../helpers/object");

var _helpersObject2 = _interopRequireDefault(_helpersObject);

var _lodashCollectionEach = require("lodash/collection/each");

var _lodashCollectionEach2 = _interopRequireDefault(_lodashCollectionEach);

var _types = require("../types");

var t = _interopRequireWildcard(_types);

var functionVariableVisitor = {
  enter: function enter(node, parent, scope, state) {
    if (t.isFor(node)) {
      var _arr = t.FOR_INIT_KEYS;

      for (var _i = 0; _i < _arr.length; _i++) {
        var key = _arr[_i];
        var declar = this.get(key);
        if (declar.isVar()) state.scope.registerBinding("var", declar);
      }
    }

    // this block is a function so we'll stop since none of the variables
    // declared within are accessible
    if (this.isFunction()) return this.skip();

    // function identifier doesn't belong to this scope
    if (state.blockId && node === state.blockId) return;

    // delegate block scope handling to the `blockVariableVisitor`
    if (this.isBlockScoped()) return;

    // this will be hit again once we traverse into it after this iteration
    if (this.isExportDeclaration() && t.isDeclaration(node.declaration)) return;

    // we've ran into a declaration!
    if (this.isDeclaration()) state.scope.registerDeclaration(this);
  }
};

var programReferenceVisitor = _visitors.explode({
  ReferencedIdentifier: function ReferencedIdentifier(node, parent, scope, state) {
    var bindingInfo = scope.getBinding(node.name);
    if (bindingInfo) {
      bindingInfo.reference();
    } else {
      state.addGlobal(node);
    }
  },

  Scopable: function Scopable(node, parent, scope, state) {
    for (var name in scope.bindings) {
      state.references[name] = true;
    }
  },

  ExportDeclaration: {
    exit: function exit(node, parent, scope, state) {
      var declar = node.declaration;
      if (t.isClassDeclaration(declar) || t.isFunctionDeclaration(declar)) {
        scope.getBinding(declar.id.name).reference();
      } else if (t.isVariableDeclaration(declar)) {
        var _arr2 = declar.declarations;

        for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
          var decl = _arr2[_i2];
          var ids = t.getBindingIdentifiers(decl);
          for (var name in ids) {
            scope.getBinding(name).reference();
          }
        }
      }
    }
  },

  LabeledStatement: function LabeledStatement(node, parent, scope, state) {
    state.addGlobal(node);
  },

  AssignmentExpression: function AssignmentExpression(node, parent, scope, state) {
    scope.registerConstantViolation(this.get("left"), this.get("right"));
  },

  UpdateExpression: function UpdateExpression(node, parent, scope, state) {
    scope.registerConstantViolation(this.get("argument"), null);
  },

  UnaryExpression: function UnaryExpression(node, parent, scope, state) {
    if (node.operator === "delete") scope.registerConstantViolation(this.get("left"), null);
  }
});

var blockVariableVisitor = _visitors.explode({
  Scope: function Scope() {
    this.skip();
  },

  enter: function enter(node, parent, scope, state) {
    if (this.isFunctionDeclaration() || this.isBlockScoped()) {
      state.registerDeclaration(this);
    }
  }
});

var renameVisitor = _visitors.explode({
  ReferencedIdentifier: function ReferencedIdentifier(node, parent, scope, state) {
    if (node.name === state.oldName) {
      node.name = state.newName;
    }
  },

  Declaration: function Declaration(node, parent, scope, state) {
    var ids = this.getBindingIdentifiers();;

    for (var name in ids) {
      if (name === state.oldName) ids[name].name = state.newName;
    }
  },

  Scopable: function Scopable(node, parent, scope, state) {
    if (this.isScope()) {
      if (!scope.bindingIdentifierEquals(state.oldName, state.binding)) {
        this.skip();
      }
    }
  }
});

var Scope = (function () {

  /**
   * This searches the current "scope" and collects all references/bindings
   * within.
   */

  function Scope(path, parent, file) {
    _classCallCheck(this, Scope);

    if (parent && parent.block === path.node) {
      return parent;
    }

    var cached = path.getData("scope");
    if (cached && cached.parent === parent) {
      return cached;
    } else {}

    this.parent = parent;
    this.file = parent ? parent.file : file;

    this.parentBlock = path.parent;
    this.block = path.node;
    this.path = path;

    this.crawl();
  }

  /**
   * Description
   */

  Scope.prototype.traverse = function traverse(node, opts, state) {
    _index2["default"](node, opts, this, state, this.path);
  };

  /**
   * Description
   */

  Scope.prototype.generateTemp = function generateTemp() {
    var name = arguments[0] === undefined ? "temp" : arguments[0];

    var id = this.generateUidIdentifier(name);
    this.push({ id: id });
    return id;
  };

  /**
   * Description
   */

  Scope.prototype.generateUidIdentifier = function generateUidIdentifier(name) {
    return t.identifier(this.generateUid(name));
  };

  /**
   * Description
   */

  Scope.prototype.generateUid = function generateUid(name) {
    name = t.toIdentifier(name).replace(/^_+/, "");

    var uid;
    var i = 0;
    do {
      uid = this._generateUid(name, i);
      i++;
    } while (this.hasBinding(uid) || this.hasGlobal(uid) || this.hasReference(uid));

    var program = this.getProgramParent();
    program.references[uid] = true;
    program.uids[uid] = true;

    return uid;
  };

  Scope.prototype._generateUid = function _generateUid(name, i) {
    var id = name;
    if (i > 1) id += i;
    return "_" + id;
  };

  /*
   * Description
   */

  Scope.prototype.generateUidBasedOnNode = function generateUidBasedOnNode(parent, defaultName) {
    var node = parent;

    if (t.isAssignmentExpression(parent)) {
      node = parent.left;
    } else if (t.isVariableDeclarator(parent)) {
      node = parent.id;
    } else if (t.isProperty(node)) {
      node = node.key;
    }

    var parts = [];

    var add = function add(node) {
      if (t.isModuleDeclaration(node)) {
        if (node.source) {
          add(node.source);
        } else if (node.specifiers && node.specifiers.length) {
          var _arr3 = node.specifiers;

          for (var _i3 = 0; _i3 < _arr3.length; _i3++) {
            var specifier = _arr3[_i3];
            add(specifier);
          }
        } else if (node.declaration) {
          add(node.declaration);
        }
      } else if (t.isModuleSpecifier(node)) {
        add(node.local);
      } else if (t.isMemberExpression(node)) {
        add(node.object);
        add(node.property);
      } else if (t.isIdentifier(node)) {
        parts.push(node.name);
      } else if (t.isLiteral(node)) {
        parts.push(node.value);
      } else if (t.isCallExpression(node)) {
        add(node.callee);
      } else if (t.isObjectExpression(node) || t.isObjectPattern(node)) {
        var _arr4 = node.properties;

        for (var _i4 = 0; _i4 < _arr4.length; _i4++) {
          var prop = _arr4[_i4];
          add(prop.key || prop.argument);
        }
      }
    };

    add(node);

    var id = parts.join("$");
    id = id.replace(/^_/, "") || defaultName || "ref";

    return this.generateUidIdentifier(id);
  };

  /**
   * Description
   */

  Scope.prototype.generateMemoisedReference = function generateMemoisedReference(node, dontPush) {
    if (t.isThisExpression(node) || t.isSuper(node)) {
      return null;
    }

    if (t.isIdentifier(node) && this.hasBinding(node.name)) {
      return null;
    }

    var id = this.generateUidBasedOnNode(node);
    if (!dontPush) this.push({ id: id });
    return id;
  };

  /**
   * Description
   */

  Scope.prototype.checkBlockScopedCollisions = function checkBlockScopedCollisions(kind, name, id) {
    var local = this.getOwnBindingInfo(name);
    if (!local) return;

    if (kind === "param") return;
    if (kind === "hoisted" && local.kind === "let") return;

    var duplicate = false;
    if (!duplicate) duplicate = kind === "let" || kind === "const" || local.kind === "let" || local.kind === "const" || local.kind === "module";
    if (!duplicate) duplicate = local.kind === "param" && (kind === "let" || kind === "const");

    if (duplicate) {
      throw this.file.errorWithNode(id, messages.get("scopeDuplicateDeclaration", name), TypeError);
    }
  };

  /**
   * Description
   */

  Scope.prototype.rename = function rename(oldName, newName, block) {
    newName = newName || this.generateUidIdentifier(oldName).name;

    var info = this.getBinding(oldName);
    if (!info) return;

    var state = {
      newName: newName,
      oldName: oldName,
      binding: info.identifier,
      info: info
    };

    var scope = info.scope;
    scope.traverse(block || scope.block, renameVisitor, state);

    if (!block) {
      scope.removeOwnBinding(oldName);
      scope.bindings[newName] = info;
      state.binding.name = newName;
    }

    var file = this.file;
    if (file) {
      this._renameFromMap(file.moduleFormatter.localImports, oldName, newName, state.binding);
      //this._renameFromMap(file.moduleFormatter.localExports, oldName, newName);
    }
  };

  Scope.prototype._renameFromMap = function _renameFromMap(map, oldName, newName, value) {
    if (map[oldName]) {
      map[newName] = value;
      map[oldName] = null;
    }
  };

  /**
   * Description
   */

  Scope.prototype.dump = function dump() {
    var scope = this;
    do {
      console.log(scope.block.type, "Bindings:", Object.keys(scope.bindings));
    } while (scope = scope.parent);
    console.log("-------------");
  };

  /**
   * Description
   */

  Scope.prototype.toArray = function toArray(node, i) {
    var file = this.file;

    if (t.isIdentifier(node)) {
      var binding = this.getBinding(node.name);
      if (binding && binding.constant && binding.isTypeGeneric("Array")) return node;
    }

    if (t.isArrayExpression(node)) {
      return node;
    }

    if (t.isIdentifier(node, { name: "arguments" })) {
      return t.callExpression(t.memberExpression(file.addHelper("slice"), t.identifier("call")), [node]);
    }

    var helperName = "to-array";
    var args = [node];
    if (i === true) {
      helperName = "to-consumable-array";
    } else if (i) {
      args.push(t.literal(i));
      helperName = "sliced-to-array";
      if (this.file.isLoose("es6.forOf")) helperName += "-loose";
    }
    return t.callExpression(file.addHelper(helperName), args);
  };

  /**
   * Description
   */

  Scope.prototype.registerDeclaration = function registerDeclaration(path) {
    var node = path.node;
    if (t.isFunctionDeclaration(node)) {
      this.registerBinding("hoisted", path);
    } else if (t.isVariableDeclaration(node)) {
      var declarations = path.get("declarations");
      var _arr5 = declarations;
      for (var _i5 = 0; _i5 < _arr5.length; _i5++) {
        var declar = _arr5[_i5];
        this.registerBinding(node.kind, declar);
      }
    } else if (t.isClassDeclaration(node)) {
      this.registerBinding("let", path);
    } else if (t.isImportDeclaration(node) || t.isExportDeclaration(node)) {
      this.registerBinding("module", path);
    } else {
      this.registerBinding("unknown", path);
    }
  };

  /**
   * Description
   */

  Scope.prototype.registerConstantViolation = function registerConstantViolation(left, right) {
    var ids = left.getBindingIdentifiers();
    for (var name in ids) {
      var binding = this.getBinding(name);
      if (!binding) continue;
      if (right) {
        var rightType = right.typeAnnotation;
        if (rightType && binding.isCompatibleWithType(rightType)) continue;
      }
      binding.reassign();
    }
  };

  /**
   * Description
   */

  Scope.prototype.registerBinding = function registerBinding(kind, path) {
    if (!kind) throw new ReferenceError("no `kind`");

    var ids = path.getBindingIdentifiers();

    for (var name in ids) {
      var id = ids[name];

      this.checkBlockScopedCollisions(kind, name, id);

      this.bindings[name] = new _binding2["default"]({
        identifier: id,
        scope: this,
        path: path,
        kind: kind
      });
    }
  };

  /**
   * Description
   */

  Scope.prototype.addGlobal = function addGlobal(node) {
    this.globals[node.name] = node;
  };

  /**
   * Description
   */

  Scope.prototype.hasUid = function hasUid(name) {
    var scope = this;

    do {
      if (scope.uids[name]) return true;
    } while (scope = scope.parent);

    return false;
  };

  /**
   * Description
   */

  Scope.prototype.hasGlobal = function hasGlobal(name) {
    var scope = this;

    do {
      if (scope.globals[name]) return true;
    } while (scope = scope.parent);

    return false;
  };

  /**
   * Description
   */

  Scope.prototype.hasReference = function hasReference(name) {
    var scope = this;

    do {
      if (scope.references[name]) return true;
    } while (scope = scope.parent);

    return false;
  };

  /**
   * Description
   */

  Scope.prototype.recrawl = function recrawl() {
    this.path.setData("scopeInfo", null);
    this.crawl();
  };

  /**
   * Description
   */

  Scope.prototype.isPure = function isPure(node) {
    if (t.isIdentifier(node)) {
      var bindingInfo = this.getBinding(node.name);
      return bindingInfo.constant;
    } else {
      return t.isPure(node);
    }
  };

  /**
   * Description
   */

  Scope.prototype.crawl = function crawl() {
    var path = this.path;

    //

    var info = this.block._scopeInfo;
    if (info) return _lodashObjectExtend2["default"](this, info);

    info = this.block._scopeInfo = {
      references: _helpersObject2["default"](),
      bindings: _helpersObject2["default"](),
      globals: _helpersObject2["default"](),
      uids: _helpersObject2["default"]() };

    _lodashObjectExtend2["default"](this, info);

    // ForStatement - left, init

    if (path.isLoop()) {
      var _arr6 = t.FOR_INIT_KEYS;

      for (var _i6 = 0; _i6 < _arr6.length; _i6++) {
        var key = _arr6[_i6];
        var node = path.get(key);
        if (node.isBlockScoped()) this.registerBinding(node.node.kind, node);
      }
    }

    // FunctionExpression - id

    if (path.isFunctionExpression() && path.has("id")) {
      if (!t.isProperty(path.parent, { method: true })) {
        this.registerBinding("var", path.get("id"));
      }
    }

    // Class

    if (path.isClass() && path.has("id")) {
      this.registerBinding("var", path.get("id"));
    }

    // Function - params, rest

    if (path.isFunction()) {
      var params = path.get("params");
      var _arr7 = params;
      for (var _i7 = 0; _i7 < _arr7.length; _i7++) {
        var param = _arr7[_i7];
        this.registerBinding("param", param);
      }
      this.traverse(path.get("body").node, blockVariableVisitor, this);
    }

    // Program, Function - var variables

    if (path.isProgram() || path.isFunction()) {
      this.traverse(path.node, functionVariableVisitor, {
        blockId: path.get("id").node,
        scope: this
      });
    }

    // Program, BlockStatement, Function - let variables

    if (path.isBlockStatement() || path.isProgram()) {
      this.traverse(path.node, blockVariableVisitor, this);
    }

    // CatchClause - param

    if (path.isCatchClause()) {
      this.registerBinding("let", path.get("param"));
    }

    // ComprehensionExpression - blocks

    if (path.isComprehensionExpression()) {
      this.registerBinding("let", path);
    }

    // Program

    if (path.isProgram()) {
      this.traverse(path.node, programReferenceVisitor, this);
    }
  };

  /**
   * Description
   */

  Scope.prototype.push = function push(opts) {
    var path = this.path;

    if (path.isLoop() || path.isCatchClause() || path.isFunction()) {
      t.ensureBlock(path.node);
      path = path.get("body");
    }

    if (!path.isBlockStatement() && !path.isProgram()) {
      path = this.getBlockParent().path;
    }

    var unique = opts.unique;
    var kind = opts.kind || "var";

    var dataKey = "declaration:" + kind;
    var declar = !unique && path.getData(dataKey);

    if (!declar) {
      declar = t.variableDeclaration(opts.kind || "var", []);
      declar._generated = true;
      declar._blockHoist = 2;

      this.file.attachAuxiliaryComment(declar);

      path.get("body")[0]._containerInsertBefore([declar]);
      if (!unique) path.setData(dataKey, declar);
    }

    declar.declarations.push(t.variableDeclarator(opts.id, opts.init));
  };

  /**
   * Walk up to the top of the scope tree and get the `Program`.
   */

  Scope.prototype.getProgramParent = function getProgramParent() {
    var scope = this;
    while (scope.parent) {
      scope = scope.parent;
    }
    return scope;
  };

  /**
   * Walk up the scope tree until we hit either a Function or reach the
   * very top and hit Program.
   */

  Scope.prototype.getFunctionParent = function getFunctionParent() {
    var scope = this;
    while (scope.parent && !t.isFunction(scope.block)) {
      scope = scope.parent;
    }
    return scope;
  };

  /**
   * Walk up the scope tree until we hit either a BlockStatement/Loop or reach the
   * very top and hit Program.
   */

  Scope.prototype.getBlockParent = function getBlockParent() {
    var scope = this;
    while (scope.parent && !t.isFunction(scope.block) && !t.isLoop(scope.block) && !t.isFunction(scope.block)) {
      scope = scope.parent;
    }
    return scope;
  };

  /**
   * Walks the scope tree and gathers **all** bindings.
   */

  Scope.prototype.getAllBindings = function getAllBindings() {
    var ids = _helpersObject2["default"]();

    var scope = this;
    do {
      _lodashObjectDefaults2["default"](ids, scope.bindings);
      scope = scope.parent;
    } while (scope);

    return ids;
  };

  /**
   * Walks the scope tree and gathers all declarations of `kind`.
   */

  Scope.prototype.getAllBindingsOfKind = function getAllBindingsOfKind() {
    var ids = _helpersObject2["default"]();

    var _arr8 = arguments;
    for (var _i8 = 0; _i8 < _arr8.length; _i8++) {
      var kind = _arr8[_i8];
      var scope = this;
      do {
        for (var name in scope.bindings) {
          var binding = scope.bindings[name];
          if (binding.kind === kind) ids[name] = binding;
        }
        scope = scope.parent;
      } while (scope);
    }

    return ids;
  };

  /**
   * Description
   */

  Scope.prototype.bindingIdentifierEquals = function bindingIdentifierEquals(name, node) {
    return this.getBindingIdentifier(name) === node;
  };

  /**
   * Description
   */

  Scope.prototype.getBinding = function getBinding(name) {
    var scope = this;

    do {
      var binding = scope.getOwnBindingInfo(name);
      if (binding) return binding;
    } while (scope = scope.parent);
  };

  /**
   * Description
   */

  Scope.prototype.getOwnBindingInfo = function getOwnBindingInfo(name) {
    return this.bindings[name];
  };

  /**
   * Description
   */

  Scope.prototype.getBindingIdentifier = function getBindingIdentifier(name) {
    var info = this.getBinding(name);
    return info && info.identifier;
  };

  /**
   * Description
   */

  Scope.prototype.getOwnBindingIdentifier = function getOwnBindingIdentifier(name) {
    var binding = this.bindings[name];
    return binding && binding.identifier;
  };

  /**
   * Description
   */

  Scope.prototype.hasOwnBinding = function hasOwnBinding(name) {
    return !!this.getOwnBindingInfo(name);
  };

  /**
   * Description
   */

  Scope.prototype.hasBinding = function hasBinding(name) {
    if (!name) return false;
    if (this.hasOwnBinding(name)) return true;
    if (this.parentHasBinding(name)) return true;
    if (this.hasUid(name)) return true;
    if (_lodashCollectionIncludes2["default"](Scope.globals, name)) return true;
    if (_lodashCollectionIncludes2["default"](Scope.contextVariables, name)) return true;
    return false;
  };

  /**
   * Description
   */

  Scope.prototype.parentHasBinding = function parentHasBinding(name) {
    return this.parent && this.parent.hasBinding(name);
  };

  /**
   * Move a binding of `name` to another `scope`.
   */

  Scope.prototype.moveBindingTo = function moveBindingTo(name, scope) {
    var info = this.getBinding(name);
    if (info) {
      info.scope.removeOwnBinding(name);
      info.scope = scope;
      scope.bindings[name] = info;
    }
  };

  /**
   * Description
   */

  Scope.prototype.removeOwnBinding = function removeOwnBinding(name) {
    delete this.bindings[name];
  };

  /**
   * Description
   */

  Scope.prototype.removeBinding = function removeBinding(name) {
    var info = this.getBinding(name);
    if (info) info.scope.removeOwnBinding(name);
  };

  _createClass(Scope, null, [{
    key: "globals",
    value: _lodashArrayFlatten2["default"]([_globals2["default"].builtin, _globals2["default"].browser, _globals2["default"].node].map(Object.keys)),
    enumerable: true
  }, {
    key: "contextVariables",
    value: ["this", "arguments", "super"],
    enumerable: true
  }]);

  return Scope;
})();

exports["default"] = Scope;
module.exports = exports["default"];

//path.setData("scope", this);