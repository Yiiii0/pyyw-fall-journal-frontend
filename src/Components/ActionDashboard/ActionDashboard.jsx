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
                const manuscriptsArray = Array.isArray(data.manuscripts) ? data.manuscripts : [];

                // Filter manuscripts where the current user is listed as a referee
                const assignedManuscripts = manuscriptsArray.filter(manuscript => {
                    // Check if the manuscript has a referees array and if the current user's email is in it
                    return manuscript.referees &&
                        Array.isArray(manuscript.referees) &&
                        manuscript.referees.includes(currentUser.email);
                });

                setManuscripts(assignedManuscripts);
                setError('');
            } catch (err) {
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

            <div className="action-box">
                <h3 className="action-box-title">Referee Action</h3>
                <div className="action-box-content">
                    <p>Your assigned manuscripts for review:</p>

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
                        <p>No manuscripts assigned for review.</p>
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
