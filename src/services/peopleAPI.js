import axios from 'axios';
import { BACKEND_URL } from '../constants';

const PEOPLE_ENDPOINTS = {
  READ: `${BACKEND_URL}/people`,
  CREATE: `${BACKEND_URL}/people/create`,
  UPDATE: `${BACKEND_URL}/people/update`,
  ADD_ROLE: `${BACKEND_URL}/people/add_role`,
  DELETE_ROLE: `${BACKEND_URL}/people/delete_role`,
  GET_ROLES: `${BACKEND_URL}/roles`,
  LOGIN: `${BACKEND_URL}/auth/login`,
  REGISTER: `${BACKEND_URL}/auth/register`,
  GET_ALL_PEOPLE: `${BACKEND_URL}/people/get_all_people`,
};

export const getPeople = async () => {
  try {
    const { data } = await axios.get(PEOPLE_ENDPOINTS.READ);
    return data;
  } catch (error) {
    throw new Error(`Failed to fetch people: ${error.message}`);
  }
};

export const getPerson = async (email) => {
  try {
    const { data } = await axios.get(`${PEOPLE_ENDPOINTS.READ}/${email}`);
    return data;
  } catch (error) {
    throw new Error(`Failed to fetch person: ${error.message}`);
  }
};

export const createPerson = async (personData) => {
  try {
    const response = await axios.put(PEOPLE_ENDPOINTS.CREATE, personData);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    throw new Error(errorMessage);
  }
};

export const deletePerson = async (email) => {
  try {
    const response = await axios.delete(`${PEOPLE_ENDPOINTS.READ}/${email}`);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    throw new Error(errorMessage);
  }
};

export const updatePerson = async (email, name, affiliation) => {
  try {
    const response = await axios.put(PEOPLE_ENDPOINTS.UPDATE, {
      id: email,
      name,
      affiliation,
    });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    throw new Error(errorMessage);
  }
};

export const getRoles = async () => {
  try {
    const { data } = await axios.get(PEOPLE_ENDPOINTS.GET_ROLES);
    return data;
  } catch (error) {
    throw new Error(`Failed to fetch roles: ${error.message}`);
  }
};

export const addRole = async (email, role) => {
  try {
    const response = await axios.put(PEOPLE_ENDPOINTS.ADD_ROLE, {
      id: email,
      role,
    });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    throw new Error(errorMessage);
  }
};

export const deleteRole = async (email, role) => {
  try {
    const response = await axios.delete(PEOPLE_ENDPOINTS.DELETE_ROLE, {
      data: { id: email, role },
    });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    throw new Error(errorMessage);
  }
};

export async function login({ username, password }) {
  try {
    console.log({ username, password })
    const response = await axios.post(PEOPLE_ENDPOINTS.LOGIN, { username, password });
    return response.data; // Assuming the response contains user data
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Login failed');
  }
}

export async function register(userData) {
  try {
    const response = await axios.post(PEOPLE_ENDPOINTS.REGISTER, userData);
    return response.data; // Assuming successful response contains user data
  } catch (error) {
    console.error("Registration Error:", error.response?.data || error.message); // debug
    throw new Error(error.response?.data?.message || 'Registration failed');
  }
}

export const getAllPeople = async () => {
  try {
    const { data } = await axios.get(PEOPLE_ENDPOINTS.GET_ALL_PEOPLE);
    return data;
  } catch (error) {
    throw new Error(`Failed to fetch people list: ${error.message}`);
  }
};