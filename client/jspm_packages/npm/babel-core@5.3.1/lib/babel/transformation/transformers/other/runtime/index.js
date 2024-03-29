/* */ 
"format cjs";
"use strict";

exports.__esModule = true;
exports.pre = pre;
exports.ReferencedIdentifier = ReferencedIdentifier;
exports.CallExpression = CallExpression;
exports.BinaryExpression = BinaryExpression;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _lodashCollectionIncludes = require("lodash/collection/includes");

var _lodashCollectionIncludes2 = _interopRequireDefault(_lodashCollectionIncludes);

var _traversal = require("../../../../traversal");

var _traversal2 = _interopRequireDefault(_traversal);

var _util = require("../../../../util");

var util = _interopRequireWildcard(_util);

var _lodashObjectHas = require("lodash/object/has");

var _lodashObjectHas2 = _interopRequireDefault(_lodashObjectHas);

var _types = require("../../../../types");

var t = _interopRequireWildcard(_types);

var _definitions = require("./definitions");

var _definitions2 = _interopRequireDefault(_definitions);

var isSymbolIterator = t.buildMatchMemberExpression("Symbol.iterator");

var RUNTIME_MODULE_NAME = "babel-runtime";

var metadata = {
  optional: true,
  group: "builtin-post-modules"
};

exports.metadata = metadata;

function pre(file) {
  file.set("helperGenerator", function (name) {
    return file.addImport("" + RUNTIME_MODULE_NAME + "/helpers/" + name, name, "absoluteDefault");
  });

  file.setDynamic("regeneratorIdentifier", function () {
    return file.addImport("" + RUNTIME_MODULE_NAME + "/regenerator", "regeneratorRuntime", "absoluteDefault");
  });
}

function ReferencedIdentifier(node, parent, scope, file) {
  if (node.name === "regeneratorRuntime") {
    return file.get("regeneratorIdentifier");
  }

  if (t.isMemberExpression(parent)) return;
  if (!_lodashObjectHas2["default"](_definitions2["default"].builtins, node.name)) return;
  if (scope.getBindingIdentifier(node.name)) return;

  // Symbol() -> _core.Symbol(); new Promise -> new _core.Promise
  var modulePath = _definitions2["default"].builtins[node.name];
  return file.addImport("" + RUNTIME_MODULE_NAME + "/core-js/" + modulePath, node.name, "absoluteDefault");
}

function CallExpression(node, parent, scope, file) {
  // arr[Symbol.iterator]() -> _core.$for.getIterator(arr)

  if (node.arguments.length) return;

  var callee = node.callee;
  if (!t.isMemberExpression(callee)) return;
  if (!callee.computed) return;
  if (!this.get("callee.property").matchesPattern("Symbol.iterator")) return;

  return t.callExpression(file.addImport("" + RUNTIME_MODULE_NAME + "/core-js/get-iterator", "getIterator", "absoluteDefault"), [callee.object]);
}

function BinaryExpression(node, parent, scope, file) {
  // Symbol.iterator in arr -> core.$for.isIterable(arr)

  if (node.operator !== "in") return;
  if (!this.get("left").matchesPattern("Symbol.iterator")) return;

  return t.callExpression(file.addImport("" + RUNTIME_MODULE_NAME + "/core-js/is-iterable", "isIterable", "absoluteDefault"), [node.right]);
}

var MemberExpression = {
  enter: function enter(node, parent, scope, file) {
    // Array.from -> _core.Array.from

    if (!this.isReferenced()) return;

    var obj = node.object;
    var prop = node.property;

    if (!t.isReferenced(obj, node)) return;

    if (node.computed) return;

    if (!_lodashObjectHas2["default"](_definitions2["default"].methods, obj.name)) return;

    var methods = _definitions2["default"].methods[obj.name];
    if (!_lodashObjectHas2["default"](methods, prop.name)) return;

    if (scope.getBindingIdentifier(obj.name)) return;

    var modulePath = methods[prop.name];
    return file.addImport("" + RUNTIME_MODULE_NAME + "/core-js/" + modulePath, "" + obj.name + "$" + prop.name, "absoluteDefault");
  },

  exit: function exit(node, parent, scope, file) {
    if (!this.isReferenced()) return;

    var prop = node.property;
    var obj = node.object;

    if (!_lodashObjectHas2["default"](_definitions2["default"].builtins, obj.name)) return;
    if (scope.getBindingIdentifier(obj.name)) return;

    var modulePath = _definitions2["default"].builtins[obj.name];
    return t.memberExpression(file.addImport("" + RUNTIME_MODULE_NAME + "/core-js/" + modulePath, "" + obj.name, "absoluteDefault"), prop);
  }
};
exports.MemberExpression = MemberExpression;