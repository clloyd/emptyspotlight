/* */ 
"format cjs";
// https://github.com/rwaldron/exponentiation-operator

"use strict";

exports.__esModule = true;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _helpersBuildBinaryAssignmentOperatorTransformer = require("../../helpers/build-binary-assignment-operator-transformer");

var _helpersBuildBinaryAssignmentOperatorTransformer2 = _interopRequireDefault(_helpersBuildBinaryAssignmentOperatorTransformer);

var _types = require("../../../types");

var t = _interopRequireWildcard(_types);

var metadata = {
  stage: 2
};

exports.metadata = metadata;
var MATH_POW = t.memberExpression(t.identifier("Math"), t.identifier("pow"));

var _build = _helpersBuildBinaryAssignmentOperatorTransformer2["default"]({
  operator: "**",

  build: function build(left, right) {
    return t.callExpression(MATH_POW, [left, right]);
  }
});

var ExpressionStatement = _build.ExpressionStatement;
var AssignmentExpression = _build.AssignmentExpression;
var BinaryExpression = _build.BinaryExpression;
exports.ExpressionStatement = ExpressionStatement;
exports.AssignmentExpression = AssignmentExpression;
exports.BinaryExpression = BinaryExpression;