import React from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

function NavLink({ page }) {
  const { label, destination } = page;
  return (
    <li>
      <Link to={destination}>{label}</Link>
    </li>
  );
}

NavLink.propTypes = {
  page: PropTypes.shape({
    label: PropTypes.string.isRequired,
    destination: PropTypes.string.isRequired,
  }).isRequired,
};

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  // Filter pages based on auth status
  const getVisiblePages = () => {
    const basePages = [
      { label: 'Home', destination: '/' },
      { label: 'View All People', destination: '/people' },
    ];
    
    if (user) {
      basePages.push({ label: 'View All Submissions', destination: '/submissions' });
    }
    
    return basePages;
  };

  return (
    <nav>
      <div className="nav-container">
        <ul className="wrapper">
          {getVisiblePages().map((page) => <NavLink key={page.destination} page={page} />)}
        </ul>
        <div className="auth-section">
          {user ? (
            <div className="user-info">
              <span className="user-email">{user.email}</span>
              <button onClick={handleLogout} className="logout-button">
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="login-link">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
}

Navbar.propTypes = {
  user: PropTypes.shape({
    email: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),
  onLogout: PropTypes.func,
};

Navbar.defaultProps = {
  user: null,
  onLogout: () => {},
};

export default Navbar;
