import axios from 'axios';
import { BACKEND_URL } from '../constants';

// RE - Referee
const REFEREE_ENDPOINTS = {
    UPDATE_MANUSCRIPT: `${BACKEND_URL}/manuscript/update_state`,
    ADD_ROLE: `${BACKEND_URL}/people/add_role`,
    SUBMIT_COMMENTS: `${BACKEND_URL}/manuscript/submit_comments`,
};

// Add referee role to a person
export const addRefereeRole = async (email) => {
    try {
        const { data } = await axios.put(REFEREE_ENDPOINTS.ADD_ROLE, {
            id: email,
            role: 'RE'
        });
        return data;
    } catch (error) {
        // Handle specific duplicate role error
        if (error.response?.status === 406 &&
            error.response?.data?.message?.includes("duplicate role")) {
            console.log("User already has referee role, continuing with assignment");
            // We can continue since the user already has the referee role
            return { message: "User already has referee role" };
        }

        const errorMessage = error.response?.data?.message || error.message;
        throw new Error(`Failed to add referee role: ${errorMessage}`);
    }
};

// Assign a referee to a manuscript
export const addRefereeToManuscript = async (manuscriptId, refereeEmail) => {
    try {
        const { data } = await axios.put(REFEREE_ENDPOINTS.UPDATE_MANUSCRIPT, {
            _id: manuscriptId,
            action: 'ARF',
            referee: refereeEmail
        });

        return data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message;
        throw new Error(`Failed to assign referee to manuscript: ${errorMessage}`);
    }
};

// Delete a referee from a manuscript
export const removeRefereeFromManuscript = async (manuscriptId, refereeEmail) => {
    try {
        const { data } = await axios.put(REFEREE_ENDPOINTS.UPDATE_MANUSCRIPT, {
            _id: manuscriptId,
            action: 'DRF',
            referee: refereeEmail
        });

        return data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message;
        throw new Error(`Failed to remove referee from manuscript: ${errorMessage}`);
    }
};

// Make a person a referee for a manuscript
// This function directly assigns the person as a referee to the manuscript
export const makePersonRefereeForManuscript = async (manuscriptId, email) => {
    try {
        // Directly add person as referee to manuscript without checking/adding the role
        const result = await addRefereeToManuscript(manuscriptId, email);
        return result;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message;
        throw new Error(`Failed to make person referee for manuscript: ${errorMessage}`);
    }
};

// Submit referee comments (replacing the direct accept/reject functionality)
export const submitRefereeComments = async (manuscriptId, refereeEmail, comments) => {
    try {
        const { data } = await axios.put(REFEREE_ENDPOINTS.UPDATE_MANUSCRIPT, {
            _id: manuscriptId,
            action: 'SBR', // Submit Review
            referee: refereeEmail,
            comments: comments
        });

        return data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message;
        throw new Error(`Failed to submit referee comments: ${errorMessage}`);
    }
};
