/* */ 
"format cjs";
"use strict";

exports.__esModule = true;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _transformerPass = require("./transformer-pass");

var _transformerPass2 = _interopRequireDefault(_transformerPass);

var _messages = require("../messages");

var messages = _interopRequireWildcard(_messages);

var _lodashLangIsFunction = require("lodash/lang/isFunction");

var _lodashLangIsFunction2 = _interopRequireDefault(_lodashLangIsFunction);

var _traversal = require("../traversal");

var _traversal2 = _interopRequireDefault(_traversal);

var _lodashLangIsObject = require("lodash/lang/isObject");

var _lodashLangIsObject2 = _interopRequireDefault(_lodashLangIsObject);

var _lodashObjectAssign = require("lodash/object/assign");

var _lodashObjectAssign2 = _interopRequireDefault(_lodashObjectAssign);

var _acorn = require("../../acorn");

var acorn = _interopRequireWildcard(_acorn);

var _file = require("./file");

var _file2 = _interopRequireDefault(_file);

var _lodashCollectionEach = require("lodash/collection/each");

var _lodashCollectionEach2 = _interopRequireDefault(_lodashCollectionEach);

/**
 * This is the class responsible for normalising a transformers handlers
 * as well as constructing a `TransformerPass` that is responsible for
 * actually running the transformer over the provided `File`.
 */

var Transformer = (function () {
  function Transformer(transformerKey, transformer) {
    _classCallCheck(this, Transformer);

    transformer = _lodashObjectAssign2["default"]({}, transformer);

    var take = function take(key) {
      var val = transformer[key];
      delete transformer[key];
      return val;
    };

    this.manipulateOptions = take("manipulateOptions");
    this.metadata = take("metadata") || {};
    this.dependencies = this.metadata.dependencies || [];
    this.parser = take("parser");
    this.post = take("post");
    this.pre = take("pre");

    //

    if (this.metadata.stage != null) {
      this.metadata.optional = true;
    }

    //

    this.handlers = this.normalize(transformer);
    this.key = transformerKey;
  }

  Transformer.prototype.normalize = function normalize(transformer) {
    var _this = this;

    if (_lodashLangIsFunction2["default"](transformer)) {
      transformer = { ast: transformer };
    }

    _traversal2["default"].explode(transformer);

    _lodashCollectionEach2["default"](transformer, function (fns, type) {
      // hidden property
      if (type[0] === "_") {
        _this[type] = fns;
        return;
      }

      if (type === "enter" || type === "exit") return;

      if (_lodashLangIsFunction2["default"](fns)) fns = { enter: fns };

      if (!_lodashLangIsObject2["default"](fns)) return;

      if (!fns.enter) fns.enter = function () {};
      if (!fns.exit) fns.exit = function () {};

      transformer[type] = fns;
    });

    return transformer;
  };

  Transformer.prototype.buildPass = function buildPass(file) {
    // validate Transformer instance
    if (!(file instanceof _file2["default"])) {
      throw new TypeError(messages.get("transformerNotFile", this.key));
    }

    return new _transformerPass2["default"](file, this);
  };

  return Transformer;
})();

exports["default"] = Transformer;
module.exports = exports["default"];