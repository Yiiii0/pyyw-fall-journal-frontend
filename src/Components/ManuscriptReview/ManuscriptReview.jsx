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
    const [reviewAction, setReviewAction] = useState('');
    const [revisionComments, setRevisionComments] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // 确保在localStorage中存储用户信息的备份
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

    const handleSelectAction = (action) => {
        setReviewAction(action);
        if (action !== 'AWR') {
            // Clear revision comments if not doing "Accept with Revisions"
            setRevisionComments('');
        }
    };

    // 单独处理评论保存
    const saveComment = async (manuscriptId, refereeId, commentText) => {
        try {
            console.log('Attempting to save comment:', {
                manuscriptId,
                refereeId,
                commentText
            });
            
            // 首先尝试使用API保存评论
            const commentResult = await createComment(manuscriptId, refereeId, commentText);
            console.log('Comment creation succeeded:', commentResult);
            return true;
        } catch (err) {
            console.error('Failed to save comment via API:', err);
            
            // 如果评论API出错，记录错误但不阻止流程
            console.warn('Comment could not be saved as a separate entity, will rely on manuscript update');
            return false;
        }
    };

    // Save referee decision to localStorage
    const saveRefereeDecision = (manuscriptId, refereeId, decision) => {
        try {
            // Get current decisions
            const savedDecisions = localStorage.getItem('refereeDecisions');
            let refereeDecisions = savedDecisions ? JSON.parse(savedDecisions) : {};
            
            // Update with new decision
            if (!refereeDecisions[manuscriptId]) {
                refereeDecisions[manuscriptId] = {};
            }
            
            // Map review actions to decision types
            const decisionMap = {
                'ACC': 'ACCEPT',
                'REJ': 'REJECT',
                'AWR': 'ACCEPT_WITH_REVISIONS'
            };
            
            refereeDecisions[manuscriptId][refereeId] = decisionMap[decision];
            
            // Save back to localStorage
            localStorage.setItem('refereeDecisions', JSON.stringify(refereeDecisions));
            console.log(`Saved referee decision to localStorage: ${decision}`);
            
            return true;
        } catch (err) {
            console.error('Error saving referee decision to localStorage:', err);
            return false;
        }
    };

    const handleSubmitAction = async () => {
        try {
            setSubmitting(true);
            
            if (reviewAction === 'AWR' && revisionComments.trim() === '') {
                setError('Please provide revision comments.');
                setSubmitting(false);
                return;
            }

            // Determine action message for alert
            const actionMessage = reviewAction === 'ACC' ? 'accepted' :
                reviewAction === 'REJ' ? 'rejected' :
                    'accepted with revisions';

            // Get referee ID (email or ID)
            const refereeId = currentUser.email || currentUser.id;

            // 1. Save referee decision to localStorage
            saveRefereeDecision(manuscript._id, refereeId, reviewAction);

            // 2. 先尝试创建评论（如果有评论）
            let commentSaveResult = false;
            if (reviewAction === 'AWR' && revisionComments.trim() !== '') {
                commentSaveResult = await saveComment(manuscript._id, refereeId, revisionComments);
            }

            // 2. 无论评论是否保存成功，都更新手稿状态
            // Include revision comments in the payload for backward compatibility
            const payload = reviewAction === 'AWR' ? { 
                comments: revisionComments,
                referee: currentUser.email || currentUser.id
            } : {
                referee: currentUser.email || currentUser.id
            };

            console.log('Updating manuscript state with:', {
                manuscriptId: manuscript._id,
                action: reviewAction,
                payload
            });

            // 更新手稿状态
            await updateManuscriptState(manuscript._id, reviewAction, payload);
            
            // 评论成功保存消息
            if (reviewAction === 'AWR') {
                if (commentSaveResult) {
                    alert(`Manuscript ${actionMessage} successfully! Comment was saved.`);
                } else {
                    alert(`Manuscript ${actionMessage} successfully! Comment was saved with the manuscript record.`);
                }
            } else {
                alert(`Manuscript ${actionMessage} successfully!`);
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
                                disabled={submitting}
                            >
                                {submitting ? 'Submitting...' : 'Submit Decision'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ManuscriptReview;
