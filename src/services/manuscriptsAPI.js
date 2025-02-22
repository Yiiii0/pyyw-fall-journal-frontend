import axios from 'axios';
import { BACKEND_URL } from '../constants';

const MANUSCRIPTS_ENDPOINTS = {
  READ: `${BACKEND_URL}/manuscript`,
  READ_BY_TITLE: `${BACKEND_URL}/manuscript`
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
    const { data } = await axios.get(`${MANUSCRIPTS_ENDPOINTS.READ_BY_TITLE}/${encodeURIComponent(title)}`);
    return data ? [data] : [];
  } catch (error) {
    throw new Error(`Failed to fetch ${title}: ${error.message}`);
  }
};
