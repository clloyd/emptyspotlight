/* */ 
"format cjs";
"use strict";

exports.__esModule = true;

/**
 * Check if the input `node` is a reference to a bound variable.
 */

exports.isReferenced = isReferenced;

/**
 * Check if the input `node` is an `Identifier` and `isReferenced`.
 */

exports.isReferencedIdentifier = isReferencedIdentifier;

/**
 * Check if the input `name` is a valid identifier name
 * and isn't a reserved word.
 */

exports.isValidIdentifier = isValidIdentifier;

/**
 * Description
 */

exports.isLet = isLet;

/**
 * Description
 */

exports.isBlockScoped = isBlockScoped;

/**
 * Description
 */

exports.isVar = isVar;

/**
 * Description
 */

exports.isSpecifierDefault = isSpecifierDefault;

/**
 * Description
 */

exports.isScope = isScope;

/**
 * Description
 */

exports.isImmutable = isImmutable;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _esutils = require("esutils");

var _esutils2 = _interopRequireDefault(_esutils);

var _index = require("./index");

var t = _interopRequireWildcard(_index);

function isReferenced(node, parent) {
  switch (parent.type) {
    // yes: PARENT[NODE]
    // yes: NODE.child
    // no: parent.CHILD
    case "MemberExpression":
      if (parent.property === node && parent.computed) {
        return true;
      } else if (parent.object === node) {
        return true;
      } else {
        return false;
      }

    // no: new.NODE
    // no: NODE.target
    case "MetaProperty":
      return false;

    // yes: { [NODE]: "" }
    // yes: { NODE }
    // no: { NODE: "" }
    case "Property":
      if (parent.key === node) {
        return parent.computed;
      }

    // no: var NODE = init;
    // yes: var id = NODE;
    case "VariableDeclarator":
      return parent.id !== node;

    // no: function NODE() {}
    // no: function foo(NODE) {}
    case "ArrowFunctionExpression":
    case "FunctionDeclaration":
    case "FunctionExpression":
      var _arr = parent.params;

      for (var _i = 0; _i < _arr.length; _i++) {
        var param = _arr[_i];
        if (param === node) return false;
      }

      return parent.id !== node;

    // no: export { foo as NODE };
    case "ExportSpecifier":
      return parent.exported !== node;

    // no: import { NODE as foo } from "foo";
    case "ImportSpecifier":
      return parent.imported !== node;

    // no: class NODE {}
    case "ClassDeclaration":
    case "ClassExpression":
      return parent.id !== node;

    // yes: class { [NODE](){} }
    case "MethodDefinition":
      return parent.key === node && parent.computed;

    // no: NODE: for (;;) {}
    case "LabeledStatement":
      return false;

    // no: try {} catch (NODE) {}
    case "CatchClause":
      return parent.param !== node;

    // no: function foo(...NODE) {}
    case "RestElement":
      return false;

    // no: [NODE = foo] = [];
    // yes: [foo = NODE] = [];
    case "AssignmentPattern":
      return parent.right === node;

    // no: [NODE] = [];
    // no: ({ NODE }) = [];
    case "ObjectPattern":
    case "ArrayPattern":
      return false;

    // no: import NODE from "bar";
    case "ImportSpecifier":
      return false;

    // no: import * as NODE from "foo";
    case "ImportNamespaceSpecifier":
      return false;
  }

  return true;
}

function isReferencedIdentifier(node, parent, opts) {
  return (t.isIdentifier(node, opts) || t.isJSXIdentifier(node, opts)) && t.isReferenced(node, parent);
}

function isValidIdentifier(name) {
  if (typeof name !== "string" || _esutils2["default"].keyword.isReservedWordES6(name, true)) {
    return false;
  } else {
    return _esutils2["default"].keyword.isIdentifierNameES6(name);
  }
}

function isLet(node) {
  return t.isVariableDeclaration(node) && (node.kind !== "var" || node._let);
}

function isBlockScoped(node) {
  return t.isFunctionDeclaration(node) || t.isClassDeclaration(node) || t.isLet(node);
}

function isVar(node) {
  return t.isVariableDeclaration(node, { kind: "var" }) && !node._let;
}

function isSpecifierDefault(specifier) {
  return t.isImportDefaultSpecifier(specifier) || t.isExportDefaultSpecifier(specifier) || t.isIdentifier(specifier.imported || specifier.exported, { name: "default" });
}

function isScope(node, parent) {
  if (t.isBlockStatement(node) && t.isFunction(parent, { body: node })) {
    return false;
  }

  return t.isScopable(node);
}

function isImmutable(node) {
  if (t.isType(node.type, "Immutable")) return true;

  if (t.isLiteral(node)) {
    if (node.regex) {
      // regexes are mutable
      return false;
    } else {
      // immutable!
      return true;
    }
  } else if (t.isIdentifier(node)) {
    if (node.name === "undefined") {
      // immutable!
      return true;
    } else {
      // no idea...
      return false;
    }
  }

  return false;
}