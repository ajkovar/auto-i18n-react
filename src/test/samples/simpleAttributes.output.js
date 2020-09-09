import { FormattedMessage, injectIntl } from 'react-intl';
import React from 'react';

class Greeting extends React.Component {
  render() {
    var intl = this.props.intl;
    return (
      <div
        title={intl.formatMessage({
          defaultMessage: 'some translatable text'
        })}
      >
        <FormattedMessage defaultMessage='hello there' />
      </div>
    );
  }
}

export default injectIntl(Greeting);
