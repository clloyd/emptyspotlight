/* */ 
"format cjs";
"use strict";

exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _identifier = require("./identifier");

var _tokentype = require("./tokentype");

var _state = require("./state");

var _location = require("./location");

var _whitespace = require("./whitespace");

// Object type used to represent tokens. Note that normally, tokens
// simply exist as properties on the parser object. This is only
// used for the onToken callback and the external tokenizer.

var Token = function Token(p) {
  _classCallCheck(this, Token);

  this.type = p.type;
  this.value = p.value;
  this.start = p.start;
  this.end = p.end;
  if (p.options.locations) this.loc = new _location.SourceLocation(p, p.startLoc, p.endLoc);
  if (p.options.ranges) this.range = [p.start, p.end];
};

exports.Token = Token;

// ## Tokenizer

var pp = _state.Parser.prototype;

// Move to the next token

pp.next = function () {
  if (this.options.onToken && !this.isLookahead) this.options.onToken(new Token(this));

  this.lastTokEnd = this.end;
  this.lastTokStart = this.start;
  this.lastTokEndLoc = this.endLoc;
  this.lastTokStartLoc = this.startLoc;
  this.nextToken();
};

pp.getToken = function () {
  this.next();
  return new Token(this);
};

// If we're in an ES6 environment, make parsers iterable
if (typeof Symbol !== "undefined") pp[Symbol.iterator] = function () {
  var self = this;
  return { next: function next() {
      var token = self.getToken();
      return {
        done: token.type === _tokentype.types.eof,
        value: token
      };
    } };
};

// Toggle strict mode. Re-reads the next number or string to please
// pedantic tests (`"use strict"; 010;` should fail).

pp.setStrict = function (strict) {
  this.strict = strict;
  if (this.type !== _tokentype.types.num && this.type !== _tokentype.types.string) return;
  this.pos = this.start;
  if (this.options.locations) {
    while (this.pos < this.lineStart) {
      this.lineStart = this.input.lastIndexOf("\n", this.lineStart - 2) + 1;
      --this.curLine;
    }
  }
  this.nextToken();
};

pp.curContext = function () {
  return this.context[this.context.length - 1];
};

// Read a single token, updating the parser object's token-related
// properties.

pp.nextToken = function () {
  var curContext = this.curContext();
  if (!curContext || !curContext.preserveSpace) this.skipSpace();

  this.start = this.pos;
  if (this.options.locations) this.startLoc = this.curPosition();
  if (this.pos >= this.input.length) return this.finishToken(_tokentype.types.eof);

  if (curContext.override) return curContext.override(this);else this.readToken(this.fullCharCodeAtPos());
};

pp.readToken = function (code) {
  // Identifier or keyword. '\uXXXX' sequences are allowed in
  // identifiers, so '\' also dispatches to that.
  if (_identifier.isIdentifierStart(code, this.options.ecmaVersion >= 6) || code === 92 /* '\' */) return this.readWord();

  return this.getTokenFromCode(code);
};

pp.fullCharCodeAtPos = function () {
  var code = this.input.charCodeAt(this.pos);
  if (code <= 55295 || code >= 57344) return code;
  var next = this.input.charCodeAt(this.pos + 1);
  return (code << 10) + next - 56613888;
};

pp.skipBlockComment = function () {
  var startLoc = this.options.onComment && this.options.locations && this.curPosition();
  var start = this.pos,
      end = this.input.indexOf("*/", this.pos += 2);
  if (end === -1) this.raise(this.pos - 2, "Unterminated comment");
  this.pos = end + 2;
  if (this.options.locations) {
    _whitespace.lineBreakG.lastIndex = start;
    var match = undefined;
    while ((match = _whitespace.lineBreakG.exec(this.input)) && match.index < this.pos) {
      ++this.curLine;
      this.lineStart = match.index + match[0].length;
    }
  }
  if (this.options.onComment) this.options.onComment(true, this.input.slice(start + 2, end), start, this.pos, startLoc, this.options.locations && this.curPosition());
};

