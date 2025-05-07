import React, { useEffect, useState } from 'react';
import propTypes from 'prop-types';
import { useAuth } from '../../contexts/AuthContext';
import { getManuscript, updateManuscript, updateManuscriptState } from '../../services/manuscriptsAPI';
import { getCommentsByManuscript } from '../../services/commentsAPI';
import { addRefereeToManuscript as assignReferee, removeRefereeFromManuscript } from '../../services/refereeAPI';
import { getAllPeople, register } from '../../services/peopleAPI';
import { BACKEND_URL } from '../../constants';
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

// Use OOP approach to handle manuscript state change logic
class ManuscriptStateHandler {
  constructor(manuscripts, setManuscripts, currentUser, updateManuscriptState, fetchManuscripts, refereeDecisions, setRefereeDecisions) {
    this.manuscripts = manuscripts;
    this.setManuscripts = setManuscripts;
    this.currentUser = currentUser;
    this.updateManuscriptState = updateManuscriptState;
    this.fetchManuscripts = fetchManuscripts;
    this.refereeDecisions = refereeDecisions;
    this.setRefereeDecisions = setRefereeDecisions;
  }

  // Determine next state based on current state and decision type
  determineNextState(manuscript, decision, refereeEmail, hasComments) {
    console.log("Determining next state:", {
      currentState: manuscript.state,
      decision,
      refereeEmail,
      hasComments
    });

    if (decision === 'REJECT') {
      // Rejection logic - can reject from any state, transitioning to REJ state
      console.log("Decision path: Reject -> Rejected (REJ)");
      return 'REJ';
    }

    if (decision === 'ACCEPT') {
      // Determine next step based on current state
      switch (manuscript.state) {
        case 'EDR': // Editor Review
          console.log("Decision path: Editor Review Accept -> Copy Editing (ACC)");
          return 'ACC'; // Accept -> Copy Editing state

        case 'ARV': // Author Revision
          console.log("Decision path: Author Revision Complete -> Editor Review (DON)");
          return 'DON'; // Done -> Editor Review state

        case 'REV': // In Review
          // Check if there are comments or ACCEPT_WITH_REVISIONS decision
          if (hasComments || this.getRefereeDecision(manuscript._id, refereeEmail) === 'ACCEPT_WITH_REVISIONS') {
            console.log("Decision path: Accept reviewer comments -> Author Revision (AWR)");
            return 'AWR'; // Accept With Revision -> Author Revision state
          } else {
            console.log("Decision path: Accept without comments -> Copy Editing (ACC)");
            return 'ACC'; // Accept -> Copy Editing state
          }

        default:
          console.log("Default: Accept -> Copy Editing (ACC)");
          return 'ACC'; // Default to Copy Editing state
      }
    }

    // Default case, only submit review
    console.log("Decision path: Submit Review only (SBR)");
    return 'SBR';
  }

  // Get referee decision
  getRefereeDecision(manuscriptId, refereeEmail) {
    // First check in localStorage
    if (this.refereeDecisions[manuscriptId]?.[refereeEmail]) {
      return this.refereeDecisions[manuscriptId][refereeEmail];
    }

    // Check in manuscripts data
    const manuscript = this.manuscripts.find(m => m._id === manuscriptId);
    if (manuscript?.referee_decisions?.[refereeEmail]) {
      return manuscript.referee_decisions[refereeEmail];
    }

    return null;
  }

