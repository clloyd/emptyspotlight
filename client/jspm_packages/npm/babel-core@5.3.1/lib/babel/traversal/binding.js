/* */ 
"format cjs";
"use strict";

exports.__esModule = true;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _types = require("../types");

var t = _interopRequireWildcard(_types);

var Binding = (function () {
  function Binding(_ref) {
    var identifier = _ref.identifier;
    var scope = _ref.scope;
    var path = _ref.path;
    var kind = _ref.kind;

    _classCallCheck(this, Binding);

    this.identifier = identifier;
    this.references = 0;
    this.referenced = false;
    this.constant = true;
    this.scope = scope;
    this.path = path;
    this.kind = kind;
  }

  /**
   * Description
   */

  Binding.prototype.setTypeAnnotation = function setTypeAnnotation() {
    var typeInfo = this.path.getTypeAnnotation();
    this.typeAnnotationInferred = typeInfo.inferred;
    this.typeAnnotation = typeInfo.annotation;
  };

  /**
   * Description
   */

  Binding.prototype.isTypeGeneric = function isTypeGeneric() {
    var _path;

    return (_path = this.path).isTypeGeneric.apply(_path, arguments);
  };

  /**
   * Description
   */

  Binding.prototype.assignTypeGeneric = function assignTypeGeneric(type, params) {
    var typeParams = null;
    if (params) params = t.typeParameterInstantiation(params);
    this.assignType(t.genericTypeAnnotation(t.identifier(type), typeParams));
  };

  /**
   * Description
   */

  Binding.prototype.assignType = function assignType(type) {
    this.typeAnnotation = type;
  };

  /**
   * Description
   */

  Binding.prototype.reassign = function reassign() {
    this.constant = false;

    if (this.typeAnnotationInferred) {
      // destroy the inferred typeAnnotation
      this.typeAnnotation = null;
    }
  };

  /**
   * Description
   */

  Binding.prototype.reference = function reference() {
    this.referenced = true;
    this.references++;
  };

  /**
   * Description
   */

  Binding.prototype.isCompatibleWithType = function isCompatibleWithType(newType) {
    return false;
  };

  return Binding;
})();

exports["default"] = Binding;
module.exports = exports["default"];