pp.skipLineComment = function (startSkip) {
  var start = this.pos;
  var startLoc = this.options.onComment && this.options.locations && this.curPosition();
  var ch = this.input.charCodeAt(this.pos += startSkip);
  while (this.pos < this.input.length && ch !== 10 && ch !== 13 && ch !== 8232 && ch !== 8233) {
    ++this.pos;
    ch = this.input.charCodeAt(this.pos);
  }
  if (this.options.onComment) this.options.onComment(false, this.input.slice(start + startSkip, this.pos), start, this.pos, startLoc, this.options.locations && this.curPosition());
};

// Called at the start of the parse and after every token. Skips
// whitespace and comments, and.

pp.skipSpace = function () {
  while (this.pos < this.input.length) {
    var ch = this.input.charCodeAt(this.pos);
    if (ch === 32) {
      // ' '
      ++this.pos;
    } else if (ch === 13) {
      ++this.pos;
      var _next = this.input.charCodeAt(this.pos);
      if (_next === 10) {
        ++this.pos;
      }
      if (this.options.locations) {
        ++this.curLine;
        this.lineStart = this.pos;
      }
    } else if (ch === 10 || ch === 8232 || ch === 8233) {
      ++this.pos;
      if (this.options.locations) {
        ++this.curLine;
        this.lineStart = this.pos;
      }
    } else if (ch > 8 && ch < 14) {
      ++this.pos;
    } else if (ch === 47) {
      // '/'
      var _next2 = this.input.charCodeAt(this.pos + 1);
      if (_next2 === 42) {
        // '*'
        this.skipBlockComment();
      } else if (_next2 === 47) {
        // '/'
        this.skipLineComment(2);
      } else break;
    } else if (ch === 160) {
      // '\xa0'
      ++this.pos;
    } else if (ch >= 5760 && _whitespace.nonASCIIwhitespace.test(String.fromCharCode(ch))) {
      ++this.pos;
    } else {
      break;
    }
  }
};

// Called at the end of every token. Sets `end`, `val`, and
// maintains `context` and `exprAllowed`, and skips the space after
// the token, so that the next one's `start` will point at the
// right position.

pp.finishToken = function (type, val) {
  this.end = this.pos;
  if (this.options.locations) this.endLoc = this.curPosition();
  var prevType = this.type;
  this.type = type;
  this.value = val;

  this.updateContext(prevType);
};

// ### Token reading

// This is the function that is called to fetch the next token. It
// is somewhat obscure, because it works in character codes rather
// than characters, and because operator parsing has been inlined
// into it.
//
// All in the name of speed.
//
pp.readToken_dot = function () {
  var next = this.input.charCodeAt(this.pos + 1);
  if (next >= 48 && next <= 57) return this.readNumber(true);
  var next2 = this.input.charCodeAt(this.pos + 2);
  if (this.options.ecmaVersion >= 6 && next === 46 && next2 === 46) {
    // 46 = dot '.'
    this.pos += 3;
    return this.finishToken(_tokentype.types.ellipsis);
  } else {
    ++this.pos;
    return this.finishToken(_tokentype.types.dot);
  }
};

pp.readToken_slash = function () {
  // '/'
  var next = this.input.charCodeAt(this.pos + 1);
  if (this.exprAllowed) {
    ++this.pos;return this.readRegexp();
  }
  if (next === 61) return this.finishOp(_tokentype.types.assign, 2);
  return this.finishOp(_tokentype.types.slash, 1);
};

pp.readToken_mult_modulo = function (code) {
  // '%*'
  var type = code === 42 ? _tokentype.types.star : _tokentype.types.modulo;
  var width = 1;
  var next = this.input.charCodeAt(this.pos + 1);

  if (next === 42) {
    // '*'
    width++;
    next = this.input.charCodeAt(this.pos + 2);
    type = _tokentype.types.exponent;
  }

  if (next === 61) {
    width++;
    type = _tokentype.types.assign;
  }

  return this.finishOp(type, width);
};

pp.readToken_pipe_amp = function (code) {
  // '|&'
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === code) return this.finishOp(code === 124 ? _tokentype.types.logicalOR : _tokentype.types.logicalAND, 2);
  if (next === 61) return this.finishOp(_tokentype.types.assign, 2);
  return this.finishOp(code === 124 ? _tokentype.types.bitwiseOR : _tokentype.types.bitwiseAND, 1);
};

pp.readToken_caret = function () {
  // '^'
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === 61) return this.finishOp(_tokentype.types.assign, 2);
  return this.finishOp(_tokentype.types.bitwiseXOR, 1);
};

