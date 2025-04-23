import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  useParams,
  Navigate,
} from 'react-router-dom';
import PropTypes from 'prop-types';

import './App.css';

import Navbar from './Components/Navbar';
import People from './Components/People';
import Manuscripts from './Components/Manuscripts';
import Submissions from './Components/Submissions';
import About from './Components/About';
import Login from './Components/Auth/Login';
import Register from './Components/Auth/Register';
import Masthead from './Components/Masthead/Masthead';
import Profile from './Components/Profile/Profile';

import EditorDashboard from './Components/EditorDashboard/EditorDashboard';
import ActionDashboard from './Components/ActionDashboard';
import ManuscriptReview from './Components/ManuscriptReview';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function PersonPage() {
  const { name } = useParams();
  return <h1>{name}</h1>;
}

// Protected Route wrapper component
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

function WelcomePage() {
  return (
    <div className="welcome-page">
      <div className="welcome-content">
        <h1>Welcome to Journal System</h1>
        <p className="welcome-tagline">A modern platform for academic publishing and collaboration</p>
        <p className="welcome-description">Discover, submit, and review scholarly articles in an efficient and transparent environment</p>
      </div>
    </div>
  );
}

function AppContent() {
  const { currentUser, login } = useAuth();

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<Login onLogin={login} />} />
        <Route path="/register" element={<Register onRegister={login} />} />
        <Route path="/people" element={<People />} />
        <Route path="/manuscripts" element={<Manuscripts />} />
        <Route path="/people/:name" element={<PersonPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/masthead" element={<Masthead />} />
        <Route path="/submissions" element={
          <ProtectedRoute>
            <Submissions user={currentUser} />
          </ProtectedRoute>
        } />

        <Route path="/editor-dashboard" element={
          <ProtectedRoute>
            <EditorDashboard />
          </ProtectedRoute>
        } />

        <Route path="/action-dashboard" element={
          <ProtectedRoute>
            <ActionDashboard />
          </ProtectedRoute>
        } />

        <Route path="/referee/review/:id" element={
          <ProtectedRoute>
            <ManuscriptReview />
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;