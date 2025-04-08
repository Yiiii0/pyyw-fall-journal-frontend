const API_URL = process.env.REACT_APP_API_URL || '';
import axios from 'axios';
import { BACKEND_URL } from '../constants';

/**
 * Fetches all referees available
 * @returns {Promise<Array>} List of referee objects
 */
export const getReferees = async () => {
    try {
        const response = await fetch(`${API_URL}/api/referees`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to fetch referees');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching referees:', error);
        throw error;
    }
};

/**
 * Adds a referee to a specific manuscript
 * @param {string} manuscriptId - ID of the manuscript
 * @param {string} refereeEmail - Email of the referee to assign
 * @returns {Promise<Object>} Updated manuscript object
 */
export const addRefereeToManuscript = async (manuscriptId, refereeEmail) => {
    try {
        // Use axios to match other API calls in manuscriptsAPI.js
        const { data } = await axios.put(`${BACKEND_URL}/manuscript/update_state`, {
            _id: manuscriptId,        // MANU_ID = '_id'
            action: 'ARF',            // ASSIGN_REF action code
            referee: refereeEmail     // REFEREE = 'referee'
        });
        
        return data;
    } catch (error) {
        console.error('Error adding referee to manuscript:', error);
        throw new Error(`Failed to add referee to manuscript: ${error.message}`);
    }
};

/**
 * Creates a new referee user
 * @param {Object} refereeData - Referee data (email, password, affiliation)
 * @returns {Promise<Object>} Created referee object
 */
export const createReferee = async (refereeData) => {
    try {
        const response = await fetch(`${API_URL}/api/referees`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(refereeData),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to create referee');
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating referee:', error);
        throw error;
    }
};
