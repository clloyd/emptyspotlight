/* */ 
"format cjs";
"use strict";

exports.__esModule = true;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _default = require("./_default");

var _default2 = _interopRequireDefault(_default);

var _amd = require("./amd");

var _amd2 = _interopRequireDefault(_amd);

var _helpersObject = require("../../helpers/object");

var _helpersObject2 = _interopRequireDefault(_helpersObject);

var _util = require("../../util");

var util = _interopRequireWildcard(_util);

var _lodashArrayLast = require("lodash/array/last");

var _lodashArrayLast2 = _interopRequireDefault(_lodashArrayLast);

var _lodashCollectionEach = require("lodash/collection/each");

var _lodashCollectionEach2 = _interopRequireDefault(_lodashCollectionEach);

var _lodashCollectionMap = require("lodash/collection/map");

var _lodashCollectionMap2 = _interopRequireDefault(_lodashCollectionMap);

var _types = require("../../types");

var t = _interopRequireWildcard(_types);

var hoistVariablesVisitor = {
  enter: function enter(node, parent, scope, state) {
    if (t.isFunction(node)) {
      // nothing inside is accessible
      return this.skip();
    }

    if (t.isVariableDeclaration(node)) {
      if (node.kind !== "var" && !t.isProgram(parent)) {
        // let, const
        // can't be accessed
        return;
      }

      // ignore block hoisted nodes as these can be left in
      if (state.formatter.canHoist(node)) return;

      var nodes = [];

      for (var i = 0; i < node.declarations.length; i++) {
        var declar = node.declarations[i];
        state.hoistDeclarators.push(t.variableDeclarator(declar.id));
        if (declar.init) {
          // no initializer so we can just hoist it as-is
          var assign = t.expressionStatement(t.assignmentExpression("=", declar.id, declar.init));
          nodes.push(assign);
        }
      }

      // for (var i in test)
      // for (var i = 0;;)
      if (t.isFor(parent) && parent.left === node) {
        return node.declarations[0].id;
      }

      return nodes;
    }
  }
};

var hoistFunctionsVisitor = {
  enter: function enter(node, parent, scope, state) {
    if (t.isFunction(node)) this.skip();

    if (t.isFunctionDeclaration(node) || state.formatter.canHoist(node)) {
      state.handlerBody.push(node);
      this.remove();
    }
  }
};

var runnerSettersVisitor = {
  enter: function enter(node, parent, scope, state) {
    if (node._importSource === state.source) {
      if (t.isVariableDeclaration(node)) {
        var _arr = node.declarations;

        for (var _i = 0; _i < _arr.length; _i++) {
          var declar = _arr[_i];
          state.hoistDeclarators.push(t.variableDeclarator(declar.id));
          state.nodes.push(t.expressionStatement(t.assignmentExpression("=", declar.id, declar.init)));
        }
      } else {
        state.nodes.push(node);
      }

      this.remove();
    }
  }
};

