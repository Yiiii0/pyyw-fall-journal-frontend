import axios from 'axios';
import { BACKEND_URL } from '../constants';

const PEOPLE_ENDPOINTS = {
  READ: `${BACKEND_URL}/people`,
  CREATE: `${BACKEND_URL}/people/create`,
  UPDATE: `${BACKEND_URL}/people/update`,
  ADD_ROLE: `${BACKEND_URL}/people/add_role`,
  DELETE_ROLE: `${BACKEND_URL}/people/delete_role`,
};

export const getPeople = async () => {
  try {
    const { data } = await axios.get(PEOPLE_ENDPOINTS.READ);
    return data;
  } catch (error) {
    throw new Error(`Failed to fetch people: ${error.message}`);
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
      email,
      name,
      affiliation,
    });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    throw new Error(errorMessage);
  }
};

export const addRole = async (email, role) => {
  try {
    const response = await axios.put(PEOPLE_ENDPOINTS.ADD_ROLE, {
      email,
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
    const response = await axios.put(PEOPLE_ENDPOINTS.DELETE_ROLE, {
      email,
      role,
    });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    throw new Error(errorMessage);
  }
}; 