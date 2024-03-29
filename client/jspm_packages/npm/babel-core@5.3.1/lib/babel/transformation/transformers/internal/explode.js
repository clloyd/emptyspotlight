/* */ 
"format cjs";
"use strict";

exports.__esModule = true;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _lodashLangClone = require("lodash/lang/clone");

var _lodashLangClone2 = _interopRequireDefault(_lodashLangClone);

var _types = require("../../../types");

var t = _interopRequireWildcard(_types);

var metadata = {
  group: "builtin-setup"
};

exports.metadata = metadata;
function buildClone(bindingKey, refKey) {
  return function (node) {
    if (node[bindingKey] === node[refKey]) {
      node[refKey] = t.removeComments(_lodashLangClone2["default"](node[refKey]));
    }
  };
}

function buildListClone(listKey, bindingKey, refKey) {
  var clone = buildClone(bindingKey, refKey);

  return function (node) {
    if (!node[listKey]) return;

    var _arr = node[listKey];
    for (var _i = 0; _i < _arr.length; _i++) {
      var subNode = _arr[_i];
      clone(subNode);
    }
  };
}

var Property = buildClone("value", "key");
exports.Property = Property;
var ExportDeclaration = buildListClone("specifiers", "local", "exported");
exports.ExportDeclaration = ExportDeclaration;
var ImportDeclaration = buildListClone("specifiers", "local", "imported");
exports.ImportDeclaration = ImportDeclaration;