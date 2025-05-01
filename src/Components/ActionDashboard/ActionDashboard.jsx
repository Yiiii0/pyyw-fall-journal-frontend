import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ActionDashboard.css';
import { getManuscripts, updateManuscriptState } from '../../services/manuscriptsAPI';
import { getCommentsByManuscript } from '../../services/commentsAPI';
import { useAuth } from '../../contexts/AuthContext';

function ActionDashboard() {
    const [manuscripts, setManuscripts] = useState([]);
    const [authorManuscripts, setAuthorManuscripts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [authorLoading, setAuthorLoading] = useState(true);
    const [error, setError] = useState('');
    const [authorError, setAuthorError] = useState('');
    const [expandedManuscripts, setExpandedManuscripts] = useState({});
    const { currentUser } = useAuth();
    const [manuscriptComments, setManuscriptComments] = useState({});
    const [submittingAction, setSubmittingAction] = useState(false);
    const [respondingToManuscript, setRespondingToManuscript] = useState(null);

    // Helper function to fetch comments for a manuscript
    const fetchComments = async (manuscriptId) => {
        try {
            const comments = await getCommentsByManuscript(manuscriptId);
            return comments;
        } catch (err) {
            console.error(`Error fetching comments for manuscript ${manuscriptId}:`, err);
            return [];
        }
    };

    // Process data from API to get consistent manuscript array
    const processManuscriptsData = (data) => {
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

        // Process comments for each manuscript
        manuscriptsArray = manuscriptsArray.map(manuscript => {
            // Process comments if they exist
            if (manuscript.comments) {
                // If comments is a string, convert it to a structured format
                if (typeof manuscript.comments === 'string') {
                    manuscript.comments = [{
                        text: manuscript.comments,
                        author: manuscript.editor_email || 'Editor',
                        date: new Date().toISOString()
                    }];
                }
                // If it's already an array, make sure it has the right structure
                else if (Array.isArray(manuscript.comments)) {
                    manuscript.comments = manuscript.comments.map(comment => {
                        if (typeof comment === 'string') {
                            return {
                                text: comment,
                                author: manuscript.editor_email || 'Editor',
                                date: new Date().toISOString()
                            };
                        }
                        return comment;
                    });
                }
            }
            return manuscript;
        });

        return manuscriptsArray;
    };

    const fetchManuscripts = async () => {
        try {
            setLoading(true);
            const data = await getManuscripts();
            console.log("API Response:", data); // Debug: Log the complete API response
            console.log("Current User:", currentUser); // Debug: Log the currentUser object

            // Process data to get manuscripts array
            let manuscriptsArray = processManuscriptsData(data);

            // Filter manuscripts to only include those where the current user is assigned as referee
            if (currentUser) {
                // User may have multiple identifiers: id, email, etc.
                const possibleIdentifiers = [
                    currentUser.id,
                    currentUser.email,
                    currentUser.username
                ].filter(Boolean); // Filter out undefined/null values

                console.log("User possible identifiers:", possibleIdentifiers); // Debug

                manuscriptsArray = manuscriptsArray.filter(manuscript => {
                    console.log("Manuscript referees:", manuscript.referees); // Debug

                    if (!manuscript.referees || !Array.isArray(manuscript.referees)) {
                        return false;
                    }

                    // Check if any of the user's identifiers are included in the manuscript's referees array
                    return possibleIdentifiers.some(id =>
                        manuscript.referees.includes(id)
                    );
                });
            }

            console.log("Filtered manuscripts for current user:", manuscriptsArray); // Debug: Log filtered array
            setManuscripts(manuscriptsArray);

            // Fetch comments for each manuscript
            const commentsPromises = manuscriptsArray.map(async (manuscript) => {
                const comments = await fetchComments(manuscript._id);
                return { manuscriptId: manuscript._id, comments };
            });

            const commentsResults = await Promise.all(commentsPromises);
            const commentsMap = {};
            commentsResults.forEach(({ manuscriptId, comments }) => {
                commentsMap[manuscriptId] = comments;
            });

            setManuscriptComments(commentsMap);
            setError('');
        } catch (err) {
            console.error("Error fetching manuscripts:", err); // Debug: Log any errors
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchAuthorManuscripts = async () => {
        try {
            setAuthorLoading(true);
            const data = await getManuscripts();
            console.log("Author manuscripts - API Response:", data); // Debug: Log the complete API response

            // Process data to get manuscripts array
            let manuscriptsArray = processManuscriptsData(data);
            console.log("Author manuscripts - After processing:", manuscriptsArray); // Debug: Log processed array

            // Filter manuscripts to only include those where the current user is the author
            if (currentUser) {
                const possibleIdentifiers = [
                    currentUser.id,
                    currentUser.email,
                    currentUser.username
                ].filter(Boolean);

                console.log("Author manuscripts - User identifiers:", possibleIdentifiers); // Debug: Log user identifiers

                // Log manuscript author fields for debugging
                manuscriptsArray.forEach(manuscript => {
                    console.log("Manuscript author fields:", {
                        id: manuscript._id,
                        title: manuscript.title,
                        author_email: manuscript.author_email,
                        author_id: manuscript.author_id,
                        author: manuscript.author
                    });
                });

                // Try a more flexible search approach
                manuscriptsArray = manuscriptsArray.filter(manuscript => {
                    // Original approach
                    const originalMatch = possibleIdentifiers.some(id =>
                        manuscript.author_email === id ||
                        manuscript.author_id === id
                    );

                    // More flexible approach - try different author fields
                    const flexibleMatch = possibleIdentifiers.some(id => {
                        // Check all possible author fields
                        const authorFields = [
                            manuscript.author_email,
                            manuscript.author_id,
                            manuscript.author,
                            manuscript.authorEmail,
                            manuscript.authorId,
                            manuscript.email
                        ];

                        return authorFields.some(field =>
                            field && (
                                field === id ||
                                (typeof field === 'string' && field.includes(id))
                            )
                        );
                    });

                    // Use either match
                    return originalMatch || flexibleMatch;
                });
            }

            console.log("Author manuscripts - After filtering:", manuscriptsArray); // Debug: Log filtered array
            setAuthorManuscripts(manuscriptsArray);

            // Fetch comments for these manuscripts too (if not already fetched)
            const newManuscriptIds = manuscriptsArray
                .filter(m => !manuscriptComments[m._id])
                .map(m => m._id);

            if (newManuscriptIds.length > 0) {
                const commentsPromises = newManuscriptIds.map(async (manuscriptId) => {
                    const comments = await fetchComments(manuscriptId);
                    return { manuscriptId, comments };
                });

                const commentsResults = await Promise.all(commentsPromises);
                const newCommentsMap = { ...manuscriptComments };

                commentsResults.forEach(({ manuscriptId, comments }) => {
                    newCommentsMap[manuscriptId] = comments;
                });

                setManuscriptComments(newCommentsMap);
            }

            setAuthorError('');
        } catch (err) {
            console.error("Error fetching author manuscripts:", err);
            setAuthorError(err.message);
        } finally {
            setAuthorLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser && (currentUser.id || currentUser.email)) {
            fetchManuscripts();
            fetchAuthorManuscripts();
        }
    }, [currentUser]);

    const toggleManuscriptDetails = (manuscriptId) => {
        setExpandedManuscripts(prev => ({
            ...prev,
            [manuscriptId]: !prev[manuscriptId]
        }));
    };

    // Helper function to get state display name
    const getStateDisplayName = (stateCode) => {
        const states = {
            'SUB': 'Submitted',
            'REV': 'In Review',
            'REJ': 'Rejected',
            'CED': 'Copy Editing',
            'AUR': 'Author Review',
            'WIT': 'Withdrawn',
            'EDR': 'Editor Review',
            'ARV': 'Author Revision',
            'AWR': 'Revision Completed', // Clear label showing revision is complete
            'FMT': 'Formatting',
            'PUB': 'Published',
            'DON': 'Done with Revisions'
        };
        return states[stateCode] || stateCode;
    };

    // Helper to format date string
    const formatDate = (dateString) => {
        if (!dateString) return 'No date';
        try {
            return new Date(dateString).toLocaleDateString();
        } catch (e) {
            return 'Invalid date';
        }
    };

    // Helper function to combine manuscript comments from both sources
    const getAllComments = (manuscript) => {
        // Get existing comments from the manuscript object
        const existingComments = manuscript.comments || [];
        const formattedExisting = Array.isArray(existingComments) ? existingComments :
            (typeof existingComments === 'string' && existingComments.trim() !== '') ?
                [{ text: existingComments, author: manuscript.editor_email || 'Editor', date: new Date().toISOString() }] : [];

        // Get comments from the comments API
        const apiComments = manuscriptComments[manuscript._id] || [];

        // Format API comments to match the structure
        const formattedApiComments = apiComments.map(comment => ({
            text: comment.text,
            author: comment.editor_id, // Using editor_id as the author
            date: comment.timestamp || new Date().toISOString()
        }));

        // Combine both sources
        return [...formattedExisting, ...formattedApiComments];
    };

    const handleCancelResponse = () => {
        setRespondingToManuscript(null);
    };

    // Replace the handleSubmitResponse function with a simpler version
    const handleSubmitRevisionComplete = async (manuscriptId) => {
        try {
            setSubmittingAction(true);

            // Confirm the action with the user
            if (!window.confirm(`Have you completed your revisions? This will notify the editor to review your updated manuscript.`)) {
                setSubmittingAction(false);
                return;
            }

            // Update to AWR (Awaiting Review) state which better represents the author has completed revisions 
            // and the manuscript is now awaiting another review
            await updateManuscriptState(manuscriptId, 'AWR');

            // Use template literals to avoid quote issues
            alert(`Your manuscript has been marked as "Revision Complete" and is now submitted for review.`);

            // Refresh the author manuscripts list
            await fetchAuthorManuscripts();

            // Close the response form if it was open
            setRespondingToManuscript(null);

        } catch (err) {
            console.error("Error marking revision as complete:", err);
            setAuthorError(`Failed to update manuscript: ${err.message}`);
            alert(`Error: ${err.message}`);
        } finally {
            setSubmittingAction(false);
        }
    };

    // Update the renderAuthorActions function to use the new simpler approach
    const renderAuthorActions = (manuscript) => {
        const allComments = getAllComments(manuscript);
        const hasComments = allComments.length > 0;

        switch (manuscript.state) {
            case 'ARV': // Author Revision
                return (
                    <button
                        className="revision-button"
                        onClick={() => setRespondingToManuscript(manuscript)}
                        disabled={submittingAction}
                    >
                        {submittingAction ? "Submitting..." : "View Comments & Mark Complete"}
                    </button>
                );
            case 'REJ': // Rejected
                return (
                    <span className="manuscript-status-badge rejected">
                        This manuscript has been rejected
                    </span>
                );
            case 'PUB': // Published
                return (
                    <span className="manuscript-status-badge published">
                        This manuscript has been published
                    </span>
                );
            case 'REV': // In Review
                if (hasComments) {
                    return (
                        <button
                            className="revision-button"
                            onClick={() => setRespondingToManuscript(manuscript)}
                            disabled={submittingAction}
                        >
                            {submittingAction ? "Submitting..." : "View Comments & Submit Revision"}
                        </button>
                    );
                }
                return (
                    <span className="manuscript-status-badge in-progress">
                        In review - waiting for referee comments
                    </span>
                );
            default:
                return (
                    <span className="manuscript-status-badge in-progress">
                        In progress - No action needed
                    </span>
                );
        }
    };

    return (
        <div className="action-dashboard-container">
            <h2 className="action-dashboard-heading">Action Dashboard</h2>

            {/* Referee Action Section */}
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
                            {manuscripts.map(manuscript => {
                                // Get all comments for this manuscript
                                const allComments = getAllComments(manuscript);
                                // Check if manuscript has comments to apply special styling
                                const hasComments = allComments.length > 0;

                                return (
                                    <div
                                        className={`manuscript-item ${hasComments ? 'has-comments' : ''}`}
                                        key={manuscript._id}
                                    >
                                        <div className="manuscript-header">
                                            <h4 className="manuscript-title">{manuscript.title}</h4>
                                            <span className={`manuscript-state state-${manuscript.state}`}>
                                                {getStateDisplayName(manuscript.state)}
                                            </span>
                                        </div>
                                        <p className="manuscript-author">Author: {manuscript.author}</p>

                                        <button
                                            className="toggle-details-button"
                                            onClick={() => toggleManuscriptDetails(manuscript._id)}
                                        >
                                            {expandedManuscripts[manuscript._id] ? 'Hide Details' : 'Show Details'}
                                        </button>

                                        {expandedManuscripts[manuscript._id] && (
                                            <div className="manuscript-details">
                                                <div className="details-section">
                                                    <h5>Abstract</h5>
                                                    <p>{manuscript.abstract}</p>
                                                </div>

                                                {allComments.length > 0 ? (
                                                    <div className="comments-section">
                                                        <h5>Revision Comments</h5>
                                                        <ul className="comments-list">
                                                            {allComments.map((comment, index) => (
                                                                <li key={index} className="comment-item">
                                                                    <div className="comment-header">
                                                                        <span className="comment-author">{comment.author || 'Anonymous'}</span>
                                                                        <span className="comment-date">
                                                                            {formatDate(comment.date)}
                                                                        </span>
                                                                    </div>
                                                                    <p className="comment-text">{comment.text}</p>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                ) : (
                                                    <div className="comments-section">
                                                        <h5>Revision Comments</h5>
                                                        <p className="no-comments-placeholder">No comments yet</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="manuscript-actions">
                                            <Link to={`/referee/review/${manuscript._id}`} className="review-button">
                                                Review
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p>No manuscripts available for review.</p>
                    )}
                </div>
            </div>

            {/* Author Action Section */}
            <div className="action-box">
                <h3 className="action-box-title">Author Action</h3>
                <div className="action-box-content">
                    <p>Your manuscript submissions:</p>

                    {authorLoading ? (
                        <p>Loading your manuscripts...</p>
                    ) : authorError ? (
                        <div className="error-message">{authorError}</div>
                    ) : authorManuscripts.length > 0 ? (
                        <div className="manuscripts-list">
                            {authorManuscripts.map(manuscript => {
                                // Get all comments for this manuscript
                                const allComments = getAllComments(manuscript);
                                // Check if manuscript has comments to apply special styling
                                const hasComments = allComments.length > 0;

                                return (
                                    <div
                                        className={`manuscript-item ${hasComments ? 'has-comments' : ''}`}
                                        key={manuscript._id}
                                    >
                                        <div className="manuscript-header">
                                            <h4 className="manuscript-title">{manuscript.title}</h4>
                                            <span className={`manuscript-state state-${manuscript.state}`}>
                                                {getStateDisplayName(manuscript.state)}
                                            </span>
                                        </div>
                                        <p className="manuscript-editor">Editor: {manuscript.editor_email}</p>

                                        {/* Show referee decision summary if available */}
                                        {manuscript.referee_decisions && Object.keys(manuscript.referee_decisions).length > 0 && (
                                            <div className="referee-decisions-summary">
                                                <h5>Referee Decisions:</h5>
                                                <ul className="decisions-list">
                                                    {Object.entries(manuscript.referee_decisions).map(([referee, decision], index) => (
                                                        <li key={index} className={`decision-item decision-${decision.toLowerCase()}`}>
                                                            <span className="decision-label">{decision}</span> by {referee}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        <button
                                            className="toggle-details-button"
                                            onClick={() => toggleManuscriptDetails(`author-${manuscript._id}`)}
                                        >
                                            {expandedManuscripts[`author-${manuscript._id}`] ? 'Hide Details' : 'Show Details'}
                                        </button>

                                        {expandedManuscripts[`author-${manuscript._id}`] && (
                                            <div className="manuscript-details">
                                                <div className="details-section">
                                                    <h5>Abstract</h5>
                                                    <p>{manuscript.abstract}</p>
                                                </div>

                                                {allComments.length > 0 ? (
                                                    <div className="comments-section">
                                                        <h5>Revision Comments</h5>
                                                        <ul className="comments-list">
                                                            {allComments.map((comment, index) => (
                                                                <li key={index} className="comment-item">
                                                                    <div className="comment-header">
                                                                        <span className="comment-author">{comment.author || 'Anonymous'}</span>
                                                                        <span className="comment-date">
                                                                            {formatDate(comment.date)}
                                                                        </span>
                                                                    </div>
                                                                    <p className="comment-text">{comment.text}</p>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                ) : (
                                                    <div className="comments-section">
                                                        <h5>Reviewer Comments</h5>
                                                        <p className="no-comments-placeholder">No comments yet</p>
                                                    </div>
                                                )}

                                                <div className="submission-history">
                                                    <h5>Submission History</h5>
                                                    {manuscript.history && manuscript.history.length > 0 ? (
                                                        <div className="history-timeline">
                                                            {manuscript.history.map((state, index) => (
                                                                <div key={index} className="history-item">
                                                                    <span className={`history-state state-${state}`}>
                                                                        {getStateDisplayName(state)}
                                                                    </span>
                                                                    {index < manuscript.history.length - 1 && <span className="history-arrow">→</span>}
                                                                </div>
                                                            ))}
                                                            <div className="history-item">
                                                                <span className={`history-state state-${manuscript.state}`}>
                                                                    {getStateDisplayName(manuscript.state)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="no-history-placeholder">No history available</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Author response form when responding to a manuscript */}
                                        {respondingToManuscript && respondingToManuscript._id === manuscript._id && (
                                            <div className="author-response-form">
                                                <h3>Review Referee Comments</h3>

                                                <div className="referee-comments-section">
                                                    <h4>Referee Comments</h4>
                                                    {allComments.length > 0 ? (
                                                        <ul className="comments-list">
                                                            {allComments.map((comment, index) => (
                                                                <li key={index} className="comment-item">
                                                                    <div className="comment-header">
                                                                        <span className="comment-author">{comment.author || 'Anonymous'}</span>
                                                                        <span className="comment-date">
                                                                            {formatDate(comment.date)}
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

                                                <div className="revision-instructions">
                                                    <h4>Instructions</h4>
                                                    <p>
                                                        1. Review the referee comments above
                                                    </p>
                                                    <p>
                                                        2. Update your manuscript offline based on these comments
                                                    </p>
                                                    <p>
                                                        3. When you completed your revisions, use the Mark Revision Complete button below
                                                    </p>
                                                </div>

                                                <div className="response-actions">
                                                    <button
                                                        className="cancel-response-button"
                                                        onClick={handleCancelResponse}
                                                    >
                                                        Close
                                                    </button>
                                                    <button
                                                        className="submit-response-button"
                                                        onClick={() => handleSubmitRevisionComplete(respondingToManuscript._id)}
                                                        disabled={submittingAction}
                                                    >
                                                        {submittingAction ? "Submitting..." : "Mark Revision Complete"}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="manuscript-actions">
                                            {renderAuthorActions(manuscript)}
                                            <Link to={`/manuscripts`} className="view-button">
                                                View Manuscript
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p>You have no manuscript submissions.</p>
                    )}
                </div>
            </div>

            <ul className="action-dashboard-links">
                <li>
                    <Link to="/manuscripts" className="action-dashboard-link">
                        Manuscripts
                    </Link>
                </li>
                <li>
                    <Link to="/submissions" className="action-dashboard-link">
                        New Submission
                    </Link>
                </li>
            </ul>
        </div>
    );
}

export default ActionDashboard;
