import React from 'react';
import { Link } from 'react-router-dom';
import HeaderLoggedInNav from '../molecules/HeaderLoggedInNav';
import HeaderLoggedOutNav from '../molecules/HeaderLoggedOutNav';

class Header extends React.Component {
  render() {
    return (
      <nav className="navbar navbar-light">
        <div className="container">

          <Link to="/" className="navbar-brand">
            {this.props.appName.toLowerCase()}
          </Link>

          <HeaderLoggedOutNav currentUser={this.props.currentUser} />

          <HeaderLoggedInNav currentUser={this.props.currentUser} />
        </div>
      </nav>
    );
  }
}

export default Header;
