/* */ 
"format cjs";
"use strict";

exports.__esModule = true;
exports.Program = Program;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _regenerator = require("regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _types = require("../../../types");

var t = _interopRequireWildcard(_types);

var metadata = {
  group: "regenerator"
};

exports.metadata = metadata;

function Program(ast) {
  _regenerator2["default"].transform(ast);
}