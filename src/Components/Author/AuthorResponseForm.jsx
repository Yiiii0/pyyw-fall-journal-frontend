import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './AuthorResponseForm.css';

const AuthorResponseForm = ({ manuscript, comments, onSubmit, onCancel }) => {
    const [responseText, setResponseText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasRevisions, setHasRevisions] = useState(true);
    const [withdrawReason, setWithdrawReason] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (hasRevisions) {
                await onSubmit({
                    action: 'REVISE',
                    manuscriptId: manuscript._id,
                    responseText,
                    hasRevisions
                });
            } else {
                await onSubmit({
                    action: 'WITHDRAW',
                    manuscriptId: manuscript._id,
                    responseText: withdrawReason,
                    hasRevisions
                });
            }
        } catch (error) {
            console.error('Error submitting author response:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="author-response-form">
            <h3>Respond to Referee Comments</h3>

            <div className="referee-comments-section">
                <h4>Referee Comments</h4>
                {comments.length > 0 ? (
                    <ul className="comments-list">
                        {comments.map((comment, index) => (
                            <li key={index} className="comment-item">
                                <div className="comment-header">
                                    <span className="comment-author">{comment.author || 'Anonymous'}</span>
                                    <span className="comment-date">
                                        {new Date(comment.date).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="comment-text">{comment.text}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="no-comments">No comments available</p>
                )}
            </div>

            <div className="response-options">
                <label className="response-option">
                    <input
                        type="radio"
                        name="responseType"
                        checked={hasRevisions}
                        onChange={() => setHasRevisions(true)}
                    />
                    <span>I will revise my manuscript</span>
                </label>
                <label className="response-option">
                    <input
                        type="radio"
                        name="responseType"
                        checked={!hasRevisions}
                        onChange={() => setHasRevisions(false)}
                    />
                    <span>I wish to withdraw my manuscript</span>
                </label>
            </div>

            {hasRevisions ? (
                <div className="revision-explanation">
                    <h4>Explain Your Revisions</h4>
                    <p className="form-instructions">
                        Please describe the changes you've made in response to the referee comments.
                        Be specific about how you've addressed each point.
                    </p>
                    <textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="Describe your revisions here..."
                        rows={8}
                        required
                    />
                </div>
            ) : (
                <div className="withdrawal-reason">
                    <h4>Reason for Withdrawal</h4>
                    <p className="form-instructions">
                        Please provide a brief explanation for why you're withdrawing your manuscript.
                    </p>
                    <textarea
                        value={withdrawReason}
                        onChange={(e) => setWithdrawReason(e.target.value)}
                        placeholder="Explain why you're withdrawing your manuscript..."
                        rows={4}
                        required
                    />
                </div>
            )}

            <div className="form-actions">
                <button
                    type="button"
                    className="cancel-button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    className="submit-button"
                    onClick={handleSubmit}
                    disabled={isSubmitting || (hasRevisions && !responseText) || (!hasRevisions && !withdrawReason)}
                >
                    {isSubmitting ? 'Submitting...' : hasRevisions ? 'Submit Revisions' : 'Withdraw Manuscript'}
                </button>
            </div>
        </div>
    );
};

AuthorResponseForm.propTypes = {
    manuscript: PropTypes.object.isRequired,
    comments: PropTypes.array.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
};

export default AuthorResponseForm;
