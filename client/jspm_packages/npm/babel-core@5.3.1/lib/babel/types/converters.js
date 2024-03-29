/* */ 
"format cjs";
"use strict";

exports.__esModule = true;

/**
 * Description
 */

exports.toComputedKey = toComputedKey;

/**
 * Turn an array of statement `nodes` into a `SequenceExpression`.
 *
 * Variable declarations are turned into simple assignments and their
 * declarations hoisted to the top of the current scope.
 *
 * Expression statements are just resolved to their expression.
 */

exports.toSequenceExpression = toSequenceExpression;

/**
 * Description
 */

exports.toKeyAlias = toKeyAlias;

/*
 * Description
 */

exports.toIdentifier = toIdentifier;

/**
 * Description
 *
 * @returns {Object|Boolean}
 */

exports.toStatement = toStatement;

/**
 * Description
 */

exports.toExpression = toExpression;

/**
 * Description
 */

exports.toBlock = toBlock;

/**
 * Description
 */

exports.valueToNode = valueToNode;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _lodashLangIsPlainObject = require("lodash/lang/isPlainObject");

var _lodashLangIsPlainObject2 = _interopRequireDefault(_lodashLangIsPlainObject);

var _lodashLangIsNumber = require("lodash/lang/isNumber");

var _lodashLangIsNumber2 = _interopRequireDefault(_lodashLangIsNumber);

var _lodashLangIsRegExp = require("lodash/lang/isRegExp");

var _lodashLangIsRegExp2 = _interopRequireDefault(_lodashLangIsRegExp);

var _lodashLangIsString = require("lodash/lang/isString");

var _lodashLangIsString2 = _interopRequireDefault(_lodashLangIsString);

var _traversal = require("../traversal");

var _traversal2 = _interopRequireDefault(_traversal);

var _lodashCollectionEach = require("lodash/collection/each");

var _lodashCollectionEach2 = _interopRequireDefault(_lodashCollectionEach);

var _index = require("./index");

var t = _interopRequireWildcard(_index);

function toComputedKey(node) {
  var key = arguments[1] === undefined ? node.key || node.property : arguments[1];
  return (function () {
    if (!node.computed) {
      if (t.isIdentifier(key)) key = t.literal(key.name);
    }
    return key;
  })();
}

function toSequenceExpression(nodes, scope) {
  var declars = [];
  var bailed = false;

  var result = convert(nodes);
  if (bailed) return;

  for (var i = 0; i < declars.length; i++) {
    scope.push(declars[i]);
  }

  return result;

  function convert(nodes) {
    var ensureLastUndefined = false;
    var exprs = [];

    var _arr = nodes;
    for (var _i = 0; _i < _arr.length; _i++) {
      var node = _arr[_i];
      if (t.isExpression(node)) {
        exprs.push(node);
      } else if (t.isExpressionStatement(node)) {
        exprs.push(node.expression);
      } else if (t.isVariableDeclaration(node)) {
        if (node.kind !== "var") return bailed = true; // bailed

        var _arr2 = node.declarations;
        for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
          var declar = _arr2[_i2];
          var bindings = t.getBindingIdentifiers(declar);
          for (var key in bindings) {
            declars.push({
              kind: node.kind,
              id: bindings[key]
            });
          }

          if (declar.init) {
            exprs.push(t.assignmentExpression("=", declar.id, declar.init));
          }
        }

        ensureLastUndefined = true;
        continue;
      } else if (t.isIfStatement(node)) {
        var consequent = node.consequent ? convert([node.consequent]) : t.identifier("undefined");
        var alternate = node.alternate ? convert([node.alternate]) : t.identifier("undefined");
        if (!consequent || !alternate) return bailed = true;

        exprs.push(t.conditionalExpression(node.test, consequent, alternate));
      } else if (t.isBlockStatement(node)) {
        exprs.push(convert(node.body));
      } else {
        // bailed, we can't understand this
        return bailed = true;
      }

      ensureLastUndefined = false;
    }

    if (ensureLastUndefined) {
      exprs.push(t.identifier("undefined"));
    }

    //

    if (exprs.length === 1) {
      return exprs[0];
    } else {
      return t.sequenceExpression(exprs);
    }
  }
}

function toKeyAlias(node) {
  var key = arguments[1] === undefined ? node.key : arguments[1];
  return (function () {
    var alias;
    if (t.isIdentifier(key)) {
      alias = key.name;
    } else if (t.isLiteral(key)) {
      alias = JSON.stringify(key.value);
    } else {
      alias = JSON.stringify(_traversal2["default"].removeProperties(t.cloneDeep(key)));
    }
    if (node.computed) alias = "[" + alias + "]";
    return alias;
  })();
}

function toIdentifier(name) {
  if (t.isIdentifier(name)) return name.name;

  name = name + "";

  // replace all non-valid identifiers with dashes
  name = name.replace(/[^a-zA-Z0-9$_]/g, "-");

  // remove all dashes and numbers from start of name
  name = name.replace(/^[-0-9]+/, "");

  // camel case
  name = name.replace(/[-\s]+(.)?/g, function (match, c) {
    return c ? c.toUpperCase() : "";
  });

  if (!t.isValidIdentifier(name)) {
    name = "_" + name;
  }

  return name || "_";
}

function toStatement(node, ignore) {
  if (t.isStatement(node)) {
    return node;
  }

  var mustHaveId = false;
  var newType;

  if (t.isClass(node)) {
    mustHaveId = true;
    newType = "ClassDeclaration";
  } else if (t.isFunction(node)) {
    mustHaveId = true;
    newType = "FunctionDeclaration";
  } else if (t.isAssignmentExpression(node)) {
    return t.expressionStatement(node);
  }

  if (mustHaveId && !node.id) {
    newType = false;
  }

  if (!newType) {
    if (ignore) {
      return false;
    } else {
      throw new Error("cannot turn " + node.type + " to a statement");
    }
  }

  node.type = newType;

  return node;
}

function toExpression(node) {
  if (t.isExpressionStatement(node)) {
    node = node.expression;
  }

  if (t.isClass(node)) {
    node.type = "ClassExpression";
  } else if (t.isFunction(node)) {
    node.type = "FunctionExpression";
  }

  if (t.isExpression(node)) {
    return node;
  } else {
    throw new Error("cannot turn " + node.type + " to an expression");
  }
}

function toBlock(node, parent) {
  if (t.isBlockStatement(node)) {
    return node;
  }

  if (t.isEmptyStatement(node)) {
    node = [];
  }

  if (!Array.isArray(node)) {
    if (!t.isStatement(node)) {
      if (t.isFunction(parent)) {
        node = t.returnStatement(node);
      } else {
        node = t.expressionStatement(node);
      }
    }

    node = [node];
  }

  return t.blockStatement(node);
}

function valueToNode(value) {
  if (value === undefined) {
    return t.identifier("undefined");
  }

  if (value === true || value === false || value === null || _lodashLangIsString2["default"](value) || _lodashLangIsNumber2["default"](value) || _lodashLangIsRegExp2["default"](value)) {
    return t.literal(value);
  }

  if (Array.isArray(value)) {
    return t.arrayExpression(value.map(t.valueToNode));
  }

  if (_lodashLangIsPlainObject2["default"](value)) {
    var props = [];
    for (var key in value) {
      var nodeKey;
      if (t.isValidIdentifier(key)) {
        nodeKey = t.identifier(key);
      } else {
        nodeKey = t.literal(key);
      }
      props.push(t.property("init", nodeKey, t.valueToNode(value[key])));
    }
    return t.objectExpression(props);
  }

  throw new Error("don't know how to turn this value into a node");
}