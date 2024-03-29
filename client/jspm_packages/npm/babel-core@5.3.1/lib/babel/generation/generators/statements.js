/* */ 
"format cjs";
"use strict";

exports.__esModule = true;
exports.WithStatement = WithStatement;
exports.IfStatement = IfStatement;
exports.ForStatement = ForStatement;
exports.WhileStatement = WhileStatement;
exports.DoWhileStatement = DoWhileStatement;
exports.LabeledStatement = LabeledStatement;
exports.TryStatement = TryStatement;
exports.CatchClause = CatchClause;
exports.ThrowStatement = ThrowStatement;
exports.SwitchStatement = SwitchStatement;
exports.SwitchCase = SwitchCase;
exports.DebuggerStatement = DebuggerStatement;
exports.VariableDeclaration = VariableDeclaration;
exports.VariableDeclarator = VariableDeclarator;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _repeating = require("repeating");

var _repeating2 = _interopRequireDefault(_repeating);

var _types = require("../../types");

var t = _interopRequireWildcard(_types);

function WithStatement(node, print) {
  this.keyword("with");
  this.push("(");
  print(node.object);
  this.push(")");
  print.block(node.body);
}

function IfStatement(node, print) {
  this.keyword("if");
  this.push("(");
  print(node.test);
  this.push(")");
  this.space();

  print.indentOnComments(node.consequent);

  if (node.alternate) {
    if (this.isLast("}")) this.space();
    this.push("else ");
    print.indentOnComments(node.alternate);
  }
}

function ForStatement(node, print) {
  this.keyword("for");
  this.push("(");

  print(node.init);
  this.push(";");

  if (node.test) {
    this.push(" ");
    print(node.test);
  }
  this.push(";");

  if (node.update) {
    this.push(" ");
    print(node.update);
  }

  this.push(")");
  print.block(node.body);
}

function WhileStatement(node, print) {
  this.keyword("while");
  this.push("(");
  print(node.test);
  this.push(")");
  print.block(node.body);
}

var buildForXStatement = function buildForXStatement(op) {
  return function (node, print) {
    this.keyword("for");
    this.push("(");
    print(node.left);
    this.push(" " + op + " ");
    print(node.right);
    this.push(")");
    print.block(node.body);
  };
};

var ForInStatement = buildForXStatement("in");
exports.ForInStatement = ForInStatement;
var ForOfStatement = buildForXStatement("of");

exports.ForOfStatement = ForOfStatement;

function DoWhileStatement(node, print) {
  this.push("do ");
  print(node.body);
  this.space();
  this.keyword("while");
  this.push("(");
  print(node.test);
  this.push(");");
}

var buildLabelStatement = function buildLabelStatement(prefix, key) {
  return function (node, print) {
    this.push(prefix);

    var label = node[key || "label"];
    if (label) {
      this.push(" ");
      print(label);
    }

    this.semicolon();
  };
};

var ContinueStatement = buildLabelStatement("continue");
exports.ContinueStatement = ContinueStatement;
var ReturnStatement = buildLabelStatement("return", "argument");
exports.ReturnStatement = ReturnStatement;
var BreakStatement = buildLabelStatement("break");

exports.BreakStatement = BreakStatement;

function LabeledStatement(node, print) {
  print(node.label);
  this.push(": ");
  print(node.body);
}

function TryStatement(node, print) {
  this.keyword("try");
  print(node.block);
  this.space();

  // Esprima bug puts the catch clause in a `handlers` array.
  // see https://code.google.com/p/esprima/issues/detail?id=433
  // We run into this from regenerator generated ast.
  if (node.handlers) {
    print(node.handlers[0]);
  } else {
    print(node.handler);
  }

  if (node.finalizer) {
    this.space();
    this.push("finally ");
    print(node.finalizer);
  }
}

function CatchClause(node, print) {
  this.keyword("catch");
  this.push("(");
  print(node.param);
  this.push(") ");
  print(node.body);
}

function ThrowStatement(node, print) {
  this.push("throw ");
  print(node.argument);
  this.semicolon();
}

function SwitchStatement(node, print) {
  this.keyword("switch");
  this.push("(");
  print(node.discriminant);
  this.push(")");
  this.space();
  this.push("{");

  print.sequence(node.cases, {
    indent: true,
    addNewlines: function addNewlines(leading, cas) {
      if (!leading && node.cases[node.cases.length - 1] === cas) return -1;
    }
  });

  this.push("}");
}

function SwitchCase(node, print) {
  if (node.test) {
    this.push("case ");
    print(node.test);
    this.push(":");
  } else {
    this.push("default:");
  }

  if (node.consequent.length) {
    this.newline();
    print.sequence(node.consequent, { indent: true });
  }
}

function DebuggerStatement() {
  this.push("debugger;");
}

function VariableDeclaration(node, print, parent) {
  this.push(node.kind + " ");

  var hasInits = false;
  // don't add whitespace to loop heads
  if (!t.isFor(parent)) {
    var _arr = node.declarations;

    for (var _i = 0; _i < _arr.length; _i++) {
      var declar = _arr[_i];
      if (declar.init) {
        // has an init so let's split it up over multiple lines
        hasInits = true;
      }
    }
  }

  var sep = ",";
  if (!this.format.compact && !this.format.concise && hasInits && !this.format.retainLines) {
    sep += "\n" + _repeating2["default"](" ", node.kind.length + 1);
  } else {
    sep += " ";
  }

  print.list(node.declarations, { separator: sep });

  if (t.isFor(parent)) {
    if (parent.left === node || parent.init === node) return;
  }

  this.semicolon();
}

function VariableDeclarator(node, print) {
  print(node.id);
  print(node.id.typeAnnotation);
  if (node.init) {
    this.space();
    this.push("=");
    this.space();
    print(node.init);
  }
}