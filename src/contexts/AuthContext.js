import React, { useContext, useState, createContext } from 'react';
import PropTypes from 'prop-types';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    // Initialize currentUser from localStorage if available
    const [currentUser, setCurrentUser] = useState(() => {
        const savedUser = localStorage.getItem('userData');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    function login(userData) {
        setCurrentUser(userData);
        localStorage.setItem('userData', JSON.stringify(userData));
        return userData;
    }

    function logout() {
        setCurrentUser(null);
        localStorage.removeItem('userData');
    }

    const value = {
        currentUser,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
};