/* */ 
"format cjs";
"use strict";

exports.__esModule = true;
exports.manipulateOptions = manipulateOptions;
exports.Func = Func;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _helpersRemapAsyncToGenerator = require("../../helpers/remap-async-to-generator");

var _helpersRemapAsyncToGenerator2 = _interopRequireDefault(_helpersRemapAsyncToGenerator);

var _types = require("../../../types");

var t = _interopRequireWildcard(_types);

function manipulateOptions(opts) {
  opts.blacklist.push("regenerator");
}

var metadata = {
  optional: true,
  dependencies: ["es7.asyncFunctions", "es6.classes"]
};

exports.metadata = metadata;

function Func(node, parent, scope, file) {
  if (!node.async || node.generator) return;

  return _helpersRemapAsyncToGenerator2["default"](node, t.memberExpression(file.addImport("bluebird", null, "absolute"), t.identifier("coroutine")), scope);
}