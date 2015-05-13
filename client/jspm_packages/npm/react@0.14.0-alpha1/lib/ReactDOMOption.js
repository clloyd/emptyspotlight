/* */ 
(function(process) {
  'use strict';
  var ReactBrowserComponentMixin = require("./ReactBrowserComponentMixin");
  var ReactClass = require("./ReactClass");
  var ReactDOMSelect = require("./ReactDOMSelect");
  var ReactElement = require("./ReactElement");
  var ReactInstanceMap = require("./ReactInstanceMap");
  var ReactPropTypes = require("./ReactPropTypes");
  var assign = require("./Object.assign");
  var warning = require("./warning");
  var option = ReactElement.createFactory('option');
  var valueContextKey = ReactDOMSelect.valueContextKey;
  var ReactDOMOption = ReactClass.createClass({
    displayName: 'ReactDOMOption',
    tagName: 'OPTION',
    mixins: [ReactBrowserComponentMixin],
    getInitialState: function() {
      return {selected: null};
    },
    contextTypes: (function() {
      var obj = {};
      obj[valueContextKey] = ReactPropTypes.any;
      return obj;
    })(),
    componentWillMount: function() {
      if ('production' !== process.env.NODE_ENV) {
        'production' !== process.env.NODE_ENV ? warning(this.props.selected == null, 'Use the `defaultValue` or `value` props on <select> instead of ' + 'setting `selected` on <option>.') : null;
      }
      var context = ReactInstanceMap.get(this)._context;
      var selectValue = context[valueContextKey];
      if (selectValue != null) {
        var selected = false;
        if (Array.isArray(selectValue)) {
          for (var i = 0; i < selectValue.length; i++) {
            if ('' + selectValue[i] === '' + this.props.value) {
              selected = true;
              break;
            }
          }
        } else {
          selected = '' + selectValue === '' + this.props.value;
        }
        this.setState({selected: selected});
      }
    },
    render: function() {
      var props = this.props;
      if (this.state.selected != null) {
        props = assign({}, props, {selected: this.state.selected});
      }
      return option(props, this.props.children);
    }
  });
  module.exports = ReactDOMOption;
})(require("process"));
