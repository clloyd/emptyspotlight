/* */ 
"format cjs";
// in this transformer we have to split up classes and function declarations
// from their exports. why? because sometimes we need to replace classes with
// nodes that aren't allowed in the same contexts. also, if you're exporting
// a generator function as a default then regenerator will destroy the export
// declaration and leave a variable declaration in it's place... yeah, handy.

"use strict";

exports.__esModule = true;
exports.ImportDeclaration = ImportDeclaration;
exports.ExportDefaultDeclaration = ExportDefaultDeclaration;
exports.ExportNamedDeclaration = ExportNamedDeclaration;
exports.Program = Program;

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

function ImportDeclaration(node, parent, scope, file) {
  if (node.source) {
    node.source.value = file.resolveModuleSource(node.source.value);
  }
}

exports.ExportAllDeclaration = ImportDeclaration;

function ExportDefaultDeclaration(node, parent, scope) {
  ImportDeclaration.apply(this, arguments);

  var declar = node.declaration;

  var getDeclar = function getDeclar() {
    declar._ignoreUserWhitespace = true;
    return declar;
  };

  if (t.isClassDeclaration(declar)) {
    // export default class Foo {};
    node.declaration = declar.id;
    return [getDeclar(), node];
  } else if (t.isClassExpression(declar)) {
    // export default class {};
    var temp = scope.generateUidIdentifier("default");
    declar = t.variableDeclaration("var", [t.variableDeclarator(temp, declar)]);
    node.declaration = temp;
    return [getDeclar(), node];
  } else if (t.isFunctionDeclaration(declar)) {
    // export default function Foo() {}
    node._blockHoist = 2;
    node.declaration = declar.id;
    return [getDeclar(), node];
  }
}

function buildExportSpecifier(id) {
  return t.exportSpecifier(_lodashLangClone2["default"](id), _lodashLangClone2["default"](id));
}

function ExportNamedDeclaration(node, parent, scope) {
  ImportDeclaration.apply(this, arguments);

  var declar = node.declaration;

  var getDeclar = function getDeclar() {
    declar._ignoreUserWhitespace = true;
    return declar;
  };

  if (t.isClassDeclaration(declar)) {
    // export class Foo {}
    node.specifiers = [buildExportSpecifier(declar.id)];
    node.declaration = null;
    return [getDeclar(), node];
  } else if (t.isFunctionDeclaration(declar)) {
    // export function Foo() {}
    node.specifiers = [buildExportSpecifier(declar.id)];
    node.declaration = null;
    node._blockHoist = 2;
    return [getDeclar(), node];
  } else if (t.isVariableDeclaration(declar)) {
    // export var foo = "bar";
    var specifiers = [];
    var bindings = this.get("declaration").getBindingIdentifiers();
    for (var key in bindings) {
      specifiers.push(buildExportSpecifier(bindings[key]));
    }
    return [declar, t.exportNamedDeclaration(null, specifiers)];
  }
}

function Program(node) {
  var imports = [];
  var rest = [];

  for (var i = 0; i < node.body.length; i++) {
    var bodyNode = node.body[i];
    if (t.isImportDeclaration(bodyNode)) {
      imports.push(bodyNode);
    } else {
      rest.push(bodyNode);
    }
  }

  node.body = imports.concat(rest);
}