import React from 'react';
import PropTypes from 'prop-types';

class Greeting extends React.Component {
  render() {
    return (
      <div>
        <span title='super title'>{this.props.greeting}</span>
      </div>
    );
  }
}

GreetingPropTypes.propTypes = {
  name: PropTypes.string,
};

export default Greeting;
