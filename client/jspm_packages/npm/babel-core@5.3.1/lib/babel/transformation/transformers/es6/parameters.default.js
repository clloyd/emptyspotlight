/* */ 
"format cjs";
"use strict";

exports.__esModule = true;
exports.Func = Func;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _helpersCallDelegate = require("../../helpers/call-delegate");

var _helpersCallDelegate2 = _interopRequireDefault(_helpersCallDelegate);

var _util = require("../../../util");

var util = _interopRequireWildcard(_util);

var _traversal = require("../../../traversal");

var _traversal2 = _interopRequireDefault(_traversal);

var _types = require("../../../types");

var t = _interopRequireWildcard(_types);

var hasDefaults = function hasDefaults(node) {
  for (var i = 0; i < node.params.length; i++) {
    if (!t.isIdentifier(node.params[i])) return true;
  }
  return false;
};

var iifeVisitor = {
  ReferencedIdentifier: function ReferencedIdentifier(node, parent, scope, state) {
    if (node.name !== "eval") {
      if (!state.scope.hasOwnBinding(node.name)) return;
      if (state.scope.bindingIdentifierEquals(node.name, node)) return;
    }

    state.iife = true;
    this.stop();
  }
};

function Func(node, parent, scope, file) {
  if (!hasDefaults(node)) return;

  t.ensureBlock(node);

  var body = [];

  var argsIdentifier = t.identifier("arguments");
  argsIdentifier._shadowedFunctionLiteral = true;

  var lastNonDefaultParam = 0;

  var state = { iife: false, scope: scope };

  var pushDefNode = function pushDefNode(left, right, i) {
    var defNode = util.template("default-parameter", {
      VARIABLE_NAME: left,
      DEFAULT_VALUE: right,
      ARGUMENT_KEY: t.literal(i),
      ARGUMENTS: argsIdentifier
    }, true);
    defNode._blockHoist = node.params.length - i;
    body.push(defNode);
  };

  var params = this.get("params");
  for (var i = 0; i < params.length; i++) {
    var param = params[i];

    if (!param.isAssignmentPattern()) {
      if (!param.isRestElement()) {
        lastNonDefaultParam = i + 1;
      }

      if (!param.isIdentifier()) {
        param.traverse(iifeVisitor, state);
      }

      if (file.transformers["es6.spec.blockScoping"].canTransform() && param.isIdentifier()) {
        pushDefNode(param.node, t.identifier("undefined"), i);
      }

      continue;
    }

    var left = param.get("left");
    var right = param.get("right");

    var placeholder = scope.generateUidIdentifier("x");
    placeholder._isDefaultPlaceholder = true;
    node.params[i] = placeholder;

    if (!state.iife) {
      if (right.isIdentifier() && scope.hasOwnBinding(right.node.name)) {
        state.iife = true;
      } else {
        right.traverse(iifeVisitor, state);
      }
    }

    pushDefNode(left.node, right.node, i);
  }

  // we need to cut off all trailing default parameters
  node.params = node.params.slice(0, lastNonDefaultParam);

  if (state.iife) {
    body.push(_helpersCallDelegate2["default"](node, scope));
    node.body = t.blockStatement(body);
  } else {
    node.body.body = body.concat(node.body.body);
  }
}