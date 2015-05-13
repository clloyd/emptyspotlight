import React from 'react';

class Index extends React.Component {
  render() {
      return (
        <h1>Welcome!</h1>
      );
  }
}

React.render(<Index />, document.getElementById('main'));
