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
    const [reviewAction, setReviewAction] = useState('');
    const [revisionComments, setRevisionComments] = useState('');

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

    const handleSelectAction = (action) => {
        setReviewAction(action);
        if (action !== 'AWR') {
            // Clear revision comments if not doing "Accept with Revisions"
            setRevisionComments('');
        }
    };

    const handleSubmitAction = async () => {
        try {
            if (reviewAction === 'AWR' && revisionComments.trim() === '') {
                setError('Please provide revision comments.');
                return;
            }

            // Determine action message for alert
            const actionMessage = reviewAction === 'ACC' ? 'accepted' :
                reviewAction === 'REJ' ? 'rejected' :
                    'accepted with revisions';

            // Include revision comments if applicable
            const payload = reviewAction === 'AWR' ? { comments: revisionComments } : undefined;

            await updateManuscriptState(manuscript._id, reviewAction, payload);
            alert(`Manuscript ${actionMessage} successfully!`);
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

                <div className="review-action-selection">
                    <h4>Your Decision</h4>
                    <div className="review-actions">
                        <button
                            className={`action-button accept-button ${reviewAction === 'ACC' ? 'selected' : ''}`}
                            onClick={() => handleSelectAction('ACC')}
                        >
                            Accept
                        </button>
                        <button
                            className={`action-button revisions-button ${reviewAction === 'AWR' ? 'selected' : ''}`}
                            onClick={() => handleSelectAction('AWR')}
                        >
                            Accept with Revisions
                        </button>
                        <button
                            className={`action-button reject-button ${reviewAction === 'REJ' ? 'selected' : ''}`}
                            onClick={() => handleSelectAction('REJ')}
                        >
                            Reject
                        </button>
                    </div>

                    {reviewAction === 'AWR' && (
                        <div className="revision-comments-container">
                            <h4>Revision Comments</h4>
                            <p className="revision-instructions">Please provide specific feedback and suggestions for the author:</p>
                            <textarea
                                className="revision-comments"
                                value={revisionComments}
                                onChange={(e) => setRevisionComments(e.target.value)}
                                placeholder="Explain what changes or improvements are needed..."
                                required
                            />
                        </div>
                    )}

                    {reviewAction && (
                        <div className="submit-container">
                            <button
                                className="submit-action-button"
                                onClick={handleSubmitAction}
                            >
                                Submit Decision
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ManuscriptReview;
