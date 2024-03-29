/* */ 
"format cjs";
"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _debugNode = require("debug/node");

var _debugNode2 = _interopRequireDefault(_debugNode);

var verboseDebug = _debugNode2["default"]("babel:verbose");
var generalDebug = _debugNode2["default"]("babel");

var Logger = (function () {
  function Logger(file, filename) {
    _classCallCheck(this, Logger);

    this.filename = filename;
    this.file = file;
  }

  Logger.prototype._buildMessage = function _buildMessage(msg) {
    var parts = "[BABEL] " + this.filename;
    if (msg) parts += ": " + msg;
    return parts;
  };

  Logger.prototype.error = function error(msg) {
    var Constructor = arguments[1] === undefined ? Error : arguments[1];

    throw new Constructor(this._buildMessage(msg));
  };

  Logger.prototype.deprecate = function deprecate(msg) {
    if (!this.file.opts.suppressDeprecationMessages) {
      console.error(this._buildMessage(msg));
    }
  };

  Logger.prototype.verbose = function verbose(msg) {
    if (verboseDebug.enabled) verboseDebug(this._buildMessage(msg));
  };

  Logger.prototype.debug = function debug(msg) {
    if (generalDebug.enabled) generalDebug(this._buildMessage(msg));
  };

  Logger.prototype.deopt = function deopt(node, msg) {
    this.debug(msg);
  };

  return Logger;
})();

exports["default"] = Logger;
module.exports = exports["default"];