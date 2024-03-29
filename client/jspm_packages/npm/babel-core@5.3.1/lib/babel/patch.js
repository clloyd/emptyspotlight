/* */ 
"format cjs";
"use strict";

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _estraverse = require("estraverse");

var _estraverse2 = _interopRequireDefault(_estraverse);

var _lodashObjectExtend = require("lodash/object/extend");

var _lodashObjectExtend2 = _interopRequireDefault(_lodashObjectExtend);

var _astTypes = require("ast-types");

var _astTypes2 = _interopRequireDefault(_astTypes);

var _types = require("./types");

var t = _interopRequireWildcard(_types);

// estraverse

_lodashObjectExtend2["default"](_estraverse2["default"].VisitorKeys, t.VISITOR_KEYS);

// regenerator/ast-types

var def = _astTypes2["default"].Type.def;
var or = _astTypes2["default"].Type.or;

//def("File")
//  .bases("Node")
//  .build("program")
//  .field("program", def("Program"));

def("AssignmentPattern").bases("Pattern").build("left", "right").field("left", def("Pattern")).field("right", def("Expression"));

def("RestElement").bases("Pattern").build("argument").field("argument", def("expression"));

def("DoExpression").bases("Expression").build("body").field("body", [def("Statement")]);

def("Super").bases("Expression");

def("ExportDefaultDeclaration").bases("Declaration").build("declaration").field("declaration", or(def("Declaration"), def("Expression"), null));

def("ExportNamedDeclaration").bases("Declaration").build("declaration").field("declaration", or(def("Declaration"), def("Expression"), null)).field("specifiers", [or(def("ExportSpecifier"))]).field("source", or(def("ModuleSpecifier"), null));

def("ExportNamespaceSpecifier").bases("Specifier").field("exported", def("Identifier"));

def("ExportDefaultSpecifier").bases("Specifier").field("exported", def("Identifier"));

def("ExportAllDeclaration").bases("Declaration").build("exported", "source").field("exported", def("Identifier")).field("source", def("Literal"));

_astTypes2["default"].finalize();