import axios from 'axios';
import { BACKEND_URL } from '../constants';

const TEXT_ENDPOINTS = {
    READ: `${BACKEND_URL}/text`,
    UPDATE: `${BACKEND_URL}/text/update`,
};

export const getText = async (page_number) => {
    try {
        const { data } = await axios.get(`${TEXT_ENDPOINTS.READ}/${page_number}`);
        return data;
    } catch (error) {
        throw new Error(`Failed to fetch page: ${error.message}`);
    }
};

export const updateText = async (textData, callerEmail) => {
    try {
        const { pageNumber, title, text } = textData;
        const { data } = await axios.put(`${TEXT_ENDPOINTS.UPDATE}`, {
            pageNumber,
            title,
            text
        },
        {
            headers: {
                'X-User-Email': callerEmail
            }
        });
        return data;
    } catch (error) {
        throw new Error(`Failed to update text: ${error.message}`);
    }
};