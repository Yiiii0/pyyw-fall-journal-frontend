import React, { useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  useParams,
  Navigate,
  Link,
} from 'react-router-dom';
import PropTypes from 'prop-types';

import './App.css';

import Navbar from './Components/Navbar';
import People from './Components/People';
import Manuscripts from './Components/Manuscripts';
import Login from './Components/Auth/Login';

function PersonPage() {
  const { name } = useParams();
  return <h1>{name}</h1>
}

// Protected Route wrapper component
function ProtectedRoute({ children, user }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  user: PropTypes.shape({
    email: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),
};

ProtectedRoute.defaultProps = {
  user: null,
};

function WelcomePage() {
  return (
    <div className="welcome-page">
      <h1>Welcome to Journal System</h1>
      <nav className="welcome-nav">
        <ul>
          <li><Link to="/manuscripts">View Manuscripts</Link></li>
          <li><Link to="/people">View People</Link></li>
          <li><Link to="/submissions">Submissions</Link></li>
        </ul>
      </nav>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <BrowserRouter>
      <Navbar user={user} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/people" element={<People />} />
        <Route path="/manuscripts" element={<Manuscripts />} />
        <Route path="/people/:name" element={<PersonPage />} />
        <Route path="/submissions" element={
          <ProtectedRoute user={user}>
            <div>Submissions Page (Coming Soon)</div>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
