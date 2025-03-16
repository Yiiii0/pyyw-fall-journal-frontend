import axios from 'axios';
import { BACKEND_URL } from '../constants';

const MASTHEAD_ENDPOINTS = {
    READ: `${BACKEND_URL}/people/masthead`,
};

export const getMasthead = async () => {
    try {
        const { data } = await axios.get(MASTHEAD_ENDPOINTS.READ);
        return data;
    } catch (error) {
        throw new Error(`Failed to fetch manuscript: ${error.message}`);
    }
};