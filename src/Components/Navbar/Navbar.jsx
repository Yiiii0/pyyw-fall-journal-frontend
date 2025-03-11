import React from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';
import { useAuth } from '../../contexts/AuthContext';

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

function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    localStorage.removeItem('userData');
    navigate('/');
  };

  const getVisiblePages = () => {
    const basePages = [
      { label: 'Home', destination: '/' },
      { label: 'About', destination: '/about' },
    ];
    return basePages;
  };

  const isEditorOrME = currentUser?.roles?.some(role => role === 'ED' || role === 'ME');

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

          {currentUser && (
            <>
              <li>
                <Link to="/manuscripts">Manuscripts</Link>
              </li>
              <li>
                <Link to="/people">People</Link>
              </li>
              <li>
                <Link to="/submissions">Submissions</Link>
              </li>
              {isEditorOrME && (
                <li>
                  <Link to="/editor-dashboard">Dashboard</Link>
                </li>
              )}
            </>
          )}
        </ul>

        <div className="auth-section">
          {currentUser ? (
            <div className="user-info">
              <div className="user-email">
                <span className="welcome-text">Welcome,</span>
                <span className="user-name">
                  {currentUser.name || currentUser.email}
                </span>
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

// Navbar.propTypes = {
//   user: PropTypes.shape({
//     email: PropTypes.string.isRequired,
//     name: PropTypes.string.isRequired,
//   }),
//   onLogout: PropTypes.func,
// };

// Navbar.defaultProps = {
//   user: null,
//   onLogout: () => { },
// };

export default Navbar;
