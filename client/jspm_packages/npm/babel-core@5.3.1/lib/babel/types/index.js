/* */ 
"format cjs";
"use strict";

exports.__esModule = true;

/**
 * Returns whether `node` is of given `type`.
 *
 * For better performance, use this instead of `is[Type]` when `type` is unknown.
 * Optionally, pass `skipAliasCheck` to directly compare `node.type` with `type`.
 */

exports.is = is;
exports.isType = isType;

/*
 * Description
 */

exports.shallowEqual = shallowEqual;

/**
 * Description
 */

exports.appendToMemberExpression = appendToMemberExpression;

/**
 * Description
 */

exports.prependToMemberExpression = prependToMemberExpression;

/**
 * Description
 */

exports.ensureBlock = ensureBlock;

/**
 * Description
 */

exports.clone = clone;

/**
 * Description
 */

exports.cloneDeep = cloneDeep;

/**
 * Build a function that when called will return whether or not the
 * input `node` `MemberExpression` matches the input `match`.
 *
 * For example, given the match `React.createClass` it would match the
 * parsed nodes of `React.createClass` and `React["createClass"]`.
 */

exports.buildMatchMemberExpression = buildMatchMemberExpression;

/**
 * Description
 */

exports.removeComments = removeComments;

/**
 * Description
 */

exports.inheritsComments = inheritsComments;

/**
 * Description
 */

exports.inherits = inherits;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _toFastProperties = require("to-fast-properties");

var _toFastProperties2 = _interopRequireDefault(_toFastProperties);

var _lodashArrayCompact = require("lodash/array/compact");

var _lodashArrayCompact2 = _interopRequireDefault(_lodashArrayCompact);

var _lodashObjectAssign = require("lodash/object/assign");

var _lodashObjectAssign2 = _interopRequireDefault(_lodashObjectAssign);

var _lodashCollectionEach = require("lodash/collection/each");

var _lodashCollectionEach2 = _interopRequireDefault(_lodashCollectionEach);

var _lodashArrayUniq = require("lodash/array/uniq");

var _lodashArrayUniq2 = _interopRequireDefault(_lodashArrayUniq);

var t = exports;

/**
 * Registers `is[Type]` and `assert[Type]` generated functions for a given `type`.
 * Pass `skipAliasCheck` to force it to directly compare `node.type` with `type`.
 */

function registerType(type, skipAliasCheck) {
  var is = t["is" + type] = function (node, opts) {
    return t.is(type, node, opts, skipAliasCheck);
  };

  t["assert" + type] = function (node, opts) {
    opts = opts || {};
    if (!is(node, opts)) {
      throw new Error("Expected type " + JSON.stringify(type) + " with option " + JSON.stringify(opts));
    }
  };
}

var STATEMENT_OR_BLOCK_KEYS = ["consequent", "body", "alternate"];
exports.STATEMENT_OR_BLOCK_KEYS = STATEMENT_OR_BLOCK_KEYS;
var NATIVE_TYPE_NAMES = ["Array", "ArrayBuffer", "Boolean", "DataView", "Date", "Error", "EvalError", "Float32Array", "Float64Array", "Function", "Int8Array", "Int16Array", "Int32Array", "Map", "Number", "Object", "Proxy", "Promise", "RangeError", "ReferenceError", "RegExp", "Set", "String", "Symbol", "SyntaxError", "TypeError", "Uint8Array", "Uint8ClampedArray", "Uint16Array", "Uint32Array", "URIError", "WeakMap", "WeakSet"];
exports.NATIVE_TYPE_NAMES = NATIVE_TYPE_NAMES;
var FLATTENABLE_KEYS = ["body", "expressions"];
exports.FLATTENABLE_KEYS = FLATTENABLE_KEYS;
var FOR_INIT_KEYS = ["left", "init"];
exports.FOR_INIT_KEYS = FOR_INIT_KEYS;
var COMMENT_KEYS = ["leadingComments", "trailingComments"];

exports.COMMENT_KEYS = COMMENT_KEYS;
var VISITOR_KEYS = require("./visitor-keys");
exports.VISITOR_KEYS = VISITOR_KEYS;
var BUILDER_KEYS = require("./builder-keys");
exports.BUILDER_KEYS = BUILDER_KEYS;
var ALIAS_KEYS = require("./alias-keys");

exports.ALIAS_KEYS = ALIAS_KEYS;
t.FLIPPED_ALIAS_KEYS = {};

_lodashCollectionEach2["default"](t.VISITOR_KEYS, function (keys, type) {
  registerType(type, true);
});

_lodashCollectionEach2["default"](t.ALIAS_KEYS, function (aliases, type) {
  _lodashCollectionEach2["default"](aliases, function (alias) {
    var types = t.FLIPPED_ALIAS_KEYS[alias] = t.FLIPPED_ALIAS_KEYS[alias] || [];
    types.push(type);
  });
});

_lodashCollectionEach2["default"](t.FLIPPED_ALIAS_KEYS, function (types, type) {
  t[type.toUpperCase() + "_TYPES"] = types;
  registerType(type, false);
});

