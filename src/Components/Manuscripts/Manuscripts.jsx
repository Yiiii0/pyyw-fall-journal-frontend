import React, { useEffect, useState } from 'react';
import propTypes from 'prop-types';
import { useAuth } from '../../contexts/AuthContext';
import { getManuscript, getManuscriptsByTitle, updateManuscript, updateManuscriptState } from '../../services/manuscriptsAPI';
import { getCommentsByManuscript } from '../../services/commentsAPI';
import { addRefereeToManuscript as assignReferee, removeRefereeFromManuscript } from '../../services/refereeAPI';
import { getAllPeople, register } from '../../services/peopleAPI';
import './Manuscripts.css';

function ErrorMessage({ message }) {
  return (
    <div className="error-message">
      {message}
    </div>
  );
}
ErrorMessage.propTypes = {
  message: propTypes.string.isRequired,
};

function ManuscriptsObjectToArray(data) {
  if (!data) return [];
  return Object.keys(data).map((key) => data[key]);
}

function StatusBadge({ state }) {
  const stateLabels = {
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

  return (
    <span className={`status-badge status-${state}`}>
      {stateLabels[state] || state}
    </span>
  );
}

StatusBadge.propTypes = {
  state: propTypes.string.isRequired
};

function Manuscripts() {
  const { currentUser } = useAuth();
  const [error, setError] = useState('');
  const [manuscripts, setManuscripts] = useState([]);
  const [searchTitle, setSearchTitle] = useState('');
  const [editingManuscript, setEditingManuscript] = useState(null);
  const [editFormData, setEditFormData] = useState({
    _id: '',
    title: '',
    author: '',
    author_email: '',
    text: '',
    abstract: '',
    editor_email: ''
  });
  const [isSimpleView, setIsSimpleView] = useState(false);
  const [expandedManuscripts, setExpandedManuscripts] = useState(new Set());
  const [people, setPeople] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState({});
  const [newRefereeFormOpen, setNewRefereeFormOpen] = useState(false);
  const [newRefereeData, setNewRefereeData] = useState({
    name: '',
    email: '',
    password: '',
    affiliation: '',
  });
  const [selectedReferee, setSelectedReferee] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [textModalOpen, setTextModalOpen] = useState(null);
  const hasEditorRole = currentUser?.roles?.includes('ED');
  const [isDecisionLoading, setIsDecisionLoading] = useState(false);
  const [refereeDecisions, setRefereeDecisions] = useState({});
  const [manuscriptComments, setManuscriptComments] = useState({});

  // Load referee decisions from localStorage on component mount
  useEffect(() => {
    const savedDecisions = localStorage.getItem('refereeDecisions');
    if (savedDecisions) {
      try {
        const decisions = JSON.parse(savedDecisions);
        console.log("Loaded referee decisions from localStorage:", decisions);
        setRefereeDecisions(decisions);
      } catch (err) {
        console.error("Error parsing referee decisions from localStorage:", err);
      }
    }
  }, []);

  // Save referee decisions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('refereeDecisions', JSON.stringify(refereeDecisions));
  }, [refereeDecisions]);

  const formatManuscriptsWithComments = (manuscriptsArray) => {
    return manuscriptsArray.map(manuscript => {
      if (manuscript.comments) {
        if (typeof manuscript.comments === 'string') {
          manuscript.comments = [{
            text: manuscript.comments,
            author: manuscript.editor_email || 'Editor',
            date: new Date().toISOString()
          }];
        } else if (Array.isArray(manuscript.comments)) {
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
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return 'Invalid date';
    }
  };

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
      const data = await getManuscript();
      const manuscriptsArray = Array.isArray(data) ? data : ManuscriptsObjectToArray(data);
      
      // Process manuscripts
      const processedManuscripts = formatManuscriptsWithComments(manuscriptsArray);
      setManuscripts(processedManuscripts);
      
      // Fetch comments for each manuscript
      const commentsPromises = processedManuscripts.map(async (manuscript) => {
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
      setError(`There was a problem retrieving the list of manuscripts. ${err.message}`);
    }
  };

  const fetchPeople = async () => {
    if (!hasEditorRole) return;
    try {
      setIsLoading(true);
      const data = await getAllPeople();
      setPeople(data);
    } catch (err) {
      setError(`Failed to fetch people: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchTitle.trim()) {
      fetchManuscripts();
      return;
    }
    try {
      const data = await getManuscriptsByTitle(searchTitle);
      const manuscriptsArray = Array.isArray(data) ? data : ManuscriptsObjectToArray(data);
      const processedManuscripts = formatManuscriptsWithComments(manuscriptsArray);
      setManuscripts(processedManuscripts);
      setError('');
    } catch (err) {
      setError(`There was a problem retrieving the manuscript with title "${searchTitle}". ${err.message}`);
    }
  };

  const handleEditClick = (manuscript) => {
    setEditingManuscript(manuscript);
    setEditFormData({
      _id: manuscript._id,
      title: manuscript.title,
      author: manuscript.author,
      author_email: manuscript.author_email,
      text: manuscript.text || '',
      abstract: manuscript.abstract,
      editor_email: manuscript.editor_email
    });
  };

  const handleCancelEdit = () => {
    setEditingManuscript(null);
    setEditFormData({
      _id: '',
      title: '',
      author: '',
      author_email: '',
      text: '',
      abstract: '',
      editor_email: ''
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateManuscript(editFormData);
      setEditingManuscript(null);
      fetchManuscripts();
      setError('');
    } catch (err) {
      setError(`Failed to update manuscript: ${err.message}`);
    }
  };

  const toggleView = () => {
    setIsSimpleView(!isSimpleView);
    setExpandedManuscripts(new Set());
  };

  const toggleManuscriptExpansion = (manuscriptId) => {
    setExpandedManuscripts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(manuscriptId)) {
        newSet.delete(manuscriptId);
      } else {
        newSet.add(manuscriptId);
      }
      return newSet;
    });
  };

  const toggleDropdown = (manuscriptId) => {
    setDropdownOpen(prev => ({
      ...prev,
      [manuscriptId]: !prev[manuscriptId]
    }));
  };

  const handleRefereeSelect = (manuscriptId, refereeEmail) => {
    setSelectedReferee(prev => ({
      ...prev,
      [manuscriptId]: refereeEmail
    }));
  };

  const addRefereeToManuscript = async (manuscriptId) => {
    const refereeEmail = selectedReferee[manuscriptId];
    if (!refereeEmail) {
      setError('Please select a referee first.');
      return;
    }
    try {
      setIsLoading(true);
      await assignReferee(manuscriptId, refereeEmail);
      fetchManuscripts();
      setDropdownOpen(prev => ({ ...prev, [manuscriptId]: false }));
      setSelectedReferee(prev => ({ ...prev, [manuscriptId]: '' }));
    } catch (err) {
      setError(`Error assigning referee: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteRefereeFromManuscript = async (manuscriptId, refereeEmail) => {
    try {
      setIsLoading(true);
      await removeRefereeFromManuscript(manuscriptId, refereeEmail);
      fetchManuscripts();
    } catch (err) {
      setError(`Error removing referee: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewRefereeChange = (e) => {
    const { name, value } = e.target;
    setNewRefereeData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const createNewReferee = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const userData = {
        username: newRefereeData.email,
        password: newRefereeData.password,
        name: newRefereeData.name,
        affiliation: newRefereeData.affiliation || 'N/A',
        role: 'RE'  // Referee role code
      };
      await register(userData);
      setPeople(prev => [...prev, `${newRefereeData.name} (${newRefereeData.email})`]);
      setNewRefereeData({
        name: '',
        email: '',
        password: '',
        affiliation: '',
      });
      setNewRefereeFormOpen(false);
    } catch (err) {
      setError(`Error creating referee: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const truncateText = (text, wordLimit) => {
    const words = text.split(' ');
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(' ') + '...';
  };

  const toggleTextModal = (manuscriptId) => {
    setTextModalOpen(textModalOpen === manuscriptId ? null : manuscriptId);
  };

  const handleEditorDecision = async (manuscriptId, decision, refereeEmail) => {
    try {
      setIsDecisionLoading(true);
      
      // record the referee's decision
      const newDecisions = {
        ...refereeDecisions,
        [manuscriptId]: {
          ...(refereeDecisions[manuscriptId] || {}),
          [refereeEmail]: decision
        }
      };
      setRefereeDecisions(newDecisions);
      
      // get the current manuscript
      const manuscript = manuscripts.find(m => m._id === manuscriptId);
      if (!manuscript || !manuscript.referees || manuscript.referees.length === 0) {
        throw new Error("manuscript not found or no referee information");
      }
      
      // check if all referees have made decisions
      const allReviewsSubmitted = manuscript.referees.every(ref => 
        newDecisions[manuscriptId]?.[ref] !== undefined
      );
      
      // check if all referees have accepted
      const allAccepted = manuscript.referees.every(ref => 
        newDecisions[manuscriptId]?.[ref] === 'ACCEPT'
      );
      
      let action;
      if (allReviewsSubmitted && allAccepted) {
        // all referees have accepted, enter the Copy Editing stage
        action = 'ACC';
      } else if (decision === 'ACCEPT_WITH_REVISIONS') {
        // any referee requires revisions, enter the Author Revision stage
        action = 'AWR';
      } else if (decision === 'REJECT') {
        // any referee rejects, reject the manuscript
        action = 'REJ';
      } else {
        // only submitted review, no change in state
        action = 'SBR'; // Submit Review
      }
      
      // execute the state update
      await updateManuscriptState(manuscriptId, action, { referee: refereeEmail });
      
      await fetchManuscripts();
    } catch (err) {
      setError(`Failed to update manuscript status: ${err.message}`);
    } finally {
      setIsDecisionLoading(false);
    }
  };

  const hasRefereeAction = (manuscript, refereeEmail) => {
    // Check if referee has made any action (method 1: check referee_actions array)
    if (manuscript.referee_actions && manuscript.referee_actions.includes(refereeEmail)) {
      return true;
    }
    
    // Method 2: Check in the refereeDecisions object if this referee has made a decision
    if (refereeDecisions[manuscript._id] && refereeDecisions[manuscript._id][refereeEmail]) {
      return true;
    }
    
    // Method 3: If manuscript is in Author Revision state (ARV), assume the referee has acted
    if (manuscript.state === 'ARV' && manuscript.referees && manuscript.referees.includes(refereeEmail)) {
      return true;
    }
    
    return false;
  };

  const allRefereesAccepted = (manuscript) => {
    if (!manuscript.referees || manuscript.referees.length === 0) {
      return false;
    }
    
    const decisions = refereeDecisions[manuscript._id] || {};
    return manuscript.referees.every(referee => 
      decisions[referee] === 'ACCEPT'
    );
  };

  const hasRefereeDecision = (manuscriptId, refereeEmail) => {
    return (refereeDecisions[manuscriptId] && 
           refereeDecisions[manuscriptId][refereeEmail]) ||
           // Also check manuscript referee_actions if decision exists there
           (manuscripts.find(m => m._id === manuscriptId)?.referee_decisions?.[refereeEmail]);
  };

  const getRefereeDecision = (manuscriptId, refereeEmail) => {
    // First check in refereeDecisions object
    const localDecision = refereeDecisions[manuscriptId]?.[refereeEmail];
    if (localDecision) return localDecision;
    
    // If not found, check in manuscript.referee_decisions
    const manuscript = manuscripts.find(m => m._id === manuscriptId);
    return manuscript?.referee_decisions?.[refereeEmail] || null;
  };

  // check if all referees have made decisions
  const allRefereesReviewed = (manuscript) => {
    if (!manuscript.referees || manuscript.referees.length === 0) {
      return false;
    }
    
    const decisions = refereeDecisions[manuscript._id] || {};
    return manuscript.referees.every(referee => 
      decisions[referee] !== undefined
    );
  };

  // get the number of referees who have not made decisions
  const getPendingRefereeCount = (manuscript) => {
    if (!manuscript.referees) return 0;
    
    const decisions = refereeDecisions[manuscript._id] || {};
    return manuscript.referees.filter(referee => 
      decisions[referee] === undefined
    ).length;
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

  // initialize the state when the component is loaded
  useEffect(() => {
    fetchManuscripts();
    if (hasEditorRole) {
      fetchPeople();
    }
  }, [hasEditorRole]);

  // when manuscript data is updated, check if it needs to be automatically adjusted
  useEffect(() => {
    // check if each manuscript has all referees made decisions and all are ACCEPT
    manuscripts.forEach(manuscript => {
      if (manuscript.state === 'REV' && manuscript.referees && manuscript.referees.length > 0) {
        const decisions = refereeDecisions[manuscript._id] || {};
        
        // check if all referees have made decisions
        const allReviewsSubmitted = manuscript.referees.every(ref => 
          decisions[ref] !== undefined
        );
        
        // check if all referees have accepted
        const allAccepted = manuscript.referees.every(ref => 
          decisions[ref] === 'ACCEPT'
        );
        
        // if all referees have accepted, automatically update the state
        if (allReviewsSubmitted && allAccepted) {
          (async () => {
            try {
              await updateManuscriptState(manuscript._id, 'ACC');
              fetchManuscripts();
            } catch (err) {
              console.error("failed to automatically update the state:", err);
            }
          })();
        }
      }
    });
  }, [manuscripts, refereeDecisions]);

  // check if all referees have made decisions
  const checkAllDecisions = (manuscript) => {
    if (!manuscript.referees || manuscript.referees.length === 0) {
      return { complete: false, unanimous: false, decision: null };
    }
    
    const decisions = refereeDecisions[manuscript._id] || {};
    const complete = manuscript.referees.every(ref => decisions[ref] !== undefined);
    
    if (!complete) return { complete, unanimous: false, decision: null };
    
    const firstDecision = decisions[manuscript.referees[0]];
    const unanimous = manuscript.referees.every(ref => decisions[ref] === firstDecision);
    
    return { 
      complete, 
      unanimous, 
      decision: unanimous ? firstDecision : null,
      acceptCount: manuscript.referees.filter(ref => decisions[ref] === 'ACCEPT').length,
      rejectCount: manuscript.referees.filter(ref => decisions[ref] === 'REJECT').length,
      revisionCount: manuscript.referees.filter(ref => decisions[ref] === 'ACCEPT_WITH_REVISIONS').length
    };
  };

  // Add a function to check if we should show referee section as completed
  const isRefereeReviewCompleted = (manuscript) => {
    if (!manuscript.referees || manuscript.referees.length === 0) {
      return false;
    }
    
    // If manuscript state is already past the referee review state (in ARV or beyond)
    if (['ARV', 'EDR', 'CED', 'AUR', 'FMT', 'PUB'].includes(manuscript.state)) {
      return true;
    }
    
    // If all referees have submitted decisions
    const allSubmitted = manuscript.referees.every(referee => hasRefereeAction(manuscript, referee));
    return allSubmitted;
  };

  return (
    <div className="manuscripts-wrapper">
      <div className="manuscripts-header">
        <h1>View All Manuscripts</h1>
        <button
          className="view-toggle-button"
          onClick={toggleView}
          title={isSimpleView ? "Switch to Table View" : "Switch to Card View"}
        >
          {isSimpleView ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          )}
        </button>
      </div>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search by title..."
          value={searchTitle}
          onChange={(e) => setSearchTitle(e.target.value)}
          className="search-input"
        />
        <button className="search-button" onClick={handleSearch}>Search</button>
      </div>

      {error && <ErrorMessage message={error} />}

      {editingManuscript && (
        <div className="edit-form-container">
          <h2>Edit Manuscript</h2>
          <form onSubmit={handleEditSubmit} className="edit-form">
            <div className="form-group">
              <label htmlFor="title">Title:</label>
              <input
                type="text"
                id="title"
                name="title"
                value={editFormData.title}
                onChange={handleEditFormChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="author">Author:</label>
              <input
                type="text"
                id="author"
                name="author"
                value={editFormData.author}
                onChange={handleEditFormChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="author_email">Author Email:</label>
              <input
                type="email"
                id="author_email"
                name="author_email"
                value={editFormData.author_email}
                onChange={handleEditFormChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="abstract">Abstract:</label>
              <textarea
                id="abstract"
                name="abstract"
                value={editFormData.abstract}
                onChange={handleEditFormChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="text">Text:</label>
              <textarea
                id="text"
                name="text"
                value={editFormData.text}
                onChange={handleEditFormChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="editor_email">Editor Email:</label>
              <input
                type="email"
                id="editor_email"
                name="editor_email"
                value={editFormData.editor_email}
                onChange={handleEditFormChange}
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="save-button">Save Changes</button>
              <button type="button" className="cancel-button" onClick={handleCancelEdit}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {isSimpleView ? (
        <div className="manuscripts-grid">
          {manuscripts.length > 0 ? (
            manuscripts.map((manuscript) => {
              // 检查是否有评论
              const hasComments = manuscript.comments && 
                ((Array.isArray(manuscript.comments) && manuscript.comments.length > 0) || 
                 (typeof manuscript.comments === 'string' && manuscript.comments.trim() !== ''));
              
              return (
                <div key={manuscript._id} className={`manuscript-card ${hasComments ? 'has-comments' : ''}`}>
                  <div className="manuscript-simple-content">
                    <StatusBadge state={manuscript.state} />
                    <h3 className="manuscript-title">
                      {manuscript.title}
                      {hasComments && <span className="comments-indicator" title="Has revision comments">💬</span>}
                    </h3>
                    <p className="manuscript-author">
                      <span className="info-label">Author:</span> {manuscript.author}
                    </p>
                    <p className="manuscript-abstract">
                      {truncateText(manuscript.abstract, 50)}
                    </p>
                    {expandedManuscripts.has(manuscript._id) && (
                      <div className="manuscript-details">
                        <p><span className="info-label">Author Email:</span> {manuscript.author_email}</p>
                        <p><span className="info-label">Editor:</span> {manuscript.editor_email}</p>
                        <p className="manuscript-referees">
                          <span className="info-label">Referees:</span>
                          {manuscript.referees && manuscript.referees.length > 0
                            ? manuscript.referees.map((referee, index) => (
                              <span key={index} className="referee-item">
                                {referee}
                                {hasEditorRole && (
                                  <button
                                    className="delete-referee-button"
                                    onClick={() => deleteRefereeFromManuscript(manuscript._id, referee)}
                                    disabled={isLoading}
                                  >
                                    {isLoading ? '...' : 'Remove'}
                                  </button>
                                )}
                                {index < manuscript.referees.length - 1 ? ', ' : ''}
                              </span>
                            ))
                            : 'None'}
                        </p>
                        {(() => {
                          const comments = getAllComments(manuscript);
                          return comments.length > 0 ? (
                            <div className="comments-container">
                              <h5 className="comments-title">Revision Comments:</h5>
                              <ul className="comments-list">
                                {comments.map((comment, index) => (
                                  <li key={index} className="comment-item">
                                    <div className="comment-header">
                                      <span className="comment-author">{comment.author || 'Anonymous'}</span>
                                      <span className="comment-date">{formatDate(comment.date)}</span>
                                    </div>
                                    <p className="comment-text">{comment.text}</p>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null;
                        })()}
                        <div className="abstract-section">
                          <p><span className="info-label">Full Abstract:</span></p>
                          <p>{manuscript.abstract}</p>
                        </div>
                        {manuscript.text && (
                          <div className="text-button-container">
                            <button
                              className="text-button"
                              onClick={() => toggleTextModal(manuscript._id)}
                            >
                              View Text
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="manuscript-actions">
                      <button
                        className="expand-button"
                        onClick={() => toggleManuscriptExpansion(manuscript._id)}
                      >
                        {expandedManuscripts.has(manuscript._id) ? 'Show Less' : 'Show More'}
                      </button>
                      <button
                        className="edit-button"
                        onClick={() => handleEditClick(manuscript)}
                      >
                        Edit
                      </button>

                      {hasEditorRole && (
                        <div className="referee-dropdown-container">
                          <button
                            className="add-referee-button"
                            onClick={() => toggleDropdown(manuscript._id)}
                          >
                            Assign Referee
                          </button>
                          {dropdownOpen[manuscript._id] && (
                            <div className="referee-dropdown">
                              <select
                                value={selectedReferee[manuscript._id] || ''}
                                onChange={(e) => handleRefereeSelect(manuscript._id, e.target.value)}
                                className="referee-select"
                              >
                                <option value="">Select a referee</option>
                                {people.map(person => {
                                  const match = person.match(/(.*) \((.*)\)/);
                                  if (match) {
                                    const [, name, email] = match;
                                    return (
                                      <option key={email} value={email}>
                                        {name} ({email})
                                      </option>
                                    );
                                  }
                                  return null;
                                })}
                              </select>
                              <div className="dropdown-actions">
                                <button
                                  onClick={() => addRefereeToManuscript(manuscript._id)}
                                  className="confirm-referee-button"
                                  disabled={isLoading || !selectedReferee[manuscript._id]}
                                >
                                  {isLoading ? 'Assigning...' : 'Confirm'}
                                </button>
                                <button
                                  onClick={() => toggleDropdown(manuscript._id)}
                                  className="cancel-referee-button"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-manuscripts">No manuscripts found</div>
          )}
        </div>
      ) : (
        <div className="manuscripts-table-container">
          <table className="manuscripts-table">
            <colgroup>
              <col style={{width: "350px"}} />
            </colgroup>
            <thead>
              <tr>
                <th className="info-column">Basic Information</th>
                <th className="referee-column">Referee Review</th>
                <th>Author Revisions</th>
                <th>Editor Review</th>
                <th>Copy Editing</th>
                <th>Author Review</th>
                <th>Final Processing</th>
              </tr>
            </thead>
            <tbody>
              {manuscripts.length > 0 ? (
                manuscripts.map((manuscript) => (
                  <tr key={manuscript.title}>
                    <td className="info-cell">
                      <div className="manuscript-basic-info">
                        <h3 className="manuscript-title">{manuscript.title}</h3>
                        <StatusBadge state={manuscript.state} />
                        <div className="info-row">
                          <span className="info-label">Author:</span>
                          <span className="info-value">{manuscript.author}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Author Email:</span>
                          <span className="info-value">{manuscript.author_email}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Referees:</span>
                          <span className="info-value">
                            {manuscript.referees && manuscript.referees.length > 0
                              ? manuscript.referees.map((referee, index) => (
                                <span key={index} className="referee-item">
                                  {referee}
                                  {hasEditorRole && (
                                    <button
                                      className="delete-referee-button"
                                      onClick={() => deleteRefereeFromManuscript(manuscript._id, referee)}
                                      disabled={isLoading}
                                    >
                                      {isLoading ? '...' : 'Remove'}
                                    </button>
                                  )}
                                  {index < manuscript.referees.length - 1 ? ', ' : ''}
                                </span>
                              ))
                              : 'None'}
                          </span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Editor:</span>
                          <span className="info-value">{manuscript.editor_email}</span>
                        </div>
                        <div className="abstract-section">
                          <span className="info-label">Abstract:</span>
                          <p className="abstract-text">{manuscript.abstract}</p>
                        </div>
                        {manuscript.text && (
                          <div className="text-button-container">
                            <button
                              className="text-button"
                              onClick={() => toggleTextModal(manuscript._id)}
                            >
                              View Text
                            </button>
                          </div>
                        )}
                        <div className="manuscript-actions">
                          <button
                            className="edit-button"
                            onClick={() => handleEditClick(manuscript)}
                          >
                            Edit
                          </button>

                          {hasEditorRole && (
                            <div className="referee-dropdown-container">
                              <button
                                className="add-referee-button"
                                onClick={() => toggleDropdown(manuscript._id)}
                              >
                                Assign Referee
                              </button>
                              {dropdownOpen[manuscript._id] && (
                                <div className="referee-dropdown">
                                  <select
                                    value={selectedReferee[manuscript._id] || ''}
                                    onChange={(e) => handleRefereeSelect(manuscript._id, e.target.value)}
                                    className="referee-select"
                                  >
                                    <option value="">Select a referee</option>
                                    {people.map(person => {
                                      const match = person.match(/(.*) \((.*)\)/);
                                      if (match) {
                                        const [, name, email] = match;
                                        return (
                                          <option key={email} value={email}>
                                            {name} ({email})
                                          </option>
                                        );
                                      }
                                      return null;
                                    })}
                                  </select>
                                  <div className="dropdown-actions">
                                    <button
                                      onClick={() => addRefereeToManuscript(manuscript._id)}
                                      className="confirm-referee-button"
                                      disabled={isLoading || !selectedReferee[manuscript._id]}
                                    >
                                      {isLoading ? 'Assigning...' : 'Confirm'}
                                    </button>
                                    <button
                                      onClick={() => toggleDropdown(manuscript._id)}
                                      className="cancel-referee-button"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="process-cell referee-cell">
                      {manuscript.referees && manuscript.referees.length > 0 ? (
                        <div className="referee-review-container">
                          {isRefereeReviewCompleted(manuscript) ? (
                            <div className="referee-status-message success">
                              <div className="decision-message">Referee review completed</div>
                              <div className="decision-summary">
                                {(() => {
                                  const decisions = checkAllDecisions(manuscript);
                                  return (
                                    <div>
                                      <div>Accept: {decisions.acceptCount || 0} </div>
                                      <div>Revision: {decisions.revisionCount || 0} </div>
                                      <div>Reject: {decisions.rejectCount || 0} </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          ) : getPendingRefereeCount(manuscript) > 0 ? (
                            <div className="referee-status-message">
                              Waiting for {getPendingRefereeCount(manuscript)} referees actions.
                            </div>
                          ) : null}
                          
                          {allRefereesReviewed(manuscript) && (
                            <div className={`referee-status-message ${allRefereesAccepted(manuscript) ? 'success' : 'warning'}`}>
                              <div className="decision-summary">
                                <strong>Abstract:</strong>
                                {(() => {
                                  const decisions = checkAllDecisions(manuscript);
                                  return (
                                    <div>
                                      <div>Accept: {decisions.acceptCount} </div>
                                      <div>Revision: {decisions.revisionCount} </div>
                                      <div>Reject: {decisions.rejectCount} </div>
                                    </div>
                                  );
                                })()}
                              </div>
                              
                              {allRefereesAccepted(manuscript) ? (
                                <div className="decision-message">All referee accepted this manuscript!</div>
                              ) : (
                                <div className="decision-message">
                                  Some referees have not accepted, which may require author revisions or editor decisions.
                                </div>
                              )}
                            </div>
                          )}
                          
                          {hasEditorRole && (
                            <button 
                              className="reset-decisions-button"
                              onClick={() => {
                                if (window.confirm('Are you sure to reset all referee decisions? This will clear all recorded decisions.')) {
                                  const newDecisions = { ...refereeDecisions };
                                  delete newDecisions[manuscript._id];
                                  setRefereeDecisions(newDecisions);
                                }
                              }}
                            >
                              Reset all decisions
                            </button>
                          )}
                          
                          {manuscript.referees.map((referee, index) => (
                            <div key={index} className="referee-review-section">
                              <div className="referee-name-box">
                                {referee}
                                {hasRefereeDecision(manuscript._id, referee) ? (
                                  <span className={`referee-decision-badge decision-${getRefereeDecision(manuscript._id, referee).toLowerCase()}`}>
                                    {getRefereeDecision(manuscript._id, referee) === 'ACCEPT' ? '✓ Accepted' : 
                                     getRefereeDecision(manuscript._id, referee) === 'ACCEPT_WITH_REVISIONS' ? '↻ Revisions' : 
                                     '✕ Rejected'}
                                  </span>
                                ) : manuscript.state === 'ARV' ? (
                                  <span className="referee-decision-badge decision-accept_with_revisions">
                                    ↻ Requested Revisions
                                  </span>
                                ) : null}
                              </div>
                              {hasEditorRole && (
                                hasRefereeAction(manuscript, referee) ? (
                                  <div className="referee-decision-box">
                                    {!hasRefereeDecision(manuscript._id, referee) ? (
                                      <>
                                        <button
                                          className="decision-button accept-button"
                                          onClick={() => handleEditorDecision(manuscript._id, 'ACCEPT', referee)}
                                          disabled={isDecisionLoading || manuscript.state === 'ARV'}
                                        >
                                          Accept
                                        </button>
                                        <button
                                          className="decision-button revisions-button"
                                          onClick={() => handleEditorDecision(manuscript._id, 'ACCEPT_WITH_REVISIONS', referee)}
                                          disabled={isDecisionLoading || manuscript.state === 'ARV'}
                                        >
                                          Revisions
                                        </button>
                                        <button
                                          className="decision-button reject-button"
                                          onClick={() => handleEditorDecision(manuscript._id, 'REJECT', referee)}
                                          disabled={isDecisionLoading || manuscript.state === 'ARV'}
                                        >
                                          Reject
                                        </button>
                                      </>
                                    ) : (
                                      <div className="decision-made">
                                        <span className={`decision-indicator decision-${getRefereeDecision(manuscript._id, referee).toLowerCase()}`}>
                                          {getRefereeDecision(manuscript._id, referee) === 'ACCEPT' ? 'Accepted' : 
                                           getRefereeDecision(manuscript._id, referee) === 'ACCEPT_WITH_REVISIONS' ? 'Requested Revisions' : 
                                           'Rejected'}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="stage-content pending-stage">
                                    <span className="stage-indicator">Waiting for referee action</span>
                                  </div>
                                )
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="stage-content pending-stage">
                          <span className="stage-indicator">No Referees</span>
                        </div>
                      )}
                    </td>
                    <td className="process-cell">
                      {manuscript.state === 'ARV' ? (
                        <div className="stage-content active-stage">
                          <span className="stage-indicator">In Progress</span>
                          {(() => {
                            const comments = getAllComments(manuscript);
                            return comments.length > 0 ? (
                              <div className="comments-button-container">
                                <button
                                  className="view-comments-button"
                                  onClick={() => {
                                    // Add the manuscript ID to expanded manuscripts to show comments
                                    toggleManuscriptExpansion(manuscript._id);
                                  }}
                                >
                                  View Comments ({comments.length})
                                </button>
                                
                                {expandedManuscripts.has(manuscript._id) && (
                                  <div className="comments-popup">
                                    <div className="comments-popup-header">
                                      <h4>Revision Comments</h4>
                                      <button 
                                        className="close-comments-button"
                                        onClick={() => toggleManuscriptExpansion(manuscript._id)}
                                      >
                                        ×
                                      </button>
                                    </div>
                                    <div className="comments-popup-content">
                                      <ul className="comments-list">
                                        {comments.map((comment, index) => (
                                          <li key={index} className="comment-item">
                                            <div className="comment-header">
                                              <span className="comment-author">{comment.author || 'Anonymous'}</span>
                                              <span className="comment-date">{formatDate(comment.date)}</span>
                                            </div>
                                            <p className="comment-text">{comment.text}</p>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : null;
                          })()}
                        </div>
                      ) : manuscript.history && manuscript.history.includes('ARV') ? (
                        <div className="stage-content completed-stage">
                          <span className="stage-indicator">Completed</span>
                          {(() => {
                            const comments = getAllComments(manuscript);
                            return comments.length > 0 ? (
                              <div className="comments-button-container">
                                <button
                                  className="view-comments-button"
                                  onClick={() => {
                                    toggleManuscriptExpansion(manuscript._id);
                                  }}
                                >
                                  View Comments ({comments.length})
                                </button>
                                
                                {expandedManuscripts.has(manuscript._id) && (
                                  <div className="comments-popup">
                                    <div className="comments-popup-header">
                                      <h4>Revision Comments</h4>
                                      <button 
                                        className="close-comments-button"
                                        onClick={() => toggleManuscriptExpansion(manuscript._id)}
                                      >
                                        ×
                                      </button>
                                    </div>
                                    <div className="comments-popup-content">
                                      <ul className="comments-list">
                                        {comments.map((comment, index) => (
                                          <li key={index} className="comment-item">
                                            <div className="comment-header">
                                              <span className="comment-author">{comment.author || 'Anonymous'}</span>
                                              <span className="comment-date">{formatDate(comment.date)}</span>
                                            </div>
                                            <p className="comment-text">{comment.text}</p>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : null;
                          })()}
                        </div>
                      ) : (
                        <div className="stage-content pending-stage">
                          <span className="stage-indicator">Pending</span>
                        </div>
                      )}
                    </td>
                    <td className="process-cell">
                      {manuscript.state === 'EDR' ? (
                        <div className="stage-content active-stage">
                          <span className="stage-indicator">In Progress</span>
                        </div>
                      ) : manuscript.history && manuscript.history.includes('EDR') ? (
                        <div className="stage-content completed-stage">
                          <span className="stage-indicator">Completed</span>
                        </div>
                      ) : (
                        <div className="stage-content pending-stage">
                          <span className="stage-indicator">Pending</span>
                        </div>
                      )}
                    </td>
                    <td className="process-cell">
                      {manuscript.state === 'CED' ? (
                        <div className="stage-content active-stage">
                          <span className="stage-indicator">In Progress</span>
                        </div>
                      ) : manuscript.history && manuscript.history.includes('CED') ? (
                        <div className="stage-content completed-stage">
                          <span className="stage-indicator">Completed</span>
                        </div>
                      ) : (
                        <div className="stage-content pending-stage">
                          <span className="stage-indicator">Pending</span>
                        </div>
                      )}
                    </td>
                    <td className="process-cell">
                      {manuscript.state === 'AUR' ? (
                        <div className="stage-content active-stage">
                          <span className="stage-indicator">In Progress</span>
                        </div>
                      ) : manuscript.history && manuscript.history.includes('AUR') ? (
                        <div className="stage-content completed-stage">
                          <span className="stage-indicator">Completed</span>
                        </div>
                      ) : (
                        <div className="stage-content pending-stage">
                          <span className="stage-indicator">Pending</span>
                        </div>
                      )}
                    </td>
                    <td className="process-cell">
                      {(manuscript.state === 'FMT' || manuscript.state === 'PUB') ? (
                        <div className="stage-content active-stage">
                          <span className="stage-indicator">In Progress</span>
                        </div>
                      ) : manuscript.history && (manuscript.history.includes('FMT') || manuscript.history.includes('PUB')) ? (
                        <div className="stage-content completed-stage">
                          <span className="stage-indicator">Completed</span>
                        </div>
                      ) : (
                        <div className="stage-content pending-stage">
                          <span className="stage-indicator">Pending</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="no-manuscripts">No manuscripts found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {hasEditorRole && (
        <div className="add-new-referee-section">
          {!newRefereeFormOpen ? (
            <button
              className="add-new-referee-button"
              onClick={() => setNewRefereeFormOpen(true)}
            >
              Add New Referee
            </button>
          ) : (
            <div className="new-referee-form-container">
              <h3>Add New Referee</h3>
              <form onSubmit={createNewReferee} className="new-referee-form">
                <div className="form-group">
                  <label htmlFor="name">Name:</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={newRefereeData.name}
                    onChange={handleNewRefereeChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email:</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={newRefereeData.email}
                    onChange={handleNewRefereeChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password">Password:</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={newRefereeData.password}
                    onChange={handleNewRefereeChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="affiliation">Affiliation:</label>
                  <input
                    type="text"
                    id="affiliation"
                    name="affiliation"
                    value={newRefereeData.affiliation}
                    onChange={handleNewRefereeChange}
                  />
                </div>
                <div className="form-actions">
                  <button
                    type="submit"
                    className="create-referee-button"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating...' : 'Create Referee'}
                  </button>
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => setNewRefereeFormOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {textModalOpen && (
        <div className="text-modal-backdrop" onClick={() => setTextModalOpen(null)}>
          <div className="text-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="text-modal-header">
              <h3>Full Text</h3>
              <button
                className="close-modal-button"
                onClick={() => setTextModalOpen(null)}
              >
                &times;
              </button>
            </div>
            <div className="text-modal-body">
              {manuscripts.find(m => m._id === textModalOpen)?.text || 'No text available.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Manuscripts;
