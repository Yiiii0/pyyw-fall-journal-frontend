import axios from 'axios';
import { BACKEND_URL } from '../constants';

const MANUSCRIPTS_ENDPOINTS = {
  READ: `${BACKEND_URL}/manuscript`,
};

const GET_MANUSCRIPT = `${BACKEND_URL}/manuscript`;
const GET_MANUSCRIPT_VALID_ACTIONS = `${BACKEND_URL}/manuscript/valid_actions`;
const GET_MANUSCRIPT_EDITOR_ACTIONS = `${BACKEND_URL}/manuscript/editor_actions`;
const GET_MANUSCRIPT_REFEREE_ACTIONS = `${BACKEND_URL}/manuscript/referee_actions`;

// Get token from localStorage
const getToken = () => {
  return localStorage.getItem('token');
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
    const { data } = await axios.get(`${GET_MANUSCRIPT}?title=${encodeURIComponent(title)}`);
    // Convert the object format to array format
    if (data && typeof data === 'object') {
      const manuscriptsArray = Object.values(data).filter(manuscript => manuscript !== null);
      return { manuscripts: manuscriptsArray };
    }
    return { manuscripts: [] };
  } catch (error) {
    throw new Error(`Failed to fetch ${title}: ${error.message}`);
  }
};

export const deleteManuscriptByTitle = async (title) => {
  try {
    // First, get the manuscript by title to get its ID
    const manuscripts = await getManuscriptsByTitle(title);
    if (!manuscripts.manuscripts || manuscripts.manuscripts.length === 0) {
      throw new Error(`No manuscript found with title "${title}"`);
    }
    
    const manuscript = manuscripts.manuscripts[0];
    const manuscriptId = manuscript._id;
    
    // Delete using the ID
    const { data } = await axios.delete(`${MANUSCRIPTS_ENDPOINTS.READ}/${manuscriptId}`);
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

export const updateManuscriptState = async (manuscriptId, action, extraParams = {}) => {
  try {
    const requestData = { 
      _id: manuscriptId,
      action,
      ...extraParams 
    };
    console.log("Sending update state request:", requestData);
    const { data } = await axios.put(`${MANUSCRIPTS_ENDPOINTS.READ}/update_state`, requestData);
    console.log("Update state response:", data);
    return data;
  } catch (error) {
    console.error("Error updating manuscript state:", error);
    console.error("Error response data:", error.response?.data);
    console.error("Error status:", error.response?.status);
    console.error("Error status text:", error.response?.statusText);
    throw new Error(`Failed to update manuscript state for "${manuscriptId}": ${error.message}`);
  }
};

// Get valid actions for a given manuscript state
export const getValidActions = async (state) => {
  try {
    const response = await fetch(`${GET_MANUSCRIPT_VALID_ACTIONS}/${state}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch valid actions');
    }
    const data = await response.json();
    return data.valid_actions;
  } catch (error) {
    throw new Error(`Error fetching valid actions: ${error.message}`);
  }
};

// Get all possible editor actions
export const getEditorActions = async () => {
  try {
    const response = await fetch(GET_MANUSCRIPT_EDITOR_ACTIONS, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch editor actions');
    }
    const data = await response.json();
    return data.editor_actions;
  } catch (error) {
    throw new Error(`Error fetching editor actions: ${error.message}`);
  }
};

// Get all possible referee actions
export const getRefereeActions = async () => {
  try {
    const response = await fetch(GET_MANUSCRIPT_REFEREE_ACTIONS, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch referee actions');
    }
    const data = await response.json();
    return data.referee_actions;
  } catch (error) {
    throw new Error(`Error fetching referee actions: ${error.message}`);
  }
};

// Get all manuscripts
export const getManuscripts = async () => {
  try {
    const { data } = await axios.get(GET_MANUSCRIPT);
    // Convert the object format to array format
    if (data && typeof data === 'object') {
      const manuscriptsArray = Object.values(data).filter(manuscript => manuscript !== null);
      return { manuscripts: manuscriptsArray };
    }
    return { manuscripts: [] };
  } catch (error) {
    throw new Error(`Failed to fetch manuscripts: ${error.message}`);
  }
};

// Get a single manuscript by ID
export const getManuscriptById = async (id) => {
  try {
    // The backend expects the raw ID without any encoding or replacement
    const { data } = await axios.get(`${GET_MANUSCRIPT}/${id}`);
    return data;
  } catch (error) {
    throw new Error(`Failed to fetch manuscript with ID ${id}: ${error.message}`);
  }
};