var SystemFormatter = (function (_AMDFormatter) {
  function SystemFormatter(file) {
    _classCallCheck(this, SystemFormatter);

    _AMDFormatter.call(this, file);

    this.exportIdentifier = file.scope.generateUidIdentifier("export");
    this.noInteropRequireExport = true;
    this.noInteropRequireImport = true;
  }

  _inherits(SystemFormatter, _AMDFormatter);

  SystemFormatter.prototype._addImportSource = function _addImportSource(node, exportNode) {
    if (node) node._importSource = exportNode.source && exportNode.source.value;
    return node;
  };

  SystemFormatter.prototype.buildExportsWildcard = function buildExportsWildcard(objectIdentifier, node) {
    var leftIdentifier = this.scope.generateUidIdentifier("key");
    var valIdentifier = t.memberExpression(objectIdentifier, leftIdentifier, true);

    var left = t.variableDeclaration("var", [t.variableDeclarator(leftIdentifier)]);

    var right = objectIdentifier;

    var block = t.blockStatement([t.expressionStatement(this.buildExportCall(leftIdentifier, valIdentifier))]);

    return this._addImportSource(t.forInStatement(left, right, block), node);
  };

  SystemFormatter.prototype.buildExportsAssignment = function buildExportsAssignment(id, init, node) {
    var call = this.buildExportCall(t.literal(id.name), init, true);
    return this._addImportSource(call, node);
  };

  SystemFormatter.prototype.buildExportsFromAssignment = function buildExportsFromAssignment() {
    return this.buildExportsAssignment.apply(this, arguments);
  };

  SystemFormatter.prototype.remapExportAssignment = function remapExportAssignment(node, exported) {
    var assign = node;

    for (var i = 0; i < exported.length; i++) {
      assign = this.buildExportCall(t.literal(exported[i].name), assign);
    }

    return assign;
  };

  SystemFormatter.prototype.buildExportCall = function buildExportCall(id, init, isStatement) {
    var call = t.callExpression(this.exportIdentifier, [id, init]);
    if (isStatement) {
      return t.expressionStatement(call);
    } else {
      return call;
    }
  };

  SystemFormatter.prototype.importSpecifier = function importSpecifier(specifier, node, nodes) {
    _amd2["default"].prototype.importSpecifier.apply(this, arguments);

    for (var name in this.internalRemap) {
      nodes.push(t.variableDeclaration("var", [t.variableDeclarator(t.identifier(name), this.internalRemap[name])]));
    }

    this.internalRemap = _helpersObject2["default"]();

    this._addImportSource(_lodashArrayLast2["default"](nodes), node);
  };

  SystemFormatter.prototype.buildRunnerSetters = function buildRunnerSetters(block, hoistDeclarators) {
    var scope = this.file.scope;

    return t.arrayExpression(_lodashCollectionMap2["default"](this.ids, function (uid, source) {
      var state = {
        hoistDeclarators: hoistDeclarators,
        source: source,
        nodes: []
      };

      scope.traverse(block, runnerSettersVisitor, state);

      return t.functionExpression(null, [uid], t.blockStatement(state.nodes));
    }));
  };

  SystemFormatter.prototype.canHoist = function canHoist(node) {
    return node._blockHoist && !this.file.dynamicImports.length;
  };

  SystemFormatter.prototype.transform = function transform(program) {
    _default2["default"].prototype.transform.apply(this, arguments);

    var hoistDeclarators = [];
    var moduleName = this.getModuleName();
    var moduleNameLiteral = t.literal(moduleName);

    var block = t.blockStatement(program.body);

    var runner = util.template("system", {
      MODULE_DEPENDENCIES: t.arrayExpression(this.buildDependencyLiterals()),
      EXPORT_IDENTIFIER: this.exportIdentifier,
      MODULE_NAME: moduleNameLiteral,
      SETTERS: this.buildRunnerSetters(block, hoistDeclarators),
      EXECUTE: t.functionExpression(null, [], block)
    }, true);

    var handlerBody = runner.expression.arguments[2].body.body;
    if (!moduleName) runner.expression.arguments.shift();

    var returnStatement = handlerBody.pop();

    // hoist up all variable declarations
    this.file.scope.traverse(block, hoistVariablesVisitor, {
      formatter: this,
      hoistDeclarators: hoistDeclarators
    });

    if (hoistDeclarators.length) {
      var hoistDeclar = t.variableDeclaration("var", hoistDeclarators);
      hoistDeclar._blockHoist = true;
      handlerBody.unshift(hoistDeclar);
    }

    // hoist up function declarations for circular references
    this.file.scope.traverse(block, hoistFunctionsVisitor, {
      formatter: this,
      handlerBody: handlerBody
    });

    handlerBody.push(returnStatement);

    program.body = [runner];
  };

  return SystemFormatter;
})(_amd2["default"]);

exports["default"] = SystemFormatter;
module.exports = exports["default"];