pp.readToken_plus_min = function (code) {
  // '+-'
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === code) {
    if (next == 45 && this.input.charCodeAt(this.pos + 2) == 62 && _whitespace.lineBreak.test(this.input.slice(this.lastTokEnd, this.pos))) {
      // A `-->` line comment
      this.skipLineComment(3);
      this.skipSpace();
      return this.nextToken();
    }
    return this.finishOp(_tokentype.types.incDec, 2);
  }
  if (next === 61) return this.finishOp(_tokentype.types.assign, 2);
  return this.finishOp(_tokentype.types.plusMin, 1);
};

pp.readToken_lt_gt = function (code) {
  // '<>'
  var next = this.input.charCodeAt(this.pos + 1);
  var size = 1;
  if (next === code) {
    size = code === 62 && this.input.charCodeAt(this.pos + 2) === 62 ? 3 : 2;
    if (this.input.charCodeAt(this.pos + size) === 61) return this.finishOp(_tokentype.types.assign, size + 1);
    return this.finishOp(_tokentype.types.bitShift, size);
  }
  if (next == 33 && code == 60 && this.input.charCodeAt(this.pos + 2) == 45 && this.input.charCodeAt(this.pos + 3) == 45) {
    if (this.inModule) this.unexpected();
    // `<!--`, an XML-style comment that should be interpreted as a line comment
    this.skipLineComment(4);
    this.skipSpace();
    return this.nextToken();
  }
  if (next === 61) size = this.input.charCodeAt(this.pos + 2) === 61 ? 3 : 2;
  return this.finishOp(_tokentype.types.relational, size);
};

pp.readToken_eq_excl = function (code) {
  // '=!'
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === 61) return this.finishOp(_tokentype.types.equality, this.input.charCodeAt(this.pos + 2) === 61 ? 3 : 2);
  if (code === 61 && next === 62 && this.options.ecmaVersion >= 6) {
    // '=>'
    this.pos += 2;
    return this.finishToken(_tokentype.types.arrow);
  }
  return this.finishOp(code === 61 ? _tokentype.types.eq : _tokentype.types.prefix, 1);
};

pp.getTokenFromCode = function (code) {
  switch (code) {
    // The interpretation of a dot depends on whether it is followed
    // by a digit or another two dots.
    case 46:
      // '.'
      return this.readToken_dot();

    // Punctuation tokens.
    case 40:
      ++this.pos;return this.finishToken(_tokentype.types.parenL);
    case 41:
      ++this.pos;return this.finishToken(_tokentype.types.parenR);
    case 59:
      ++this.pos;return this.finishToken(_tokentype.types.semi);
    case 44:
      ++this.pos;return this.finishToken(_tokentype.types.comma);
    case 91:
      ++this.pos;return this.finishToken(_tokentype.types.bracketL);
    case 93:
      ++this.pos;return this.finishToken(_tokentype.types.bracketR);
    case 123:
      ++this.pos;return this.finishToken(_tokentype.types.braceL);
    case 125:
      ++this.pos;return this.finishToken(_tokentype.types.braceR);
    case 58:
      ++this.pos;return this.finishToken(_tokentype.types.colon);
    case 63:
      ++this.pos;return this.finishToken(_tokentype.types.question);
    case 64:
      ++this.pos;return this.finishToken(_tokentype.types.at);

    case 96:
      // '`'
      if (this.options.ecmaVersion < 6) break;
      ++this.pos;
      return this.finishToken(_tokentype.types.backQuote);

    case 48:
      // '0'
      var next = this.input.charCodeAt(this.pos + 1);
      if (next === 120 || next === 88) return this.readRadixNumber(16); // '0x', '0X' - hex number
      if (this.options.ecmaVersion >= 6) {
        if (next === 111 || next === 79) return this.readRadixNumber(8); // '0o', '0O' - octal number
        if (next === 98 || next === 66) return this.readRadixNumber(2); // '0b', '0B' - binary number
      }
    // Anything else beginning with a digit is an integer, octal
    // number, or float.
    case 49:case 50:case 51:case 52:case 53:case 54:case 55:case 56:case 57:
      // 1-9
      return this.readNumber(false);

    // Quotes produce strings.
    case 34:case 39:
      // '"', "'"
      return this.readString(code);

    // Operators are parsed inline in tiny state machines. '=' (61) is
    // often referred to. `finishOp` simply skips the amount of
    // characters it is given as second argument, and returns a token
    // of the type given by its first argument.

    case 47:
      // '/'
      return this.readToken_slash();

    case 37:case 42:
      // '%*'
      return this.readToken_mult_modulo(code);

    case 124:case 38:
      // '|&'
      return this.readToken_pipe_amp(code);

    case 94:
      // '^'
      return this.readToken_caret();

    case 43:case 45:
      // '+-'
      return this.readToken_plus_min(code);

    case 60:case 62:
      // '<>'
      return this.readToken_lt_gt(code);

    case 61:case 33:
      // '=!'
      return this.readToken_eq_excl(code);

    case 126:
      // '~'
      return this.finishOp(_tokentype.types.prefix, 1);
  }

  this.raise(this.pos, "Unexpected character '" + codePointToString(code) + "'");
};

