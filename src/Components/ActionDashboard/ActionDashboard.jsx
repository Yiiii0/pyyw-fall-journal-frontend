import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ActionDashboard.css';
import { getManuscripts } from '../../services/manuscriptsAPI';
import { getCommentsByManuscript } from '../../services/commentsAPI';
import { removeRefereeFromManuscript } from '../../services/refereeAPI';
import { useAuth } from '../../contexts/AuthContext';

function ActionDashboard() {
    const [manuscripts, setManuscripts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [withdrawing, setWithdrawing] = useState(false);
    const [expandedManuscripts, setExpandedManuscripts] = useState({});
    const { currentUser } = useAuth();
    const [manuscriptComments, setManuscriptComments] = useState({});

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

    const fetchManuscripts = async () => {
        try {
            setLoading(true);
            const data = await getManuscripts();
            console.log("API Response:", data); // Debug: Log the complete API response
            console.log("Current User:", currentUser); // Debug: Log the currentUser object

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

            // Filter manuscripts to only include those where the current user is assigned as referee
            if (currentUser) {
                // 用户可能有多个标识符：id, email 等
                const possibleIdentifiers = [
                    currentUser.id,
                    currentUser.email,
                    currentUser.username
                ].filter(Boolean); // 过滤掉 undefined/null 值
                
                console.log("User possible identifiers:", possibleIdentifiers); // Debug
                
                manuscriptsArray = manuscriptsArray.filter(manuscript => {
                    console.log("Manuscript referees:", manuscript.referees); // Debug
                    
                    if (!manuscript.referees || !Array.isArray(manuscript.referees)) {
                        return false;
                    }
                    
                    // 检查 manuscript 的 referees 数组中是否包含用户的任意一个标识符
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

    useEffect(() => {
        if (currentUser && (currentUser.id || currentUser.email)) {
            fetchManuscripts();
        }
    }, [currentUser]);

    const handleWithdraw = async (manuscriptId) => {
        if (!currentUser || (!currentUser.id && !currentUser.email)) {
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
            const userIdentifier = currentUser.id || currentUser.email;
            await removeRefereeFromManuscript(manuscriptId, userIdentifier);
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
            'FMT': 'Formatting',
            'PUB': 'Published'
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
                                            <button
                                                className="withdraw-button"
                                                onClick={() => handleWithdraw(manuscript._id)}
                                                disabled={withdrawing}
                                            >
                                                {withdrawing ? "Withdrawing..." : "Withdraw"}
                                            </button>
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