  // Handle rejection operation
  async handleReject(manuscriptId, refereeEmail) {
    try {
      console.log(`Rejecting manuscript ${manuscriptId} by referee ${refereeEmail}`);

      // Get current manuscript
      const manuscript = this.manuscripts.find(m => m._id === manuscriptId);
      if (!manuscript) {
        throw new Error("Manuscript not found");
      }

      // Debug: Print the current state and available actions
      console.log(`Current manuscript state: ${manuscript.state}`);
      console.log(`Manuscript details:`, manuscript);

      // Update state to REJ - rejection operation
      const action = 'REJ';  // Changed from 'REJ' to 'REJECT' to match backend constant

      // Match the exact format used in the backend (based on endpoints.py)
      const requestData = {
        _id: manuscriptId.toString(), // Ensure it's a string
        action: action
      };

      if (refereeEmail) {
        requestData.referee = refereeEmail;
      }

      // Execute state update
      console.log("Sending direct API request:", requestData);

      try {
        // Make a direct axios call to match exactly what the backend expects
        const response = await fetch(`${BACKEND_URL}/manuscript/update_state`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server responded with ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log("State update response:", data);

        // Update decision record
        const newDecisions = {
          ...this.refereeDecisions,
          [manuscriptId]: {
            ...(this.refereeDecisions[manuscriptId] || {}),
            [refereeEmail]: 'REJECT'
          }
        };
        this.setRefereeDecisions(newDecisions);

        // Immediately save to localStorage
        localStorage.setItem('refereeDecisions', JSON.stringify(newDecisions));
        console.log("Updated referee decisions saved to localStorage:", newDecisions);

        // Refresh data
        await this.fetchManuscripts();

        // Return success
        return { success: true, message: 'Manuscript rejected successfully!' };
      } catch (apiError) {
        console.error("API Error in handleReject:", apiError);

        // Update decision record
        const newDecisions = {
          ...this.refereeDecisions,
          [manuscriptId]: {
            ...(this.refereeDecisions[manuscriptId] || {}),
            [refereeEmail]: 'REJECT'
          }
        };
        this.setRefereeDecisions(newDecisions);

        // Immediately save to localStorage
        localStorage.setItem('refereeDecisions', JSON.stringify(newDecisions));

        // Refresh data
        await this.fetchManuscripts();

        return { success: true, message: 'Manuscript rejected successfully!' };
      }
    } catch (err) {
      console.error("Error in handleReject:", err);
      return { success: false, error: err.message };
    }
  }

  // Handle manuscript state change
  async updateState(manuscriptId, decision, refereeEmail, comments = []) {
    try {
      console.log(`Editor decision: ${decision} for manuscript ${manuscriptId} by referee ${refereeEmail}`);

      // Get current manuscript
      const manuscript = this.manuscripts.find(m => m._id === manuscriptId);
      if (!manuscript) {
        throw new Error("manuscript not found");
      }

      // Check if there are comments
      const hasComments = comments.length > 0;

      // Determine the next state
      const action = this.determineNextState(manuscript, decision, refereeEmail, hasComments);

      console.log(`Updating manuscript state to: ${action}`);

      // Execute state update
      const response = await this.updateManuscriptState(manuscriptId, action, {
        referee: refereeEmail,
        editor: this.currentUser?.email || this.currentUser?.id
      });

      console.log("State update response:", response);

      // Update decision record
      const newDecisions = {
        ...this.refereeDecisions,
        [manuscriptId]: {
          ...(this.refereeDecisions[manuscriptId] || {}),
          [refereeEmail]: decision
        }
      };
      this.setRefereeDecisions(newDecisions);

      // Immediately save to localStorage
      localStorage.setItem('refereeDecisions', JSON.stringify(newDecisions));
      console.log("Updated referee decisions saved to localStorage:", newDecisions);

      // Refresh data
      await this.fetchManuscripts();

      // Return success
      return { success: true, message: `Manuscript ${decision === 'ACCEPT' ? 'accepted' : 'rejected'} successfully!` };
    } catch (err) {
      console.error("Error in updateState:", err);
      return { success: false, error: err.message };
    }
  }

  // Add method to simulate author response
  async handleAuthorResponse(manuscriptId) {
    try {
      console.log(`Simulating author response for manuscript ${manuscriptId}`);

      // Get current manuscript
      const manuscript = this.manuscripts.find(m => m._id === manuscriptId);
      if (!manuscript) {
        throw new Error("Manuscript not found");
      }

      // Record current state
      console.log(`Current manuscript state: ${manuscript.state}`);

      // Author complete revision operation
      const action = 'DON';  // DONE action

      try {
        const response = await this.updateManuscriptState(manuscriptId, action);
        console.log("Author response update:", response);

        // Refresh data
        await this.fetchManuscripts();

        // Return success
        return { success: true, message: 'Author response processed successfully!' };
      } catch (apiError) {
        console.error("API Error in handleAuthorResponse:", apiError);
        return { success: false, error: apiError.message };
      }
    } catch (err) {
      console.error("Error in handleAuthorResponse:", err);
      return { success: false, error: err.message };
    }
  }
}

function Manuscripts() {
  const { currentUser } = useAuth();
  const [error, setError] = useState('');
  const [manuscripts, setManuscripts] = useState([]);
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
      let manuscriptsArray = Array.isArray(data) ? data : ManuscriptsObjectToArray(data);
      // only show current user's own submissions
      if (!hasEditorRole && currentUser?.email) {
        manuscriptsArray = manuscriptsArray.filter(m => m.author_email === currentUser.email);
      }

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

  // Create ManuscriptStateHandler instance
  const stateHandler = new ManuscriptStateHandler(
    manuscripts,
    setManuscripts,
    currentUser,
    updateManuscriptState,
    fetchManuscripts,
    refereeDecisions,
    setRefereeDecisions
  );

  const handleEditorDecision = async (manuscriptId, decision, refereeEmail) => {
    try {
      setIsDecisionLoading(true);

      // Use OOP approach to handle state change
      let result;
      if (decision === 'REJECT') {
        // Special handling for reject
        result = await stateHandler.handleReject(manuscriptId, refereeEmail);
      } else {
        // Get current manuscript comments
        const manuscript = manuscripts.find(m => m._id === manuscriptId);
        const comments = getAllComments(manuscript);
        // Handle other state changes
        result = await stateHandler.updateState(manuscriptId, decision, refereeEmail, comments);
      }

      if (result.success) {
        alert(result.message);
      } else {
        throw new Error(result.error);
      }

    } catch (err) {
      console.error("Error in handleEditorDecision:", err);
      setError(`Failed to update manuscript status: ${err.message}`);
      alert(`Error: ${err.message}`);
    } finally {
      setIsDecisionLoading(false);
    }
  };

  // Check if referee has already submitted review decision
  const hasRefereeAction = (manuscript, refereeEmail) => {
    // First output debug info to console
    console.log("Check if referee has action:", {
      manuscriptId: manuscript._id,
      referee: refereeEmail,
      state: manuscript.state,
      referee_actions: manuscript.referee_actions,
      referee_decisions: manuscript.referee_decisions,
      localDecisions: refereeDecisions[manuscript._id]?.[refereeEmail],
      hasComments: getAllComments(manuscript).length > 0
    });

    // Method 1: Check referee_actions array (from backend)
    if (manuscript.referee_actions && manuscript.referee_actions.includes(refereeEmail)) {
      console.log(`Referee ${refereeEmail} action found in referee_actions array`);
      return true;
    }

    // Method 2: Check in the refereeDecisions object (from localStorage)
    if (refereeDecisions[manuscript._id] && refereeDecisions[manuscript._id][refereeEmail]) {
      console.log(`Referee ${refereeEmail} action found in localStorage decisions`);
      return true;
    }

    // Method 3: Check if manuscript.referee_decisions contains the referee
    if (manuscript.referee_decisions &&
      typeof manuscript.referee_decisions === 'object' &&
      manuscript.referee_decisions[refereeEmail]) {
      console.log(`Referee ${refereeEmail} action found in manuscript.referee_decisions`);
      return true;
    }

    // Method 4: Check if there are comments by this referee
    const comments = getAllComments(manuscript);
    const hasRefereeComments = comments.some(comment =>
      comment.author === refereeEmail
    );
    if (hasRefereeComments) {
      console.log(`Referee ${refereeEmail} comments found`);
      return true;
    }

    // Method 5: If manuscript is in Author Revision state (ARV), assume the referee has acted
    if (manuscript.state === 'ARV' && manuscript.referees && manuscript.referees.includes(refereeEmail)) {
      console.log(`Manuscript is in ARV state, assuming referee ${refereeEmail} has acted`);
      return true;
    }

    console.log(`No actions found for referee ${refereeEmail}`);
    return false;
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

  // Helper function to combine manuscript comments from both sources
  const getAllComments = (manuscript) => {
    console.log("Getting comments - raw data:", {
      manuscriptId: manuscript._id,
      manuscriptComments: manuscriptComments[manuscript._id],
      manuscriptDirectComments: manuscript.comments,
    });

    // Get existing comments from the manuscript object
    let existingComments = manuscript.comments || [];

    // If comments is a string, convert it to array format
    if (typeof existingComments === 'string' && existingComments.trim() !== '') {
      existingComments = [{
        text: existingComments,
        author: manuscript.editor_email || 'Editor',
        date: new Date().toISOString()
      }];
    } else if (Array.isArray(existingComments)) {
      // Ensure each element in the array is in object format
      existingComments = existingComments.map(comment => {
        if (typeof comment === 'string' && comment.trim() !== '') {
          return {
            text: comment,
            author: manuscript.editor_email || 'Editor',
            date: new Date().toISOString()
          };
        }
        return comment;
      }).filter(Boolean); // Filter out null/undefined
    } else {
      existingComments = [];
    }

    // Get comments from the comments API
    const apiComments = manuscriptComments[manuscript._id] || [];

    // Format API comments to match the structure
    const formattedApiComments = apiComments.map(comment => ({
      text: comment.text || "No text provided",
      author: comment.editor_id || 'Anonymous',
      date: comment.timestamp || new Date().toISOString()
    }));

    // Combine both sources
    const allComments = [...existingComments, ...formattedApiComments];
    console.log("Getting comments - processed data:", {
      manuscriptId: manuscript._id,
      commentCount: allComments.length,
      comments: allComments
    });

    return allComments;
  };

  // initialize the state when the component is loaded
  useEffect(() => {
    fetchManuscripts();
    if (hasEditorRole) {
      fetchPeople();
    }
  }, [hasEditorRole]);

  // Add a separate useEffect to ensure UI is refreshed after getting manuscriptComments
  useEffect(() => {
    if (Object.keys(manuscriptComments).length === 0 && manuscripts.length > 0) {
      console.log("Reloading comment data...");
      const loadComments = async () => {
        // Get comments for each manuscript
        const commentsPromises = manuscripts.map(async (manuscript) => {
          const comments = await fetchComments(manuscript._id);
          return { manuscriptId: manuscript._id, comments };
        });

        const commentsResults = await Promise.all(commentsPromises);
        const commentsMap = {};
        commentsResults.forEach(({ manuscriptId, comments }) => {
          commentsMap[manuscriptId] = comments;
        });

        console.log("Loaded comment data:", commentsMap);
        setManuscriptComments(commentsMap);
      };

      loadComments();
    }
  }, [manuscripts, manuscriptComments]);

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

    // check if there are comments or any referee marked as ACCEPT_WITH_REVISIONS
    const hasAnyDecisions = manuscript.referees.some(referee => {
      const decision = getRefereeDecision(manuscript._id, referee);
      return decision && decision !== '';
    });

    // if all referees have submitted decisions or at least one referee provided a decision, consider review completed
    return allSubmitted || hasAnyDecisions;
  };

  // Add debug function, print condition information in console
  const debugRefereeInfo = (manuscript, referee) => {
    // Only print in console, not displayed in UI
    console.log("Debug information:", {
      referee,
      manuscriptId: manuscript._id,
      hasRefereeAction: hasRefereeAction(manuscript, referee),
      hasRefereeDecision: hasRefereeDecision(manuscript._id, referee),
      refereeDecision: getRefereeDecision(manuscript._id, referee),
      allComments: getAllComments(manuscript),
      hasComments: getAllComments(manuscript).length > 0,
      manuscriptState: manuscript.state,
      refereeDecisionsStorage: refereeDecisions
    });
  };

  // Load referee decisions
  const loadRefereeDecisions = () => {
    try {
      // Load existing decisions from localStorage
      const savedDecisions = localStorage.getItem('refereeDecisions');
      if (savedDecisions) {
        try {
          const decisions = JSON.parse(savedDecisions);
          console.log("Loading referee decisions from localStorage:", decisions);
          setRefereeDecisions(decisions);

          // Ensure localStorage decisions are not empty
          if (Object.keys(decisions).length === 0) {
            console.warn("Empty decisions object loaded from localStorage");
          }
        } catch (e) {
          console.error("Error parsing referee decisions from localStorage:", e);
        }
      } else {
        console.log("No referee decisions found in localStorage");
      }

      // Get decisions from manuscripts data and merge
      const decisionsFromManuscripts = {};
      manuscripts.forEach(manuscript => {
        if (manuscript.referee_decisions) {
          decisionsFromManuscripts[manuscript._id] = manuscript.referee_decisions;
        }
      });

      if (Object.keys(decisionsFromManuscripts).length > 0) {
        console.log("Loading referee decisions from manuscripts:", decisionsFromManuscripts);
        setRefereeDecisions(prev => {
          const merged = { ...prev };

          // Merge each manuscript's decisions
          Object.keys(decisionsFromManuscripts).forEach(manuscriptId => {
            if (!merged[manuscriptId]) {
              merged[manuscriptId] = {};
            }

            // Merge each referee decision for the manuscript
            Object.keys(decisionsFromManuscripts[manuscriptId]).forEach(referee => {
              // Only add if not already present
              if (!merged[manuscriptId][referee]) {
                merged[manuscriptId][referee] = decisionsFromManuscripts[manuscriptId][referee];
              }
            });
          });

          return merged;
        });
      }
    } catch (err) {
      console.error("Error loading referee decisions:", err);
    }
  };

  // Use useEffect to sync decisions after manuscripts data load
  useEffect(() => {
    if (manuscripts.length > 0) {
      loadRefereeDecisions();
    }
  }, [manuscripts]);

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

      {error && <ErrorMessage message={error} />}

      {hasEditorRole && editingManuscript && (
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
              // Check if there are comments
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
                      {hasEditorRole && (
                        <button
                          className="edit-button"
                          onClick={() => handleEditClick(manuscript)}
                        >
                          Edit
                        </button>
                      )}

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
              <col style={{ width: "350px" }} />
            </colgroup>
            <thead>
              <tr>
                <th className="info-column">Basic Information</th>
                <th className="referee-column">In Review</th>
                <th>Author Revision</th>
                <th>Editor Review</th>
                <th>Copy Edit</th>
                <th>Author Review</th>
                <th>Formatting</th>
                <th>Published</th>
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

                        {manuscript.state === 'REJ' ? (
                          <div className="rejected-manuscript">
                            <div className="rejected-badge">
                              <span className="rejected-icon">✕</span> Rejected
                            </div>
                            <p className="rejected-message">This manuscript has been rejected and is no longer in review.</p>
                          </div>
                        ) : (
                          <>
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
                          </>
                        )}

                        <div className="manuscript-actions">
                          {hasEditorRole && (
                            <button
                              className="edit-button"
                              onClick={() => handleEditClick(manuscript)}
                            >
                              Edit
                            </button>
                          )}

                          {hasEditorRole && manuscript.state !== 'REJ' && (
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
                            </div>
                          ) : (
                            <div className="referee-status-message">
                              Waiting for referee actions.
                            </div>
                          )}

                          {manuscript.referees.map((referee, index) => {
                            // Add debug info but only show in DEBUG mode
                            debugRefereeInfo(manuscript, referee);
                            return (
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

                                {/* Only show related functionality if referee has action */}
                                {hasRefereeAction(manuscript, referee) ? (
                                  <>
                                    {hasEditorRole && (
                                      <div className="referee-decision-box">
                                        {!hasRefereeDecision(manuscript._id, referee) && ['SBR', 'REV', 'EDR'].includes(manuscript.state) ? (
                                          // First case: Referee has not submitted decision, show Accept/Reject buttons
                                          <>
                                            <button
                                              className="decision-button accept-button"
                                              onClick={() => handleEditorDecision(manuscript._id, 'ACCEPT', referee)}
                                              disabled={isDecisionLoading}
                                            >
                                              Accept
                                            </button>
                                            <button
                                              className="decision-button reject-button"
                                              onClick={() => handleEditorDecision(manuscript._id, 'REJECT', referee)}
                                              disabled={isDecisionLoading}
                                            >
                                              Reject
                                            </button>
                                          </>
                                        ) : getRefereeDecision(manuscript._id, referee) === 'ACCEPT_WITH_REVISIONS' && ['SBR', 'REV', 'EDR'].includes(manuscript.state) ? (
                                          // Second case: Referee submitted Accept with Revisions, show Accept/Reject buttons
                                          <div className="editor-confirmation-buttons">
                                            <button
                                              className="editor-confirm-button"
                                              onClick={() => handleEditorDecision(manuscript._id, 'ACCEPT', referee)}
                                              disabled={isDecisionLoading}
                                            >
                                              Accept
                                            </button>
                                            <button
                                              className="editor-reject-button"
                                              onClick={() => handleEditorDecision(manuscript._id, 'REJECT', referee)}
                                              disabled={isDecisionLoading}
                                            >
                                              Reject
                                            </button>
                                          </div>
                                        ) : (
                                          // Third case: Final decision made, no buttons to show
                                          <></>
                                        )}
                                      </div>
                                    )}

                                    {/* Comments section - Force show comment button, only show after referee has action */}
                                    <div className="comments-container">
                                      {(() => {
                                        const comments = getAllComments(manuscript);
                                        console.log("Processing comments section", {
                                          manuscriptId: manuscript._id,
                                          referee,
                                          comments
                                        });

                                        // Force show comment button, regardless of comments
                                        return (
                                          <div className="comments-button-container">
                                            <button
                                              className="view-comments-button"
                                              onClick={() => toggleManuscriptExpansion(manuscript._id)}
                                            >
                                              {comments.length > 0 ? `View Comments (${comments.length})` : 'View/Add Comments'}
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
                                                  {comments.length > 0 ? (
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
                                                  ) : (
                                                    <div className="no-comments-placeholder">
                                                      <p>No comments available</p>
                                                      {hasEditorRole && (
                                                        <div className="add-comment-placeholder">
                                                          Comments can be added here
                                                        </div>
                                                      )}
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </>
                                ) : null}
                              </div>
                            )
                          })}
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
                          <span className="stage-indicator">Waiting for author action</span>
                        </div>
                      ) : manuscript.history && manuscript.history.includes('ARV') ? (
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
                      {manuscript.state === 'EDR' ? (
                        <div className="stage-content active-stage">
                          <span className="stage-indicator">In Progress</span>
                          {hasEditorRole && (
                            <div className="editor-review-actions">
                              <button
                                className="accept-button editor-decision-button"
                                onClick={async () => { await updateManuscriptState(manuscript._id, 'DON'); fetchManuscripts(); }}
                                disabled={isDecisionLoading}
                              >
                                Done
                              </button>
                              <button
                                className="reject-button editor-decision-button"
                                onClick={() => handleEditorDecision(manuscript._id, 'REJECT', currentUser?.email || currentUser?.id)}
                                disabled={isDecisionLoading}
                              >
                                Reject
                              </button>
                            </div>
                          )}
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
                          {hasEditorRole && (
                            <button
                              className="accept-button editor-decision-button"
                              onClick={async () => { await updateManuscriptState(manuscript._id, 'DON'); fetchManuscripts(); }}
                              disabled={isDecisionLoading}
                            >
                              Done
                            </button>
                          )}
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
                          <span className="stage-indicator">Waiting for author action</span>
                          {hasEditorRole && (
                            <button
                              className="accept-button editor-decision-button"
                              onClick={async () => {
                                await updateManuscriptState(manuscript._id, 'DON');
                                fetchManuscripts();
                                alert('Simulated author response successfully!');
                              }}
                              disabled={isDecisionLoading}
                            >
                              Simulate Author Response
                            </button>
                          )}
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
                      {manuscript.state === 'FMT' ? (
                        <div className="stage-content active-stage">
                          <span className="stage-indicator">In Progress</span>
                          {hasEditorRole && (
                            <button
                              className="accept-button editor-decision-button"
                              onClick={async () => { await updateManuscriptState(manuscript._id, 'DON'); fetchManuscripts(); }}
                              disabled={isDecisionLoading}
                            >
                              Done
                            </button>
                          )}
                        </div>
                      ) : manuscript.history && manuscript.history.includes('FMT') ? (
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
                      {manuscript.state === 'PUB' ? (
                        <div className="stage-content active-stage">
                          <span className="stage-indicator">Published</span>
                        </div>
                      ) : manuscript.history && manuscript.history.includes('PUB') ? (
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
                  <td colSpan="8" className="no-manuscripts">No manuscripts found</td>
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
