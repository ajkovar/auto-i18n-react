import { withTranslation } from 'react-i18next';
import React from 'react';
import PropTypes from 'prop-types';

class Greeting extends React.Component {
  render() {
    var t = this.props.t;
    return (
      <div>
        <span title={t('super title')}>{this.props.greeting}</span>
      </div>
    );
  }
}

GreetingPropTypes.propTypes = {
  t: PropTypes.object,
  name: PropTypes.string,
};
export default withTranslation()(Greeting);
