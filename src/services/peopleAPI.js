import axios from 'axios';
import { BACKEND_URL } from '../constants';

const PEOPLE_ENDPOINTS = {
  READ: `${BACKEND_URL}/people`,
  CREATE: `${BACKEND_URL}/people/create`,
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
    throw new Error(`Failed to create person: ${error.message}`);
  }
}; 