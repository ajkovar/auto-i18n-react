import { injectIntl } from 'react-intl';
import React from 'react';
import PropTypes from 'prop-types';

class Greeting extends React.Component {
  render() {
    var intl = this.props.intl;
    return (
      <div>
        <span
          title={intl.formatMessage({
            defaultMessage: 'super title',
          })}
        >
          {this.props.greeting}
        </span>
      </div>
    );
  }
}

GreetingPropTypes.propTypes = {
  intl: PropTypes.object,
  name: PropTypes.string,
};
export default injectIntl(Greeting);
