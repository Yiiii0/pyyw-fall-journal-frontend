import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getManuscriptById, updateManuscriptState } from '../../services/manuscriptsAPI';
import './ManuscriptReview.css';

function ManuscriptReview() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [manuscript, setManuscript] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchManuscript = async () => {
            try {
                const data = await getManuscriptById(id);
                setManuscript(data);
                setError('');
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchManuscript();
    }, [id]);

    const handleAction = async (action) => {
        try {
            // Assuming we have actions defined as 'ACC' for accept and 'REJ' for reject
            await updateManuscriptState(manuscript.title, action);
            alert(`Manuscript ${action === 'ACC' ? 'accepted' : 'rejected'} successfully!`);
            navigate('/action-dashboard');
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <p className="loading-message">Loading manuscript...</p>;
    if (error) return <div className="error-message">{error}</div>;
    if (!manuscript) return <p>No manuscript found with ID: {id}</p>;

    return (
        <div className="manuscript-review-container">
            <h2 className="manuscript-review-heading">Review Manuscript</h2>

            <div className="manuscript-details">
                <h3>{manuscript.title}</h3>
                <p className="manuscript-author">Author: {manuscript.author}</p>
                <p className="manuscript-email">Email: {manuscript.author_email}</p>

                <div className="manuscript-content-section">
                    <h4>Abstract</h4>
                    <div className="manuscript-abstract">
                        {manuscript.abstract}
                    </div>
                </div>

                <div className="manuscript-content-section">
                    <h4>Main Text</h4>
                    <div className="manuscript-text">
                        {manuscript.text}
                    </div>
                </div>

                <div className="review-actions">
                    <button
                        className="accept-button"
                        onClick={() => handleAction('ACC')}
                    >
                        Accept
                    </button>
                    <button
                        className="reject-button"
                        onClick={() => handleAction('REJ')}
                    >
                        Reject
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ManuscriptReview;
