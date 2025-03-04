import axios from 'axios';
import { BACKEND_URL } from '../constants';

const MANUSCRIPTS_ENDPOINTS = {
  READ: `${BACKEND_URL}/manuscript`,
  TEXT: `${BACKEND_URL}/text`,
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

export const deleteManuscript = async (manuscriptId) => {
  try {
    const { data } = await axios.delete(`${MANUSCRIPTS_ENDPOINTS.READ}/${encodeURIComponent(manuscriptId)}`);
    return data;
  } catch (error) {
    throw new Error(`Failed to delete manuscript: ${error.message}`);
  }
};

export const createManuscript = async (manuscriptData) => {
  try {
    console.log('Creating manuscript with data:', manuscriptData);
    const { data } = await axios.put(`${MANUSCRIPTS_ENDPOINTS.READ}/create`, manuscriptData);
    console.log('Create manuscript response:', data);
    return data;
  } catch (error) {
    console.error('Create manuscript error:', error.response ? error.response.data : error);
    throw new Error(`Failed to create manuscript: ${error.message}`);
  }
};

export const updateManuscript = async (manuscriptData) => {
  try {
    // Validate manuscript data
    if (!manuscriptData.manu_id) {
      throw new Error('Manuscript ID is required for update');
    }
    
    // Ensure manu_id is a string
    if (typeof manuscriptData.manu_id !== 'string') {
      console.warn(`Converting manu_id from ${typeof manuscriptData.manu_id} to string:`, manuscriptData.manu_id);
      manuscriptData.manu_id = String(manuscriptData.manu_id);
    }
    
    console.log('Updating manuscript with data:', manuscriptData);
    console.log('Manuscript ID type:', typeof manuscriptData.manu_id);
    console.log('Manuscript ID value:', manuscriptData.manu_id);
    
    const { data } = await axios.put(`${MANUSCRIPTS_ENDPOINTS.READ}/update`, manuscriptData);
    console.log('Update manuscript response:', data);
    return data;
  } catch (error) {
    console.error('Update manuscript error:', error);
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
      throw new Error(`Failed to update manuscript: ${error.response.data.message || error.message}`);
    } else if (error.request) {
      console.error('Error request:', error.request);
      throw new Error(`Failed to update manuscript: No response received from server`);
    } else {
      console.error('Error message:', error.message);
      throw new Error(`Failed to update manuscript: ${error.message}`);
    }
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

// New functions for handling text pages

export const getTextPages = async (manuscriptId) => {
  try {
    const { data } = await axios.get(`${MANUSCRIPTS_ENDPOINTS.TEXT}/manuscript/${encodeURIComponent(manuscriptId)}`);
    return data;
  } catch (error) {
    throw new Error(`Failed to fetch text pages for manuscript ${manuscriptId}: ${error.message}`);
  }
};

export const getTextPage = async (manuscriptId, pageNumber) => {
  try {
    const { data } = await axios.get(`${MANUSCRIPTS_ENDPOINTS.TEXT}/manuscript/${encodeURIComponent(manuscriptId)}/page/${encodeURIComponent(pageNumber)}`);
    return data;
  } catch (error) {
    throw new Error(`Failed to fetch text page ${pageNumber} for manuscript ${manuscriptId}: ${error.message}`);
  }
};

export const createTextPage = async (manuscriptId, pageData) => {
  try {
    const { data } = await axios.put(`${MANUSCRIPTS_ENDPOINTS.TEXT}/create`, {
      manuscript_id: manuscriptId,
      ...pageData
    });
    return data;
  } catch (error) {
    throw new Error(`Failed to create text page for manuscript ${manuscriptId}: ${error.message}`);
  }
};

export const updateTextPage = async (manuscriptId, pageNumber, pageData) => {
  try {
    const { data } = await axios.put(`${MANUSCRIPTS_ENDPOINTS.TEXT}/update`, {
      manuscript_id: manuscriptId,
      page_number: pageNumber,
      ...pageData
    });
    return data;
  } catch (error) {
    throw new Error(`Failed to update text page ${pageNumber} for manuscript ${manuscriptId}: ${error.message}`);
  }
};

export const deleteTextPage = async (manuscriptId, pageNumber) => {
  try {
    const { data } = await axios.delete(`${MANUSCRIPTS_ENDPOINTS.TEXT}/manuscript/${encodeURIComponent(manuscriptId)}/page/${encodeURIComponent(pageNumber)}`);
    return data;
  } catch (error) {
    throw new Error(`Failed to delete text page ${pageNumber} for manuscript ${manuscriptId}: ${error.message}`);
  }
};

// Function to delete all text pages associated with a manuscript
export const deleteAllTextPages = async (manuscriptId) => {
  try {
    // Get all text pages for the manuscript
    const textPages = await getTextPages(manuscriptId);
    
    // Delete each text page
    const deletePromises = textPages.map(page => 
      deleteTextPage(manuscriptId, page.pageNumber)
    );
    
    await Promise.all(deletePromises);
    return true;
  } catch (error) {
    console.error(`Failed to delete all text pages for manuscript ${manuscriptId}:`, error);
    // We don't throw here because we want the manuscript deletion to continue even if text page deletion fails
    return false;
  }
};
