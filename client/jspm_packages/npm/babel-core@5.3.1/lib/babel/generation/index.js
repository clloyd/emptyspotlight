/* */ 
"format cjs";
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _detectIndent = require("detect-indent");

var _detectIndent2 = _interopRequireDefault(_detectIndent);

var _whitespace = require("./whitespace");

var _whitespace2 = _interopRequireDefault(_whitespace);

var _repeating = require("repeating");

var _repeating2 = _interopRequireDefault(_repeating);

var _sourceMap = require("./source-map");

var _sourceMap2 = _interopRequireDefault(_sourceMap);

var _position = require("./position");

var _position2 = _interopRequireDefault(_position);

var _messages = require("../messages");

var messages = _interopRequireWildcard(_messages);

var _buffer = require("./buffer");

var _buffer2 = _interopRequireDefault(_buffer);

var _lodashObjectExtend = require("lodash/object/extend");

var _lodashObjectExtend2 = _interopRequireDefault(_lodashObjectExtend);

var _lodashCollectionEach = require("lodash/collection/each");

var _lodashCollectionEach2 = _interopRequireDefault(_lodashCollectionEach);

var _node = require("./node");

var _node2 = _interopRequireDefault(_node);

var _types = require("../types");

var t = _interopRequireWildcard(_types);

