import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getManuscriptById, updateManuscriptState } from '../../services/manuscriptsAPI';
import { createComment } from '../../services/commentsAPI';
import { useAuth } from '../../contexts/AuthContext';
import './ManuscriptReview.css';

function ManuscriptReview() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [manuscript, setManuscript] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [revisionComments, setRevisionComments] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (currentUser && !localStorage.getItem('user')) {
            localStorage.setItem('user', JSON.stringify(currentUser));
            console.log('Saved user info to localStorage:', currentUser);
        }
    }, [currentUser]);

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

    // ensure the comment is saved in the database
    const saveComment = async (manuscriptId, refereeId, commentText) => {
        try {
            console.log('Attempting to save comment:', {
                manuscriptId,
                refereeId,
                commentText
            });

            // first try to save the comment using the API
            const commentResult = await createComment(manuscriptId, refereeId, commentText);
            console.log('Comment creation succeeded:', commentResult);
            return true;
        } catch (err) {
            console.error('Failed to save comment via API:', err);

            // if the comment API fails, record the error but do not stop the process
            console.warn('Comment could not be saved as a separate entity, will rely on manuscript update');
            return false;
        }
    };

    // save the referee decision to localStorage
    const saveRefereeDecision = (manuscriptId, refereeId) => {
        try {
            // Get current decisions
            const savedDecisions = localStorage.getItem('refereeDecisions');
            let refereeDecisions = savedDecisions ? JSON.parse(savedDecisions) : {};

            // update with the new decision
            if (!refereeDecisions[manuscriptId]) {
                refereeDecisions[manuscriptId] = {};
            }

            // Only storing "COMMENTS_SUBMITTED" status for referee
            refereeDecisions[manuscriptId][refereeId] = 'COMMENTS_SUBMITTED';

            // save back to localStorage
            localStorage.setItem('refereeDecisions', JSON.stringify(refereeDecisions));
            console.log(`Saved referee submission to localStorage`);

            return true;
        } catch (err) {
            console.error('Error saving referee decision to localStorage:', err);
            return false;
        }
    };

    const handleSubmitAction = async () => {
        try {
            setSubmitting(true);

            if (revisionComments.trim() === '') {
                setError('Please provide revision comments.');
                setSubmitting(false);
                return;
            }

            // Get referee ID (email or ID)
            const refereeId = currentUser.email || currentUser.id;

            // 1. Save referee decision to localStorage
            saveRefereeDecision(manuscript._id, refereeId);

            // 2. Save the comment
            let commentSaveResult = false;
            if (revisionComments.trim() !== '') {
                commentSaveResult = await saveComment(manuscript._id, refereeId, revisionComments);
            }

            // 3. Update the manuscript state with SBR (Submit Review) action code
            const payload = {
                comments: revisionComments,
                referee: currentUser.email || currentUser.id
            };

            console.log('Submitting referee comments with:', {
                manuscriptId: manuscript._id,
                action: 'SBR', // Submit Review
                payload
            });

            // 4. Update the manuscript state
            await updateManuscriptState(manuscript._id, 'SBR', payload);

            // 5. Success message
            if (commentSaveResult) {
                alert(`Comments submitted successfully!`);
            } else {
                alert(`Comments submitted successfully! Comment was saved with the manuscript record.`);
            }

            navigate('/action-dashboard');
        } catch (err) {
            console.error("Error in handleSubmitAction:", err);
            if (err.response && err.response.data) {
                console.error("Server response:", err.response.data);
                setError(`${err.message}: ${JSON.stringify(err.response.data)}`);
            } else {
                setError(err.message);
            }
        } finally {
            setSubmitting(false);
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
                    <h4>Provide Feedback</h4>

                    <div className="revision-comments-container">
                        <h4>Review Comments</h4>
                        <p className="revision-instructions">Please provide specific feedback and suggestions for the manuscript:</p>
                        <textarea
                            className="revision-comments"
                            value={revisionComments}
                            onChange={(e) => setRevisionComments(e.target.value)}
                            placeholder="Enter your comments, observations, and suggestions..."
                            required
                        />
                    </div>

                    <div className="submit-container">
                        <button
                            className="submit-action-button"
                            onClick={handleSubmitAction}
                            disabled={submitting || revisionComments.trim() === ''}
                        >
                            {submitting ? 'Submitting...' : 'Submit Comments'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ManuscriptReview;
