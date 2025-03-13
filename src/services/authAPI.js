// src/services/authAPI.js
import axios from 'axios';

// If you have a constants.js with BACKEND_URL, import it. Otherwise, hardcode:
const BACKEND_URL = 'http://127.0.0.1:8000';

export async function doLogin({ username, password }) {
  try {
    const response = await axios.post(`${BACKEND_URL}/auth/login`, {
      username,
      password,
    });
    // If success, response.data = { email, name, roles: [...] }
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Login failed');
  }
}