var TYPES = Object.keys(t.VISITOR_KEYS).concat(Object.keys(t.FLIPPED_ALIAS_KEYS));exports.TYPES = TYPES;

function is(type, node, opts, skipAliasCheck) {
  if (!node) return false;

  var matches = isType(node.type, type);
  if (!matches) return false;

  if (typeof opts === "undefined") {
    return true;
  } else {
    return t.shallowEqual(node, opts);
  }
}

function isType(nodeType, targetType) {
  if (nodeType === targetType) return true;

  var aliases = t.FLIPPED_ALIAS_KEYS[targetType];
  if (aliases) {
    if (aliases[0] === nodeType) return true;

    var _arr = aliases;
    for (var _i = 0; _i < _arr.length; _i++) {
      var alias = _arr[_i];
      if (nodeType === alias) return true;
    }
  }

  return false;
}

_lodashCollectionEach2["default"](t.VISITOR_KEYS, function (keys, type) {
  if (t.BUILDER_KEYS[type]) return;

  var defs = {};
  _lodashCollectionEach2["default"](keys, function (key) {
    defs[key] = null;
  });
  t.BUILDER_KEYS[type] = defs;
});

_lodashCollectionEach2["default"](t.BUILDER_KEYS, function (keys, type) {
  t[type[0].toLowerCase() + type.slice(1)] = function () {
    var node = {};
    node.start = null;
    node.type = type;

    var i = 0;

    for (var key in keys) {
      var arg = arguments[i++];
      if (arg === undefined) arg = keys[key];
      node[key] = arg;
    }

    return node;
  };
});
function shallowEqual(actual, expected) {
  var keys = Object.keys(expected);

  var _arr2 = keys;
  for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
    var key = _arr2[_i2];
    if (actual[key] !== expected[key]) {
      return false;
    }
  }

  return true;
}

function appendToMemberExpression(member, append, computed) {
  member.object = t.memberExpression(member.object, member.property, member.computed);
  member.property = append;
  member.computed = !!computed;
  return member;
}

function prependToMemberExpression(member, append) {
  member.object = t.memberExpression(append, member.object);
  return member;
}

function ensureBlock(node) {
  var key = arguments[1] === undefined ? "body" : arguments[1];

  return node[key] = t.toBlock(node[key], node);
}

function clone(node) {
  var newNode = {};
  for (var key in node) {
    if (key[0] === "_") continue;
    newNode[key] = node[key];
  }
  return newNode;
}

function cloneDeep(node) {
  var newNode = {};

  for (var key in node) {
    if (key[0] === "_") continue;

    var val = node[key];

    if (val) {
      if (val.type) {
        val = t.cloneDeep(val);
      } else if (Array.isArray(val)) {
        val = val.map(t.cloneDeep);
      }
    }

    newNode[key] = val;
  }

  return newNode;
}

function buildMatchMemberExpression(match, allowPartial) {
  var parts = match.split(".");

  return function (member) {
    // not a member expression
    if (!t.isMemberExpression(member)) return false;

    var search = [member];
    var i = 0;

    while (search.length) {
      var node = search.shift();

      if (allowPartial && i === parts.length) {
        return true;
      }

      if (t.isIdentifier(node)) {
        // this part doesn't match
        if (parts[i] !== node.name) return false;
      } else if (t.isLiteral(node)) {
        // this part doesn't match
        if (parts[i] !== node.value) return false;
      } else if (t.isMemberExpression(node)) {
        if (node.computed && !t.isLiteral(node.property)) {
          // we can't deal with this
          return false;
        } else {
          search.push(node.object);
          search.push(node.property);
          continue;
        }
      } else {
        // we can't deal with this
        return false;
      }

      // too many parts
      if (++i > parts.length) {
        return false;
      }
    }

    return true;
  };
}

function removeComments(child) {
  var _arr3 = COMMENT_KEYS;

  for (var _i3 = 0; _i3 < _arr3.length; _i3++) {
    var key = _arr3[_i3];
    delete child[key];
  }
  return child;
}

function inheritsComments(child, parent) {
  if (child && parent) {
    var _arr4 = COMMENT_KEYS;

    for (var _i4 = 0; _i4 < _arr4.length; _i4++) {
      var key = _arr4[_i4];
      child[key] = _lodashArrayUniq2["default"](_lodashArrayCompact2["default"]([].concat(child[key], parent[key])));
    }
  }
  return child;
}

function inherits(child, parent) {
  if (!child || !parent) return child;

  child._scopeInfo = parent._scopeInfo;
  child.range = parent.range;
  child.start = parent.start;
  child.loc = parent.loc;
  child.end = parent.end;

  child.typeAnnotation = parent.typeAnnotation;
  child.returnType = parent.returnType;

  t.inheritsComments(child, parent);
  return child;
}

_toFastProperties2["default"](t);
_toFastProperties2["default"](t.VISITOR_KEYS);

exports.__esModule = true;
_lodashObjectAssign2["default"](t, require("./retrievers"));
_lodashObjectAssign2["default"](t, require("./validators"));
_lodashObjectAssign2["default"](t, require("./converters"));