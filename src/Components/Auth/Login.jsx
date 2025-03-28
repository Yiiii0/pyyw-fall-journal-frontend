import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import './Auth.css';
import { useAuth } from '../../contexts/AuthContext';

import { doLogin } from '../../services/authAPI';

function Login({ onLogin }) {
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userData = await doLogin({
        username: formData.username,
        password: formData.password,
      });
      login(userData);
      if (onLogin) onLogin(userData);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="login-container">
      <h2>Welcome Back</h2>
      <form onSubmit={handleSubmit} className="login-form">
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="login-button">
          Sign In
        </button>
      </form>
      <div className="register-link">
        <p>
          Haven&apos;t an account yet? <Link to="/register">Register now</Link>
        </p>
      </div>
    </div>
  );
}

Login.propTypes = {
  onLogin: PropTypes.func,
};

Login.defaultProps = {
  onLogin: null,
};

export default Login;