pp.finishOp = function (type, size) {
  var str = this.input.slice(this.pos, this.pos + size);
  this.pos += size;
  return this.finishToken(type, str);
};

var regexpUnicodeSupport = false;
try {
  new RegExp("￿", "u");regexpUnicodeSupport = true;
} catch (e) {}

// Parse a regular expression. Some context-awareness is necessary,
// since a '/' inside a '[]' set does not end the expression.

pp.readRegexp = function () {
  var escaped = undefined,
      inClass = undefined,
      start = this.pos;
  for (;;) {
    if (this.pos >= this.input.length) this.raise(start, "Unterminated regular expression");
    var ch = this.input.charAt(this.pos);
    if (_whitespace.lineBreak.test(ch)) this.raise(start, "Unterminated regular expression");
    if (!escaped) {
      if (ch === "[") inClass = true;else if (ch === "]" && inClass) inClass = false;else if (ch === "/" && !inClass) break;
      escaped = ch === "\\";
    } else escaped = false;
    ++this.pos;
  }
  var content = this.input.slice(start, this.pos);
  ++this.pos;
  // Need to use `readWord1` because '\uXXXX' sequences are allowed
  // here (don't ask).
  var mods = this.readWord1();
  var tmp = content;
  if (mods) {
    var validFlags = /^[gmsiy]*$/;
    if (this.options.ecmaVersion >= 6) validFlags = /^[gmsiyu]*$/;
    if (!validFlags.test(mods)) this.raise(start, "Invalid regular expression flag");
    if (mods.indexOf("u") >= 0 && !regexpUnicodeSupport) {
      // Replace each astral symbol and every Unicode escape sequence that
      // possibly represents an astral symbol or a paired surrogate with a
      // single ASCII symbol to avoid throwing on regular expressions that
      // are only valid in combination with the `/u` flag.
      // Note: replacing with the ASCII symbol `x` might cause false
      // negatives in unlikely scenarios. For example, `[\u{61}-b]` is a
      // perfectly valid pattern that is equivalent to `[a-b]`, but it would
      // be replaced by `[x-b]` which throws an error.
      tmp = tmp.replace(/\\u([a-fA-F0-9]{4})|\\u\{([0-9a-fA-F]+)\}|[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "x");
    }
  }
  // Detect invalid regular expressions.
  try {
    new RegExp(tmp);
  } catch (e) {
    if (e instanceof SyntaxError) this.raise(start, "Error parsing regular expression: " + e.message);
    this.raise(e);
  }
  // Get a regular expression object for this pattern-flag pair, or `null` in
  // case the current environment doesn't support the flags it uses.
  var value = undefined;
  try {
    value = new RegExp(content, mods);
  } catch (err) {
    value = null;
  }
  return this.finishToken(_tokentype.types.regexp, { pattern: content, flags: mods, value: value });
};

// Read an integer in the given radix. Return null if zero digits
// were read, the integer value otherwise. When `len` is given, this
// will return `null` unless the integer has exactly `len` digits.

pp.readInt = function (radix, len) {
  var start = this.pos,
      total = 0;
  for (var i = 0, e = len == null ? Infinity : len; i < e; ++i) {
    var code = this.input.charCodeAt(this.pos),
        val = undefined;
    if (code >= 97) val = code - 97 + 10; // a
    else if (code >= 65) val = code - 65 + 10; // A
    else if (code >= 48 && code <= 57) val = code - 48; // 0-9
    else val = Infinity;
    if (val >= radix) break;
    ++this.pos;
    total = total * radix + val;
  }
  if (this.pos === start || len != null && this.pos - start !== len) return null;

  return total;
};

pp.readRadixNumber = function (radix) {
  this.pos += 2; // 0x
  var val = this.readInt(radix);
  if (val == null) this.raise(this.start + 2, "Expected number in radix " + radix);
  if (_identifier.isIdentifierStart(this.fullCharCodeAtPos())) this.raise(this.pos, "Identifier directly after number");
  return this.finishToken(_tokentype.types.num, val);
};

// Read an integer, octal integer, or floating-point number.

pp.readNumber = function (startsWithDot) {
  var start = this.pos,
      isFloat = false,
      octal = this.input.charCodeAt(this.pos) === 48;
  if (!startsWithDot && this.readInt(10) === null) this.raise(start, "Invalid number");
  if (this.input.charCodeAt(this.pos) === 46) {
    ++this.pos;
    this.readInt(10);
    isFloat = true;
  }
  var next = this.input.charCodeAt(this.pos);
  if (next === 69 || next === 101) {
    // 'eE'
    next = this.input.charCodeAt(++this.pos);
    if (next === 43 || next === 45) ++this.pos; // '+-'
    if (this.readInt(10) === null) this.raise(start, "Invalid number");
    isFloat = true;
  }
  if (_identifier.isIdentifierStart(this.fullCharCodeAtPos())) this.raise(this.pos, "Identifier directly after number");

  var str = this.input.slice(start, this.pos),
      val = undefined;
  if (isFloat) val = parseFloat(str);else if (!octal || str.length === 1) val = parseInt(str, 10);else if (/[89]/.test(str) || this.strict) this.raise(start, "Invalid number");else val = parseInt(str, 8);
  return this.finishToken(_tokentype.types.num, val);
};

// Read a string value, interpreting backslash-escapes.

pp.readCodePoint = function () {
  var ch = this.input.charCodeAt(this.pos),
      code = undefined;

  if (ch === 123) {
    if (this.options.ecmaVersion < 6) this.unexpected();
    ++this.pos;
    code = this.readHexChar(this.input.indexOf("}", this.pos) - this.pos);
    ++this.pos;
    if (code > 1114111) this.unexpected();
  } else {
    code = this.readHexChar(4);
  }
  return code;
};

function codePointToString(code) {
  // UTF-16 Decoding
  if (code <= 65535) return String.fromCharCode(code);
  return String.fromCharCode((code - 65536 >> 10) + 55296, (code - 65536 & 1023) + 56320);
}

pp.readString = function (quote) {
  var out = "",
      chunkStart = ++this.pos;
  for (;;) {
    if (this.pos >= this.input.length) this.raise(this.start, "Unterminated string constant");
    var ch = this.input.charCodeAt(this.pos);
    if (ch === quote) break;
    if (ch === 92) {
      // '\'
      out += this.input.slice(chunkStart, this.pos);
      out += this.readEscapedChar();
      chunkStart = this.pos;
    } else {
      if (_whitespace.isNewLine(ch)) this.raise(this.start, "Unterminated string constant");
      ++this.pos;
    }
  }
  out += this.input.slice(chunkStart, this.pos++);
  return this.finishToken(_tokentype.types.string, out);
};

// Reads template string tokens.

pp.readTmplToken = function () {
  var out = "",
      chunkStart = this.pos;
  for (;;) {
    if (this.pos >= this.input.length) this.raise(this.start, "Unterminated template");
    var ch = this.input.charCodeAt(this.pos);
    if (ch === 96 || ch === 36 && this.input.charCodeAt(this.pos + 1) === 123) {
      // '`', '${'
      if (this.pos === this.start && this.type === _tokentype.types.template) {
        if (ch === 36) {
          this.pos += 2;
          return this.finishToken(_tokentype.types.dollarBraceL);
        } else {
          ++this.pos;
          return this.finishToken(_tokentype.types.backQuote);
        }
      }
      out += this.input.slice(chunkStart, this.pos);
      return this.finishToken(_tokentype.types.template, out);
    }
    if (ch === 92) {
      // '\'
      out += this.input.slice(chunkStart, this.pos);
      out += this.readEscapedChar();
      chunkStart = this.pos;
    } else if (_whitespace.isNewLine(ch)) {
      out += this.input.slice(chunkStart, this.pos);
      ++this.pos;
      if (ch === 13 && this.input.charCodeAt(this.pos) === 10) {
        ++this.pos;
        out += "\n";
      } else {
        out += String.fromCharCode(ch);
      }
      if (this.options.locations) {
        ++this.curLine;
        this.lineStart = this.pos;
      }
      chunkStart = this.pos;
    } else {
      ++this.pos;
    }
  }
};

// Used to read escaped characters

pp.readEscapedChar = function () {
  var ch = this.input.charCodeAt(++this.pos);
  var octal = /^[0-7]+/.exec(this.input.slice(this.pos, this.pos + 3));
  if (octal) octal = octal[0];
  while (octal && parseInt(octal, 8) > 255) octal = octal.slice(0, -1);
  if (octal === "0") octal = null;
  ++this.pos;
  if (octal) {
    if (this.strict) this.raise(this.pos - 2, "Octal literal in strict mode");
    this.pos += octal.length - 1;
    return String.fromCharCode(parseInt(octal, 8));
  } else {
    switch (ch) {
      case 110:
        return "\n"; // 'n' -> '\n'
      case 114:
        return "\r"; // 'r' -> '\r'
      case 120:
        return String.fromCharCode(this.readHexChar(2)); // 'x'
      case 117:
        return codePointToString(this.readCodePoint()); // 'u'
      case 116:
        return "\t"; // 't' -> '\t'
      case 98:
        return "\b"; // 'b' -> '\b'
      case 118:
        return "\u000b"; // 'v' -> '\u000b'
      case 102:
        return "\f"; // 'f' -> '\f'
      case 48:
        return "\u0000"; // 0 -> '\0'
      case 13:
        if (this.input.charCodeAt(this.pos) === 10) ++this.pos; // '\r\n'
      case 10:
        // ' \n'
        if (this.options.locations) {
          this.lineStart = this.pos;++this.curLine;
        }
        return "";
      default:
        return String.fromCharCode(ch);
    }
  }
};

// Used to read character escape sequences ('\x', '\u', '\U').

pp.readHexChar = function (len) {
  var n = this.readInt(16, len);
  if (n === null) this.raise(this.start, "Bad character escape sequence");
  return n;
};

// Used to signal to callers of `readWord1` whether the word
// contained any escape sequences. This is needed because words with
// escape sequences must not be interpreted as keywords.

var containsEsc;

// Read an identifier, and return it as a string. Sets `containsEsc`
// to whether the word contained a '\u' escape.
//
// Incrementally adds only escaped chars, adding other chunks as-is
// as a micro-optimization.

pp.readWord1 = function () {
  containsEsc = false;
  var word = "",
      first = true,
      chunkStart = this.pos;
  var astral = this.options.ecmaVersion >= 6;
  while (this.pos < this.input.length) {
    var ch = this.fullCharCodeAtPos();
    if (_identifier.isIdentifierChar(ch, astral)) {
      this.pos += ch <= 65535 ? 1 : 2;
    } else if (ch === 92) {
      // "\"
      containsEsc = true;
      word += this.input.slice(chunkStart, this.pos);
      var escStart = this.pos;
      if (this.input.charCodeAt(++this.pos) != 117) // "u"
        this.raise(this.pos, "Expecting Unicode escape sequence \\uXXXX");
      ++this.pos;
      var esc = this.readCodePoint();
      if (!(first ? _identifier.isIdentifierStart : _identifier.isIdentifierChar)(esc, astral)) this.raise(escStart, "Invalid Unicode escape");
      word += codePointToString(esc);
      chunkStart = this.pos;
    } else {
      break;
    }
    first = false;
  }
  return word + this.input.slice(chunkStart, this.pos);
};

// Read an identifier or keyword token. Will check for reserved
// words when necessary.

pp.readWord = function () {
  var word = this.readWord1();
  var type = _tokentype.types.name;
  if ((this.options.ecmaVersion >= 6 || !containsEsc) && this.isKeyword(word)) type = _tokentype.keywords[word];
  return this.finishToken(type, word);
};