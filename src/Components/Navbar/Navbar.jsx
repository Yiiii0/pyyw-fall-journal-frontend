import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';
import { useAuth } from '../../contexts/AuthContext';

function Navbar() {
  const { currentUser, logout } = useAuth();
  console.log(currentUser);
  console.log('Current user:', currentUser);
  console.log('Current user roles:', currentUser?.roles);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    localStorage.removeItem('userData');
    navigate('/');
  };

  // Determine if user has specific roles
  const isEditorOrME = currentUser?.roles?.some(role => role === 'ED' || role === 'ME');
  const isReferee = currentUser?.roles?.some(role => role === 'RE');
  const isAuthor = currentUser?.roles?.some(role => role === 'AU');

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
              {/* Show Editor Dashboard if user has Editor/ME role */}
              {isEditorOrME && (
                <li>
                  <Link
                    to="/editor-dashboard"
                    className={location.pathname === '/editor-dashboard' ? 'active' : ''}
                  >
                    Editor Dashboard
                  </Link>
                </li>
              )}

              {/* Show Action Dashboard if user is Referee or Author (not Editor/ME) */}
              {!isEditorOrME && (isReferee || isAuthor) && (
                <li>
                  <Link
                    to="/action-dashboard"
                    className={location.pathname === '/action-dashboard' ? 'active' : ''}
                  >
                    Action Dashboard
                  </Link>
                </li>
              )}

              {/* Show Manuscripts link if user has neither Editor/ME nor Referee role */}
              {!isEditorOrME && !isReferee && (
                <li>
                  <Link
                    to="/manuscripts"
                    className={location.pathname === '/manuscripts' ? 'active' : ''}
                  >
                    Manuscripts
                  </Link>
                </li>
              )}

              {/* Show Submissions if user is not Editor/ME */}
              {!isEditorOrME && (
                <li>
                  <Link
                    to="/submissions"
                    className={location.pathname === '/submissions' ? 'active' : ''}
                  >
                    Submissions
                  </Link>
                </li>
              )}
            </>
          )}
        </ul>

        <div className="auth-section">
          {currentUser ? (
            <>
              <div className="user-info">
                <button onClick={() => navigate('/profile')} className="logout-button">
                  My Profile
                </button>
              </div>
              <button onClick={handleLogout} className="logout-button">
                Logout
              </button>
            </>
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

export default Navbar;