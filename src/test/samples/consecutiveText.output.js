import { FormattedMessage } from 'react-intl';
import React from 'react';

class Greeting extends React.Component {
  render() {
    return (
      <div>
        <FormattedMessage defaultMessage='hello there,' />
        <span>
          <FormattedMessage defaultMessage='friend' />
        </span>
      </div>
    );
  }
}

export default Greeting;
