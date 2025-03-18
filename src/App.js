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

import EditorDashboard from './Components/EditorDashboard/EditorDashboard';
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
      <h1>Welcome to Journal System</h1>
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