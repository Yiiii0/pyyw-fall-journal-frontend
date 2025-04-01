const API_URL = process.env.REACT_APP_API_URL || '';

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
        const response = await fetch(`${API_URL}/api/manuscripts/${manuscriptId}/referees`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ refereeEmail }),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to add referee to manuscript');
        }

        return await response.json();
    } catch (error) {
        console.error('Error adding referee to manuscript:', error);
        throw error;
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