var CodeGenerator = (function () {
  function CodeGenerator(ast, opts, code) {
    _classCallCheck(this, CodeGenerator);

    opts = opts || {};

    this.comments = ast.comments || [];
    this.tokens = ast.tokens || [];
    this.format = CodeGenerator.normalizeOptions(code, opts, this.tokens);
    this.opts = opts;
    this.ast = ast;

    this.whitespace = new _whitespace2["default"](this.tokens, this.comments, this.format);
    this.position = new _position2["default"]();
    this.map = new _sourceMap2["default"](this.position, opts, code);
    this.buffer = new _buffer2["default"](this.position, this.format);
  }

  CodeGenerator.normalizeOptions = function normalizeOptions(code, opts, tokens) {
    var style = "  ";
    if (code) {
      var indent = _detectIndent2["default"](code).indent;
      if (indent && indent !== " ") style = indent;
    }

    var format = {
      retainLines: opts.retainLines,
      comments: opts.comments == null || opts.comments,
      compact: opts.compact,
      quotes: CodeGenerator.findCommonStringDelimiter(code, tokens),
      indent: {
        adjustMultilineComment: true,
        style: style,
        base: 0
      }
    };

    if (format.compact === "auto") {
      format.compact = code.length > 100000; // 100KB

      if (format.compact) {
        console.error("[BABEL] " + messages.get("codeGeneratorDeopt", opts.filename, "100KB"));
      }
    }

    return format;
  };

  CodeGenerator.findCommonStringDelimiter = function findCommonStringDelimiter(code, tokens) {
    var occurences = {
      single: 0,
      double: 0
    };

    var checked = 0;

    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];
      if (token.type.label !== "string") continue;
      if (checked >= 3) continue;

      var raw = code.slice(token.start, token.end);
      if (raw[0] === "'") {
        occurences.single++;
      } else {
        occurences.double++;
      }

      checked++;
    }

    if (occurences.single > occurences.double) {
      return "single";
    } else {
      return "double";
    }
  };

  CodeGenerator.prototype.generate = function generate() {
    var ast = this.ast;

    this.print(ast);

    if (ast.comments) {
      var comments = [];
      var _arr = ast.comments;
      for (var _i = 0; _i < _arr.length; _i++) {
        var comment = _arr[_i];
        if (!comment._displayed) comments.push(comment);
      }
      this._printComments(comments);
    }

    return {
      map: this.map.get(),
      code: this.buffer.get()
    };
  };

  CodeGenerator.prototype.buildPrint = function buildPrint(parent) {
    var _this = this;

    var print = function print(node, opts) {
      return _this.print(node, parent, opts);
    };

    print.sequence = function (nodes) {
      var opts = arguments[1] === undefined ? {} : arguments[1];

      opts.statement = true;
      return _this.printJoin(print, nodes, opts);
    };

    print.join = function (nodes, opts) {
      return _this.printJoin(print, nodes, opts);
    };

    print.list = function (items) {
      var opts = arguments[1] === undefined ? {} : arguments[1];

      if (opts.separator == null) opts.separator = ", ";
      print.join(items, opts);
    };

    print.block = function (node) {
      return _this.printBlock(print, node);
    };

    print.indentOnComments = function (node) {
      return _this.printAndIndentOnComments(print, node);
    };

    return print;
  };

  CodeGenerator.prototype.catchUp = function catchUp(node, parent) {
    // catch up to this nodes newline if we're behind
    if (node.loc && this.format.retainLines && this.buffer.buf) {
      var needsParens = false;
      if (parent && this.position.line < node.loc.start.line && t.isTerminatorless(parent)) {
        needsParens = true;
        this._push("(");
      }
      while (this.position.line < node.loc.start.line) {
        this._push("\n");
      }
      return needsParens;
    }
    return false;
  };

  CodeGenerator.prototype.print = function print(node, parent) {
    var _this2 = this;

    var opts = arguments[2] === undefined ? {} : arguments[2];

    if (!node) return;

    if (parent && parent._compact) {
      node._compact = true;
    }

    var oldConcise = this.format.concise;
    if (node._compact) {
      this.format.concise = true;
    }

    var newline = function newline(leading) {
      if (!opts.statement && !_node2["default"].isUserWhitespacable(node, parent)) {
        return;
      }

      var lines = 0;

      if (node.start != null && !node._ignoreUserWhitespace) {
        // user node
        if (leading) {
          lines = _this2.whitespace.getNewlinesBefore(node);
        } else {
          lines = _this2.whitespace.getNewlinesAfter(node);
        }
      } else {
        // generated node
        if (!leading) lines++; // always include at least a single line after
        if (opts.addNewlines) lines += opts.addNewlines(leading, node) || 0;

        var needs = _node2["default"].needsWhitespaceAfter;
        if (leading) needs = _node2["default"].needsWhitespaceBefore;
        if (needs(node, parent)) lines++;

        // generated nodes can't add starting file whitespace
        if (!_this2.buffer.buf) lines = 0;
      }

      _this2.newline(lines);
    };

    if (this[node.type]) {
      var needsNoLineTermParens = _node2["default"].needsParensNoLineTerminator(node, parent);
      var needsParens = needsNoLineTermParens || _node2["default"].needsParens(node, parent);

      if (needsParens) this.push("(");
      if (needsNoLineTermParens) this.indent();

      this.printLeadingComments(node, parent);

      var needsParensFromCatchup = this.catchUp(node, parent);

      newline(true);

      if (opts.before) opts.before();
      this.map.mark(node, "start");

      this[node.type](node, this.buildPrint(node), parent);

      if (needsNoLineTermParens) {
        this.newline();
        this.dedent();
      }
      if (needsParens || needsParensFromCatchup) this.push(")");

      this.map.mark(node, "end");
      if (opts.after) opts.after();

      this.format.concise = oldConcise;

      newline(false);

      this.printTrailingComments(node, parent);
    } else {
      throw new ReferenceError("unknown node of type " + JSON.stringify(node.type) + " with constructor " + JSON.stringify(node && node.constructor.name));
    }
  };

  CodeGenerator.prototype.printJoin = function printJoin(print, nodes) {
    var _this3 = this;

    var opts = arguments[2] === undefined ? {} : arguments[2];

    if (!nodes || !nodes.length) return;

    var len = nodes.length;

    if (opts.indent) this.indent();

    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      print(node, {
        statement: opts.statement,
        addNewlines: opts.addNewlines,
        after: function after() {
          if (opts.iterator) {
            opts.iterator(node, i);
          }

          if (opts.separator && i < len - 1) {
            _this3.push(opts.separator);
          }
        }
      });
    }

    if (opts.indent) this.dedent();
  };

  CodeGenerator.prototype.printAndIndentOnComments = function printAndIndentOnComments(print, node) {
    var indent = !!node.leadingComments;
    if (indent) this.indent();
    print(node);
    if (indent) this.dedent();
  };

  CodeGenerator.prototype.printBlock = function printBlock(print, node) {
    if (t.isEmptyStatement(node)) {
      this.semicolon();
    } else {
      this.push(" ");
      print(node);
    }
  };

  CodeGenerator.prototype.generateComment = function generateComment(comment) {
    var val = comment.value;
    if (comment.type === "Line") {
      val = "//" + val;
    } else {
      val = "/*" + val + "*/";
    }
    return val;
  };

  CodeGenerator.prototype.printTrailingComments = function printTrailingComments(node, parent) {
    this._printComments(this.getComments("trailingComments", node, parent));
  };

  CodeGenerator.prototype.printLeadingComments = function printLeadingComments(node, parent) {
    this._printComments(this.getComments("leadingComments", node, parent));
  };

  CodeGenerator.prototype.getComments = function getComments(key, node, parent) {
    if (t.isExpressionStatement(parent)) {
      return [];
    }

    var comments = [];
    var nodes = [node];

    if (t.isExpressionStatement(node)) {
      nodes.push(node.argument);
    }

    var _arr2 = nodes;
    for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
      var node = _arr2[_i2];
      comments = comments.concat(this._getComments(key, node));
    }

    return comments;
  };

  CodeGenerator.prototype._getComments = function _getComments(key, node) {
    return node && node[key] || [];
  };

  CodeGenerator.prototype._printComments = function _printComments(comments) {
    if (this.format.compact) return;

    if (!this.format.comments) return;
    if (!comments || !comments.length) return;

    var _arr3 = comments;
    for (var _i3 = 0; _i3 < _arr3.length; _i3++) {
      var comment = _arr3[_i3];
      var skip = false;

      if (this.ast.comments) {
        // find the original comment in the ast and set it as displayed
        var _arr4 = this.ast.comments;
        for (var _i4 = 0; _i4 < _arr4.length; _i4++) {
          var origComment = _arr4[_i4];
          if (origComment.start === comment.start) {
            // comment has already been output
            if (origComment._displayed) skip = true;

            origComment._displayed = true;
            break;
          }
        }
      }

      if (skip) return;

      this.catchUp(comment);

      // whitespace before
      this.newline(this.whitespace.getNewlinesBefore(comment));

      var column = this.position.column;
      var val = this.generateComment(comment);

      if (column && !this.isLast(["\n", " ", "[", "{"])) {
        this._push(" ");
        column++;
      }

      //
      if (comment.type === "Block" && this.format.indent.adjustMultilineComment) {
        var offset = comment.loc.start.column;
        if (offset) {
          var newlineRegex = new RegExp("\\n\\s{1," + offset + "}", "g");
          val = val.replace(newlineRegex, "\n");
        }

        var indent = Math.max(this.indentSize(), column);
        val = val.replace(/\n/g, "\n" + _repeating2["default"](" ", indent));
      }

      if (column === 0) {
        val = this.getIndent() + val;
      }

      // force a newline for line comments when retainLines is set in case the next printed node
      // doesn't catch up
      if (this.format.retainLines && comment.type === "Line") {
        val += "\n";
      }

      //
      this._push(val);

      // whitespace after
      this.newline(this.whitespace.getNewlinesAfter(comment));
    }
  };

  _createClass(CodeGenerator, null, [{
    key: "generators",
    value: {
      templateLiterals: require("./generators/template-literals"),
      comprehensions: require("./generators/comprehensions"),
      expressions: require("./generators/expressions"),
      statements: require("./generators/statements"),
      classes: require("./generators/classes"),
      methods: require("./generators/methods"),
      modules: require("./generators/modules"),
      types: require("./generators/types"),
      flow: require("./generators/flow"),
      base: require("./generators/base"),
      jsx: require("./generators/jsx")
    },
    enumerable: true
  }]);

  return CodeGenerator;
})();

_lodashCollectionEach2["default"](_buffer2["default"].prototype, function (fn, key) {
  CodeGenerator.prototype[key] = function () {
    return fn.apply(this.buffer, arguments);
  };
});

_lodashCollectionEach2["default"](CodeGenerator.generators, function (generator) {
  _lodashObjectExtend2["default"](CodeGenerator.prototype, generator);
});

module.exports = function (ast, opts, code) {
  var gen = new CodeGenerator(ast, opts, code);
  return gen.generate();
};

module.exports.CodeGenerator = CodeGenerator;