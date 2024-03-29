/* */ 
"format cjs";
"use strict";

exports.__esModule = true;
exports.Expression = Expression;
exports.Identifier = Identifier;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

var _types = require("../../../types");

var t = _interopRequireWildcard(_types);

var metadata = {
  optional: true,
  group: "builtin-setup"
};

exports.metadata = metadata;

function Expression(node, parent, scope) {
  var res = this.evaluate();
  if (res.confident) return t.valueToNode(res.value);
}

function Identifier() {}

// override Expression