/* */ 
"format cjs";
"use strict";

exports.__esModule = true;
exports.custom = custom;
exports.property = property;
exports.bare = bare;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _getFunctionArity = require("./get-function-arity");

var _getFunctionArity2 = _interopRequireDefault(_getFunctionArity);

var _util = require("../../util");

var util = _interopRequireWildcard(_util);

var _types = require("../../types");

var t = _interopRequireWildcard(_types);

var visitor = {
  enter: function enter(node, parent, scope, state) {
    // check if this node is a referenced identifier that matches the same as our
    // function id
    if (!this.isReferencedIdentifier({ name: state.name })) return;

    // check that we don't have a local variable declared as that removes the need
    // for the wrapper
    var localDeclar = scope.getBindingIdentifier(state.name);
    if (localDeclar !== state.outerDeclar) return;

    state.selfReference = true;
    this.stop();
  }
};

var wrap = function wrap(state, method, id, scope) {
  if (state.selfReference) {
    if (scope.hasBinding(id.name)) {
      // we can just munge the local binding
      scope.rename(id.name);
    } else {
      // need to add a wrapper since we can't change the references
      var templateName = "property-method-assignment-wrapper";
      if (method.generator) templateName += "-generator";
      var template = util.template(templateName, {
        FUNCTION: method,
        FUNCTION_ID: id,
        FUNCTION_KEY: scope.generateUidIdentifier(id.name)
      });
      template.callee._skipModulesRemap = true;

      // shim in dummy params to retain function arity, if you try to read the
      // source then you'll get the original since it's proxied so it's all good
      var params = template.callee.body.body[0].params;
      for (var i = 0, len = _getFunctionArity2["default"](method); i < len; i++) {
        params.push(scope.generateUidIdentifier("x"));
      }

      return template;
    }
  }

  method.id = id;
};

var visit = function visit(node, name, scope) {
  var state = {
    selfAssignment: false,
    selfReference: false,
    outerDeclar: scope.getBindingIdentifier(name),
    references: [],
    name: name
  };

  // check to see if we have a local binding of the id we're setting inside of
  // the function, this is important as there are caveats associated

  var bindingInfo = scope.getOwnBindingInfo(name);

  if (bindingInfo) {
    if (bindingInfo.kind === "param") {
      // safari will blow up in strict mode with code like:
      //
      //   var t = function t(t) {};
      //
      // with the error:
      //
      //   Cannot declare a parameter named 't' as it shadows the name of a
      //   strict mode function.
      //
      // this isn't to the spec and they've invented this behaviour which is
      // **extremely** annoying so we avoid setting the name if it has a param
      // with the same id
      state.selfReference = true;
    } else {}
  } else if (state.outerDeclar || scope.hasGlobal(name)) {
    scope.traverse(node, visitor, state);
  }

  return state;
};

function custom(node, id, scope) {
  var state = visit(node, id.name, scope);
  return wrap(state, node, id, scope);
}

function property(node, file, scope) {
  var key = t.toComputedKey(node, node.key);
  if (!t.isLiteral(key)) return; // we can't set a function id with this

  var name = t.toIdentifier(key.value);
  if (name === "eval" || name === "arguments") name = "_" + name;
  var id = t.identifier(name);

  var method = node.value;
  var state = visit(method, name, scope);
  node.value = wrap(state, method, id, scope) || method;
}

function bare(node, parent, scope) {
  // has an `id` so we don't need to infer one
  if (node.id) return;

  var id;
  if (t.isProperty(parent) && parent.kind === "init" && (!parent.computed || t.isLiteral(parent.key))) {
    // { foo() {} };
    id = parent.key;
  } else if (t.isVariableDeclarator(parent)) {
    // var foo = function () {};
    id = parent.id;

    if (t.isIdentifier(id)) {
      var bindingInfo = scope.parent.getBinding(id.name);
      if (bindingInfo && bindingInfo.constant && scope.getBinding(id.name) === bindingInfo) {
        // always going to reference this method
        node.id = id;
        return;
      }
    }
  } else {
    return;
  }

  var name;
  if (t.isLiteral(id)) {
    name = id.value;
  } else if (t.isIdentifier(id)) {
    name = id.name;
  } else {
    return;
  }

  name = t.toIdentifier(name);
  id = t.identifier(name);

  var state = visit(node, name, scope);
  return wrap(state, node, id, scope);
}

// otherwise it's defined somewhere in scope like:
//
//   var t = function () {
//     var t = 2;
//   };
//
// so we can safely just set the id and move along as it shadows the
// bound function id