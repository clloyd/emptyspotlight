/* */ 
"format cjs";
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _stripJsonComments = require("strip-json-comments");

var _stripJsonComments2 = _interopRequireDefault(_stripJsonComments);

var _lodashObjectMerge = require("lodash/object/merge");

var _lodashObjectMerge2 = _interopRequireDefault(_lodashObjectMerge);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var cache = {};
var jsons = {};

function exists(filename) {
  if (!_fs2["default"].existsSync) return false;

  var cached = cache[filename];
  if (cached != null) return cached;
  return cache[filename] = _fs2["default"].existsSync(filename);
}

exports["default"] = function (loc) {
  var opts = arguments[1] === undefined ? {} : arguments[1];

  var rel = ".babelrc";

  if (!opts.babelrc) {
    opts.babelrc = [];
  }

  function find(start, rel) {
    var file = _path2["default"].join(start, rel);

    if (opts.babelrc.indexOf(file) >= 0) {
      return;
    }

    if (exists(file)) {
      var content = _fs2["default"].readFileSync(file, "utf8");
      var json;

      try {
        json = jsons[content] = jsons[content] || JSON.parse(_stripJsonComments2["default"](content));
      } catch (err) {
        err.message = "" + file + ": " + err.message;
        throw err;
      }

      opts.babelrc.push(file);

      if (json.breakConfig) return;
      _lodashObjectMerge2["default"](opts, json, function (a, b) {
        if (Array.isArray(a)) {
          var c = a.slice(0);
          for (var _iterator = b, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
            var _ref;

            if (_isArray) {
              if (_i >= _iterator.length) break;
              _ref = _iterator[_i++];
            } else {
              _i = _iterator.next();
              if (_i.done) break;
              _ref = _i.value;
            }

            var v = _ref;

            if (a.indexOf(v) < 0) {
              c.push(v);
            }
          }
          return c;
        }
      });
    }

    var up = _path2["default"].dirname(start);
    if (up !== start) {
      // root
      find(up, rel);
    }
  }

  if (opts.babelrc.indexOf(loc) < 0 && opts.breakConfig !== true) {
    find(loc, rel);
  }

  return opts;
};

;
module.exports = exports["default"];