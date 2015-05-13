/* */ 
(function(process) {
  'use strict';
  var emptyFunction = require("./emptyFunction");
  var warning = require("./warning");
  var validateDOMNesting = emptyFunction;
  if ('production' !== process.env.NODE_ENV) {
    var specialTags = ['address', 'applet', 'area', 'article', 'aside', 'base', 'basefont', 'bgsound', 'blockquote', 'body', 'br', 'button', 'caption', 'center', 'col', 'colgroup', 'dd', 'details', 'dir', 'div', 'dl', 'dt', 'embed', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'frame', 'frameset', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html', 'iframe', 'img', 'input', 'isindex', 'li', 'link', 'listing', 'main', 'marquee', 'menu', 'menuitem', 'meta', 'nav', 'noembed', 'noframes', 'noscript', 'object', 'ol', 'p', 'param', 'plaintext', 'pre', 'script', 'section', 'select', 'source', 'style', 'summary', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'title', 'tr', 'track', 'ul', 'wbr', 'xmp'];
    var stackHasTagInSpecificScope = function(stack, tag, scope) {
      for (var i = stack.length - 1; i >= 0; i--) {
        if (stack[i] === tag) {
          return true;
        }
        if (scope.indexOf(stack[i]) !== -1) {
          return false;
        }
      }
      return false;
    };
    var inScopeTags = ['applet', 'caption', 'html', 'table', 'td', 'th', 'marquee', 'object', 'template', 'foreignObject', 'desc', 'title'];
    var stackHasTagInScope = function(stack, tag) {
      return stackHasTagInSpecificScope(stack, tag, inScopeTags);
    };
    var buttonScopeTags = inScopeTags.concat(['button']);
    var stackHasTagInButtonScope = function(stack, tag) {
      return stackHasTagInSpecificScope(stack, tag, buttonScopeTags);
    };
    var listItemTagAllowed = function(tags, stack) {
      for (var i = stack.length - 1; i >= 0; i--) {
        if (tags.indexOf(stack[i]) !== -1) {
          return false;
        } else if (specialTags.indexOf(stack[i]) !== -1 && stack[i] !== 'address' && stack[i] !== 'div' && stack[i] !== 'p') {
          return true;
        }
      }
      return true;
    };
    var impliedEndTags = ['dd', 'dt', 'li', 'option', 'optgroup', 'p', 'rp', 'rt'];
    var isTagValidInContext = function(tag, openTagStack) {
      var currentTag = openTagStack[openTagStack.length - 1];
      switch (currentTag) {
        case 'select':
          return tag === 'option' || tag === 'optgroup' || tag === '#text';
        case 'optgroup':
          return tag === 'option' || tag === '#text';
        case 'option':
          return tag === '#text';
        case 'tr':
          return tag === 'th' || tag === 'td' || tag === 'style' || tag === 'script' || tag === 'template';
        case 'tbody':
        case 'thead':
        case 'tfoot':
          return tag === 'tr' || tag === 'style' || tag === 'script' || tag === 'template';
        case 'colgroup':
          return tag === 'col' || tag === 'template';
        case 'table':
          return tag === 'caption' || tag === 'colgroup' || tag === 'tbody' || tag === 'tfoot' || tag === 'thead' || tag === 'style' || tag === 'script' || tag === 'template';
        case 'head':
          return tag === 'base' || tag === 'basefont' || tag === 'bgsound' || tag === 'link' || tag === 'meta' || tag === 'title' || tag === 'noscript' || tag === 'noframes' || tag === 'style' || tag === 'script' || tag === 'template';
        case 'html':
          return tag === 'head' || tag === 'body';
      }
      switch (tag) {
        case 'address':
        case 'article':
        case 'aside':
        case 'blockquote':
        case 'center':
        case 'details':
        case 'dialog':
        case 'dir':
        case 'div':
        case 'dl':
        case 'fieldset':
        case 'figcaption':
        case 'figure':
        case 'footer':
        case 'header':
        case 'hgroup':
        case 'main':
        case 'menu':
        case 'nav':
        case 'ol':
        case 'p':
        case 'section':
        case 'summary':
        case 'ul':
        case 'pre':
        case 'listing':
        case 'table':
        case 'hr':
        case 'xmp':
          return !stackHasTagInButtonScope(openTagStack, 'p');
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          return !stackHasTagInButtonScope(openTagStack, 'p') && currentTag !== 'h1' && currentTag !== 'h2' && currentTag !== 'h3' && currentTag !== 'h4' && currentTag !== 'h5' && currentTag !== 'h6';
        case 'form':
          return openTagStack.indexOf('form') === -1 && !stackHasTagInButtonScope(openTagStack, 'p');
        case 'li':
          return listItemTagAllowed(['li'], openTagStack);
        case 'dd':
        case 'dt':
          return listItemTagAllowed(['dd', 'dt'], openTagStack);
        case 'button':
          return !stackHasTagInScope(openTagStack, 'button');
        case 'a':
          return !stackHasTagInScope(openTagStack, 'a');
        case 'nobr':
          return !stackHasTagInScope(openTagStack, 'nobr');
        case 'rp':
        case 'rt':
          return impliedEndTags.indexOf(currentTag) === -1;
        case 'caption':
        case 'col':
        case 'colgroup':
        case 'frame':
        case 'head':
        case 'tbody':
        case 'td':
        case 'tfoot':
        case 'th':
        case 'thead':
        case 'tr':
          return currentTag === undefined;
      }
      return true;
    };
    validateDOMNesting = function(parentStack, childTag, element) {
      if (!isTagValidInContext(childTag, parentStack)) {
        var info = '';
        var parentTag = parentStack[parentStack.length - 1];
        if (parentTag === 'table' && childTag === 'tr') {
          info += ' Add a <tbody> to your code to match the DOM tree generated by ' + 'the browser.';
        }
        if (element && element._owner) {
          var name = element._owner.getName();
          if (name) {
            info += ' Check the render method of `' + name + '`.';
          }
        }
        'production' !== process.env.NODE_ENV ? warning(false, 'validateDOMNesting(...): <%s> cannot appear as a child of <%s> ' + 'in this context (%s).%s', childTag, parentTag, parentStack.join(' > '), info) : null;
      }
    };
    validateDOMNesting.tagStackContextKey = '__validateDOMNesting_tagStack$' + Math.random().toString(36).slice(2);
    validateDOMNesting.isTagValidInContext = isTagValidInContext;
  }
  module.exports = validateDOMNesting;
})(require("process"));
