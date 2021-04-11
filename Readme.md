Automatically converts a [React](https://reactjs.org/) codebase to support i18n using the [format.js API](https://formatjs.io/)

Installation:

    npm install -g auto-i18n-react

Usage:
   
    auto-i18n-react --target path/to/target/directory

This:

    import React from 'react';
    
    class ShoppingList extends React.Component {
      render() {
        return (
          <div className='shopping-list' title="International Shoppy List">
            <h1>International Shopping List</h1>
            <ul>
              <li>Mexican food</li>
              <li>German food</li>
              <li>American food</li>
            </ul>
          </div>
        );
      }
    }

    export default ShoppingList;

becomes:

    import { FormattedMessage, injectIntl } from 'react-intl';
    import React from 'react';
    
    class ShoppingList extends React.Component {
      render() {
        var intl = this.props.intl;
        return (
          <div
            className='shopping-list'
            title={intl.formatMessage({
              defaultMessage: 'International Shoppy List'
            })}
          >
            <h1>
              <FormattedMessage defaultMessage='International Shopping List' />
            </h1>
            <ul>
              <li>
                <FormattedMessage defaultMessage='Mexican food' />
              </li>
              <li>
                <FormattedMessage defaultMessage='German food' />
              </li>
              <li>
                <FormattedMessage defaultMessage='American food' />
              </li>
            </ul>
          </div>
        );
      }
    }
    
    export default injectIntl(ShoppingList);
    

It also works with functional components that use hooks and is safe to re-run multiple times on the same file (if you later add more things that need to be i18n'ed).  It isn't perfect and there will likely be some manually editing required for all the edge cases.