import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';
import { useAuth } from '../../contexts/AuthContext';

function Navbar() {
  const { currentUser, logout } = useAuth();
  console.log(currentUser)
  console.log('Current user:', currentUser);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    localStorage.removeItem('userData');
    navigate('/');
  };

  // Determine if user is Editor or Managing Editor
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
          {/* Always show Home and About */}
          <li>
            <Link
              to="/"
              className={location.pathname === '/' ? 'active' : ''}
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/about"
              className={location.pathname === '/about' ? 'active' : ''}
            >
              About
            </Link>
          </li>
          <li>
            <Link
              to="/masthead"
              className={location.pathname === '/masthead' ? 'active' : ''}
            >
              Masthead
            </Link>
          </li>

          {currentUser && (
            <>
              {isEditorOrME ? (
                <li>
                  <Link
                    to="/editor-dashboard"
                    className={location.pathname === '/editor-dashboard' ? 'active' : ''}
                  >
                    Editor Dashboard
                  </Link>
                </li>
              ) : (
                <li>
                  <Link
                    to="/manuscripts"
                    className={location.pathname === '/manuscripts' ? 'active' : ''}
                  >
                    Manuscripts
                  </Link>
                </li>
              )}

              {/* Optional: show Submissions if user is logged in, any role */}
              <li>
                <Link
                  to="/submissions"
                  className={location.pathname === '/submissions' ? 'active' : ''}
                >
                  Submissions
                </Link>
              </li>
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
