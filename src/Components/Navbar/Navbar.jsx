import React from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

function NavLink({ page }) {
  const location = useLocation();
  const isActive = location.pathname === page.destination;
  
  return (
    <li>
      <Link 
        to={page.destination} 
        className={isActive ? 'active' : ''}
      >
        {page.label}
      </Link>
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

  const getVisiblePages = () => {
    const basePages = [
      { label: 'Home', destination: '/' },
    ];
    return basePages;
  };

  return (
    <header className="header">
      <nav className="nav-container">
        <div className="nav-brand">
          <Link to="/" className="brand-link">
            Journal System
          </Link>
        </div>
        
        <ul className="nav-links">
          {getVisiblePages().map((page) => (
            <NavLink key={page.destination} page={page} />
          ))}
        </ul>

        <div className="auth-section">
          {user ? (
            <div className="user-info">
              <div className="user-email">
                <span className="welcome-text">Welcome,</span>
                <span className="user-name">{user.name}</span>
              </div>
              <button onClick={handleLogout} className="logout-button">
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="login-button">
              Sign In
            </Link>
          )}
        </div>
      </nav>
    </header>
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
