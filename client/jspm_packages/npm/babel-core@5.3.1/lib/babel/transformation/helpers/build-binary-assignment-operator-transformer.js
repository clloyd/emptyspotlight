/* */ 
"format cjs";
"use strict";

exports.__esModule = true;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _explodeAssignableExpression = require("./explode-assignable-expression");

var _explodeAssignableExpression2 = _interopRequireDefault(_explodeAssignableExpression);

var _types = require("../../types");

var t = _interopRequireWildcard(_types);

exports["default"] = function (opts) {
  var exports = {};

  var isAssignment = function isAssignment(node) {
    return node.operator === opts.operator + "=";
  };

  var buildAssignment = function buildAssignment(left, right) {
    return t.assignmentExpression("=", left, right);
  };

  exports.ExpressionStatement = function (node, parent, scope, file) {
    // hit the `AssignmentExpression` one below
    if (this.isCompletionRecord()) return;

    var expr = node.expression;
    if (!isAssignment(expr)) return;

    var nodes = [];
    var exploded = _explodeAssignableExpression2["default"](expr.left, nodes, file, scope, true);

    nodes.push(t.expressionStatement(buildAssignment(exploded.ref, opts.build(exploded.uid, expr.right))));

    return nodes;
  };

  exports.AssignmentExpression = function (node, parent, scope, file) {
    if (!isAssignment(node)) return;

    var nodes = [];
    var exploded = _explodeAssignableExpression2["default"](node.left, nodes, file, scope);
    nodes.push(buildAssignment(exploded.ref, opts.build(exploded.uid, node.right)));
    return nodes;
  };

  exports.BinaryExpression = function (node) {
    if (node.operator !== opts.operator) return;
    return opts.build(node.left, node.right);
  };

  return exports;
};

;
module.exports = exports["default"];