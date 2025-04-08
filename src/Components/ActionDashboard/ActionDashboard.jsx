import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ActionDashboard.css';
import { getManuscripts } from '../../services/manuscriptsAPI';
import { useAuth } from '../../contexts/AuthContext';

function ActionDashboard() {
    const [manuscripts, setManuscripts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { currentUser } = useAuth();

    useEffect(() => {
        const fetchManuscripts = async () => {
            try {
                const data = await getManuscripts();
                console.log("API Response:", data); // Debug: Log the complete API response

                // Check the data structure
                let manuscriptsArray = [];

                if (data && data.manuscripts) {
                    // Case 1: data has manuscripts property as an array
                    if (Array.isArray(data.manuscripts)) {
                        manuscriptsArray = data.manuscripts;
                    }
                    // Case 2: data has manuscripts property as an object
                    else if (typeof data.manuscripts === 'object') {
                        manuscriptsArray = Object.values(data.manuscripts).filter(item => item !== null);
                    }
                } else if (Array.isArray(data)) {
                    // Case 3: data itself is an array
                    manuscriptsArray = data;
                } else if (typeof data === 'object' && data !== null) {
                    // Case 4: data is a plain object (key-value pairs of manuscripts)
                    manuscriptsArray = Object.values(data).filter(item => item !== null);
                }

                console.log("Processed manuscripts array:", manuscriptsArray); // Debug: Log the processed array
                console.log("Manuscripts array length:", manuscriptsArray.length); // Debug: Log the array length

                // TEST MODE: Set all manuscripts for testing
                setManuscripts(manuscriptsArray);
                setError('');
            } catch (err) {
                console.error("Error fetching manuscripts:", err); // Debug: Log any errors
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (currentUser && currentUser.email) {
            fetchManuscripts();
        }
    }, [currentUser]);

    return (
        <div className="action-dashboard-container">
            <h2 className="action-dashboard-heading">Action Dashboard</h2>
            <p className="test-mode-notice">TEST MODE: Showing all manuscripts</p>

            <div className="action-box">
                <h3 className="action-box-title">Referee Action</h3>
                <div className="action-box-content">
                    <p>Available manuscripts for review:</p>

                    {loading ? (
                        <p>Loading manuscripts...</p>
                    ) : error ? (
                        <div className="error-message">{error}</div>
                    ) : manuscripts.length > 0 ? (
                        <div className="manuscripts-list">
                            {manuscripts.map(manuscript => (
                                <div className="manuscript-item" key={manuscript._id}>
                                    <h4 className="manuscript-title">{manuscript.title}</h4>
                                    <p className="manuscript-author">Author: {manuscript.author}</p>
                                    <div className="manuscript-actions">
                                        <Link to={`/referee/review/${manuscript._id}`} className="review-button">
                                            Review
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>No manuscripts available for review.</p>
                    )}
                </div>
            </div>

            <ul className="action-dashboard-links">
                <li>
                    <Link to="/manuscripts" className="action-dashboard-link">
                        Manuscripts
                    </Link>
                </li>
            </ul>
        </div>
    );
}

export default ActionDashboard;
