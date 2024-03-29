/* */ 
"format cjs";
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _transformer = require("./transformer");

var _transformer2 = _interopRequireDefault(_transformer);

var _helpersNormalizeAst = require("../helpers/normalize-ast");

var _helpersNormalizeAst2 = _interopRequireDefault(_helpersNormalizeAst);

var _lodashObjectAssign = require("lodash/object/assign");

var _lodashObjectAssign2 = _interopRequireDefault(_lodashObjectAssign);

var _helpersObject = require("../helpers/object");

var _helpersObject2 = _interopRequireDefault(_helpersObject);

var _file = require("./file");

var _file2 = _interopRequireDefault(_file);

var TransformerPipeline = (function () {
  function TransformerPipeline() {
    _classCallCheck(this, TransformerPipeline);

    this.transformers = _helpersObject2["default"]();
    this.namespaces = _helpersObject2["default"]();
    this.deprecated = _helpersObject2["default"]();
    this.aliases = _helpersObject2["default"]();
    this.filters = [];
  }

  TransformerPipeline.prototype.addTransformers = function addTransformers(transformers) {
    for (var key in transformers) {
      this.addTransformer(key, transformers[key]);
    }
    return this;
  };

  TransformerPipeline.prototype.addTransformer = function addTransformer(key, transformer) {
    if (this.transformers[key]) throw new Error(); // todo: error

    var namespace = key.split(".")[0];
    this.namespaces[namespace] = this.namespaces[namespace] || [];
    this.namespaces[namespace].push(key);
    this.namespaces[key] = namespace;

    this.transformers[key] = new _transformer2["default"](key, transformer);
  };

  TransformerPipeline.prototype.addAliases = function addAliases(names) {
    _lodashObjectAssign2["default"](this.aliases, names);
    return this;
  };

  TransformerPipeline.prototype.addDeprecated = function addDeprecated(names) {
    _lodashObjectAssign2["default"](this.deprecated, names);
    return this;
  };

  TransformerPipeline.prototype.addFilter = function addFilter(filter) {
    this.filters.push(filter);
    return this;
  };

  TransformerPipeline.prototype.canTransform = function canTransform(transformer, fileOpts) {
    if (transformer.metadata.plugin) return true;

    var _arr = this.filters;
    for (var _i = 0; _i < _arr.length; _i++) {
      var filter = _arr[_i];
      var result = filter(transformer, fileOpts);
      if (result != null) return result;
    }

    return true;
  };

  TransformerPipeline.prototype.transform = function transform(code, opts) {
    var file = new _file2["default"](opts, this);
    return file.wrap(code, function () {
      file.addCode(code, true);
    });
  };

  TransformerPipeline.prototype.transformFromAst = function transformFromAst(ast, code, opts) {
    ast = _helpersNormalizeAst2["default"](ast);

    var file = new _file2["default"](opts, this);
    return file.wrap(code, function () {
      file.addCode(code);
      file.addAst(ast);
    });
  };

  TransformerPipeline.prototype._ensureTransformerNames = function _ensureTransformerNames(type, rawKeys) {
    var keys = [];

    for (var i = 0; i < rawKeys.length; i++) {
      var key = rawKeys[i];

      var deprecatedKey = this.deprecated[key];
      var aliasKey = this.aliases[key];
      if (aliasKey) {
        keys.push(aliasKey);
      } else if (deprecatedKey) {
        // deprecated key, remap it to the new one
        console.error("[BABEL] The transformer " + key + " has been renamed to " + deprecatedKey);
        rawKeys.push(deprecatedKey);
      } else if (this.transformers[key]) {
        // valid key
        keys.push(key);
      } else if (this.namespaces[key]) {
        // namespace, append all transformers within this namespace
        keys = keys.concat(this.namespaces[key]);
      } else {
        // invalid key
        throw new ReferenceError("Unknown transformer " + key + " specified in " + type);
      }
    }

    return keys;
  };

  return TransformerPipeline;
})();

exports["default"] = TransformerPipeline;
module.exports = exports["default"];