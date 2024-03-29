/* */ 
"format cjs";
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _lodashCollectionIncludes = require("lodash/collection/includes");

var _lodashCollectionIncludes2 = _interopRequireDefault(_lodashCollectionIncludes);

var _traversal = require("../traversal");

var _traversal2 = _interopRequireDefault(_traversal);

/**
 * This class is responsible for traversing over the provided `File`s
 * AST and running it's parent transformers handlers over it.
 */

var TransformerPass = (function () {
  function TransformerPass(file, transformer) {
    _classCallCheck(this, TransformerPass);

    this.transformer = transformer;
    this.handlers = transformer.handlers;
    this.file = file;
    this.ran = false;
    this.key = transformer.key;
  }

  TransformerPass.prototype.canTransform = function canTransform() {
    return this.file.transformerDependencies[this.key] || this.file.pipeline.canTransform(this.transformer, this.file.opts);
  };

  TransformerPass.prototype.transform = function transform() {
    var file = this.file;

    file.log.debug("Start transformer " + this.key);

    _traversal2["default"](file.ast, this.handlers, file.scope, file);

    file.log.debug("Finish transformer " + this.key);

    this.ran = true;
  };

  return TransformerPass;
})();

exports["default"] = TransformerPass;
module.exports = exports["default"];