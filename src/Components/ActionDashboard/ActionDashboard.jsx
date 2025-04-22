import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ActionDashboard.css';
import { getManuscripts } from '../../services/manuscriptsAPI';
import { removeRefereeFromManuscript } from '../../services/refereeAPI';
import { useAuth } from '../../contexts/AuthContext';

function ActionDashboard() {
    const [manuscripts, setManuscripts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [withdrawing, setWithdrawing] = useState(false);
    const { currentUser } = useAuth();

    const fetchManuscripts = async () => {
        try {
            setLoading(true);
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

            // Filter manuscripts to only include those where the current user is assigned as referee
            if (currentUser && currentUser.email) {
                manuscriptsArray = manuscriptsArray.filter(manuscript => {
                    return manuscript.referees &&
                        Array.isArray(manuscript.referees) &&
                        manuscript.referees.includes(currentUser.email);
                });
            }

            console.log("Filtered manuscripts for current user:", manuscriptsArray); // Debug: Log filtered array
            setManuscripts(manuscriptsArray);
            setError('');
        } catch (err) {
            console.error("Error fetching manuscripts:", err); // Debug: Log any errors
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser && currentUser.email) {
            fetchManuscripts();
        }
    }, [currentUser]);

    const handleWithdraw = async (manuscriptId) => {
        if (!currentUser || !currentUser.email) {
            setError("User information not available");
            return;
        }

        const confirmWithdraw = window.confirm(
            "Are you sure you want to withdraw as a referee from this manuscript? This action cannot be undone."
        );

        if (!confirmWithdraw) {
            return;
        }

        try {
            setWithdrawing(true);
            await removeRefereeFromManuscript(manuscriptId, currentUser.email);
            await fetchManuscripts(); // Refresh the manuscripts list

            // Show success message
            alert("You have successfully withdrawn as a referee from this manuscript.");
        } catch (err) {
            console.error("Error withdrawing from manuscript:", err);
            setError(`Failed to withdraw: ${err.message}`);
        } finally {
            setWithdrawing(false);
        }
    };

    return (
        <div className="action-dashboard-container">
            <h2 className="action-dashboard-heading">Action Dashboard</h2>

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
                                        <button
                                            className="withdraw-button"
                                            onClick={() => handleWithdraw(manuscript._id)}
                                            disabled={withdrawing}
                                        >
                                            {withdrawing ? "Withdrawing..." : "Withdraw"}
                                        </button>
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
