import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import './Login.css';

// Mock login service - replace with real API call later
const mockLoginService = async (email, password) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock validation
  if (email === 'test@example.com' && password === 'password') {
    return { success: true, user: { email, name: 'Test User' } };
  }
  throw new Error('Invalid credentials');
};

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await mockLoginService(email, password);
      if (result.success) {
        onLogin(result.user);
        navigate('/'); // Redirect to home page after login
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Login</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="login-help">
          <p>Test credentials:</p>
          <code>Email: test@example.com</code><br />
          <code>Password: password</code>
        </div>
      </div>
    </div>
  );
}

Login.propTypes = {
  onLogin: PropTypes.func.isRequired,
};

export default Login; 