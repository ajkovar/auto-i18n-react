import { FormattedMessage } from 'react-intl';
import React from 'react';

const Comp = () => (
  <div>
    <FormattedMessage defaultMessage='hello there,' />
    <span>
      <FormattedMessage defaultMessage='friend' />
    </span>
  </div>
);

export default Comp;
