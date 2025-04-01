import axios from 'axios';

const BACKEND_URL = 'http://127.0.0.1:8000';

export async function doLogin({ username, password }) {
  try {
    const response = await axios.post(`${BACKEND_URL}/auth/login`, {
      username,
      password,
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Login failed');
  }
}
