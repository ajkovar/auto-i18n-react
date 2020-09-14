import React from 'react';

class Greeting extends React.Component {
  render() {
    return (
      <div>
        <span>A</span>
        <span>b</span>
        <span>bob@gmail.com</span>
        <span>www.moo-cow-productions.com</span>
        <span>#FFFFFF</span>
        <span>http://blahblahblah.edu</span>
        <span className='some class name that looks like text'></span>
        <a href='blah blah'></a>
        <svg>
          <path d='M10 10' />
          <circle cx='10' cy='10' r='2' fill='red' />
        </svg>
      </div>
    );
  }
}

export default Greeting;
