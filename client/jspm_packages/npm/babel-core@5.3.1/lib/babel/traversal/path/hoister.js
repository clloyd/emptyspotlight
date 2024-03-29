/* */ 
"format cjs";
"use strict";

exports.__esModule = true;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _transformationHelpersReact = require("../../transformation/helpers/react");

var react = _interopRequireWildcard(_transformationHelpersReact);

var _types = require("../../types");

var t = _interopRequireWildcard(_types);

var referenceVisitor = {
  enter: function enter(node, parent, scope, state) {
    if (this.isJSXIdentifier() && react.isCompatTag(node.name)) {
      return;
    }

    if (this.isJSXIdentifier() || this.isIdentifier()) {
      // direct references that we need to track to hoist this to the highest scope we can
      if (this.isReferenced()) {
        var bindingInfo = scope.getBinding(node.name);

        // this binding isn't accessible from the parent scope so we can safely ignore it
        // eg. it's in a closure etc
        if (bindingInfo !== state.scope.getBinding(node.name)) return;

        if (bindingInfo && bindingInfo.constant) {
          state.bindings[node.name] = bindingInfo;
        } else {
          state.foundIncompatible = true;
          this.stop();
        }
      }
    }
  }
};

var PathHoister = (function () {
  function PathHoister(path, scope) {
    _classCallCheck(this, PathHoister);

    this.foundIncompatible = false;
    this.bindings = {};
    this.scope = scope;
    this.scopes = [];
    this.path = path;
  }

  PathHoister.prototype.isCompatibleScope = function isCompatibleScope(scope) {
    for (var key in this.bindings) {
      var binding = this.bindings[key];
      if (!scope.bindingIdentifierEquals(key, binding.identifier)) {
        return false;
      }
    }
    return true;
  };

  PathHoister.prototype.getCompatibleScopes = function getCompatibleScopes() {
    var checkScope = this.path.scope;
    do {
      if (this.isCompatibleScope(checkScope)) {
        this.scopes.push(checkScope);
      } else {
        break;
      }
    } while (checkScope = checkScope.parent);
  };

  PathHoister.prototype.getAttachmentPath = function getAttachmentPath() {
    var scopes = this.scopes;

    var scope = scopes.pop();

    if (scope.path.isFunction()) {
      if (this.hasNonParamBindings()) {
        // can't be attached to this scope
        return this.getNextScopeStatementParent();
      } else {
        // needs to be attached to the body
        return scope.path.get("body").get("body")[0];
      }
    } else if (scope.path.isProgram()) {
      return this.getNextScopeStatementParent();
    }
  };

  PathHoister.prototype.getNextScopeStatementParent = function getNextScopeStatementParent() {
    var scope = this.scopes.pop();
    if (scope) return scope.path.getStatementParent();
  };

  PathHoister.prototype.hasNonParamBindings = function hasNonParamBindings() {
    for (var name in this.bindings) {
      var binding = this.bindings[name];
      if (binding.kind !== "param") return true;
    }
    return false;
  };

  PathHoister.prototype.run = function run() {
    var node = this.path.node;
    if (node._hoisted) return;
    node._hoisted = true;

    this.path.traverse(referenceVisitor, this);
    if (this.foundIncompatible) return;

    this.getCompatibleScopes();

    var path = this.getAttachmentPath();
    if (!path) return;

    var uid = path.scope.generateUidIdentifier("ref");

    path.insertBefore([t.variableDeclaration("var", [t.variableDeclarator(uid, this.path.node)])]);

    var parent = this.path.parentPath;

    if (parent.isJSXElement() && this.path.container === parent.node.children) {
      // turning the `span` in `<div><span /></div>` to an expression so we need to wrap it with
      // an expression container
      uid = t.jSXExpressionContainer(uid);
    }

    this.path.replaceWith(uid);
  };

  return PathHoister;
})();

exports["default"] = PathHoister;
module.exports = exports["default"];