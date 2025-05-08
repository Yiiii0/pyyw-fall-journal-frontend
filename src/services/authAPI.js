import axios from 'axios';
import { BACKEND_URL } from '../constants';

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
