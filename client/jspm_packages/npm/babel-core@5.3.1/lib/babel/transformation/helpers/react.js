/* */ 
"format cjs";
"use strict";

exports.__esModule = true;
exports.isCreateClass = isCreateClass;
exports.isCompatTag = isCompatTag;
exports.buildChildren = buildChildren;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _lodashLangIsString = require("lodash/lang/isString");

var _lodashLangIsString2 = _interopRequireDefault(_lodashLangIsString);

var _types = require("../../types");

var t = _interopRequireWildcard(_types);

var isCreateClassCallExpression = t.buildMatchMemberExpression("React.createClass");

function isCreateClass(node) {
  if (!node || !t.isCallExpression(node)) return false;

  // not React.createClass call member object
  if (!isCreateClassCallExpression(node.callee)) return false;

  // no call arguments
  var args = node.arguments;
  if (args.length !== 1) return false;

  // first node arg is not an object
  var first = args[0];
  if (!t.isObjectExpression(first)) return false;

  return true;
}

var isReactComponent = t.buildMatchMemberExpression("React.Component");

exports.isReactComponent = isReactComponent;

function isCompatTag(tagName) {
  return tagName && /^[a-z]|\-/.test(tagName);
}

function isStringLiteral(node) {
  return t.isLiteral(node) && _lodashLangIsString2["default"](node.value);
}

function cleanJSXElementLiteralChild(child, args) {
  var lines = child.value.split(/\r\n|\n|\r/);

  var lastNonEmptyLine = 0;

  for (var i = 0; i < lines.length; i++) {
    if (lines[i].match(/[^ \t]/)) {
      lastNonEmptyLine = i;
    }
  }

  var str = "";

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];

    var isFirstLine = i === 0;
    var isLastLine = i === lines.length - 1;
    var isLastNonEmptyLine = i === lastNonEmptyLine;

    // replace rendered whitespace tabs with spaces
    var trimmedLine = line.replace(/\t/g, " ");

    // trim whitespace touching a newline
    if (!isFirstLine) {
      trimmedLine = trimmedLine.replace(/^[ ]+/, "");
    }

    // trim whitespace touching an endline
    if (!isLastLine) {
      trimmedLine = trimmedLine.replace(/[ ]+$/, "");
    }

    if (trimmedLine) {
      if (!isLastNonEmptyLine) {
        trimmedLine += " ";
      }

      str += trimmedLine;
    }
  }

  if (str) args.push(t.literal(str));
}

function buildChildren(node) {
  var elems = [];

  for (var i = 0; i < node.children.length; i++) {
    var child = node.children[i];

    if (t.isLiteral(child) && typeof child.value === "string") {
      cleanJSXElementLiteralChild(child, elems);
      continue;
    }

    if (t.isJSXExpressionContainer(child)) child = child.expression;
    if (t.isJSXEmptyExpression(child)) continue;

    elems.push(child);
  }

  return elems;
}