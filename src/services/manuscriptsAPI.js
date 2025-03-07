import axios from 'axios';
import { BACKEND_URL } from '../constants';

const MANUSCRIPTS_ENDPOINTS = {
  READ: `${BACKEND_URL}/manuscript`,
};

export const getManuscript = async () => {
  try {
    const { data } = await axios.get(MANUSCRIPTS_ENDPOINTS.READ);
    return data;
  } catch (error) {
    throw new Error(`Failed to fetch manuscript: ${error.message}`);
  }
};

export const getManuscriptsByTitle = async (title) => {
  try {
    const { data } = await axios.get(`${MANUSCRIPTS_ENDPOINTS.READ}/${encodeURIComponent(title)}`);
    return data ? [data] : [];
  } catch (error) {
    throw new Error(`Failed to fetch ${title}: ${error.message}`);
  }
};

export const deleteManuscriptByTitle = async (title) => {
  try {
    const { data } = await axios.delete(`${MANUSCRIPTS_ENDPOINTS.READ}/${encodeURIComponent(title)}`);
    return data;
  } catch (error) {
    throw new Error(`Failed to delete manuscript "${title}": ${error.message}`);
  }
};

export const createManuscript = async (manuscriptData) => {
  try {
    const { data } = await axios.put(`${MANUSCRIPTS_ENDPOINTS.READ}/create`, manuscriptData);
    return data;
  } catch (error) {
    throw new Error(`Failed to create manuscript: ${error.message}`);
  }
};

export const updateManuscript = async (manuscriptData) => {
  try {
    const { data } = await axios.put(`${MANUSCRIPTS_ENDPOINTS.READ}/update`, manuscriptData);
    return data;
  } catch (error) {
    throw new Error(`Failed to update manuscript: ${error.message}`);
  }
};

export const updateManuscriptState = async (title, action, extraParams = {}) => {
  try {
    const requestData = { 
      title, 
      action,
      ...extraParams 
    };
    const { data } = await axios.put(`${MANUSCRIPTS_ENDPOINTS.READ}/update_state`, requestData);
    return data;
  } catch (error) {
    throw new Error(`Failed to update manuscript state for "${title}": ${error.message}`);
  }
};
