import React, { useEffect, useState } from 'react';
import propTypes from 'prop-types';
import { 
  getManuscript, 
  getManuscriptsByTitle, 
  createManuscript, 
  updateManuscript, 
  deleteManuscriptByTitle,
  updateManuscriptState
} from '../../services/manuscriptsAPI';
import './Submissions.css';

// Error message component
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

// Component for creating a new manuscript
function AddManuscriptForm({
  visible,
  cancel,
  fetchManuscripts,
  setError,
  currentUser,
}) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [text, setText] = useState('');
  const [abstract, setAbstract] = useState('');
  const [editorEmail, setEditorEmail] = useState('');

  useEffect(() => {
    // If user is logged in, pre-fill the editor email
    if (currentUser && currentUser.email) {
      setEditorEmail(currentUser.email);
    }
  }, [currentUser]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const manuscriptData = {
      title,
      author,
      author_email: authorEmail,
      text,
      abstract,
      editor_email: editorEmail,
    };

    try {
      await createManuscript(manuscriptData);
      fetchManuscripts();
      cancel(); // Hide form after successful creation
      
      // Reset form fields
      setTitle('');
      setAuthor('');
      setAuthorEmail('');
      setText('');
      setAbstract('');
    } catch (error) {
      setError(error.message);
    }
  };

  if (!visible) return null;

  return (
    <form className="submission-form" onSubmit={handleSubmit}>
      <h2>Submit New Manuscript</h2>
      
      <label htmlFor="title">Title</label>
      <input
        required
        type="text"
        id="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <label htmlFor="author">Author</label>
      <input
        required
        type="text"
        id="author"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
      />

      <label htmlFor="authorEmail">Author Email</label>
      <input
        required
        type="email"
        id="authorEmail"
        value={authorEmail}
        onChange={(e) => setAuthorEmail(e.target.value)}
      />

      <label htmlFor="abstract">Abstract</label>
      <textarea
        required
        id="abstract"
        value={abstract}
        onChange={(e) => setAbstract(e.target.value)}
      />

      <label htmlFor="text">Main Text</label>
      <textarea
        required
        id="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <label htmlFor="editorEmail">Editor Email</label>
      <input
        required
        type="email"
        id="editorEmail"
        value={editorEmail}
        onChange={(e) => setEditorEmail(e.target.value)}
      />

      <div className="button-group">
        <button type="button" onClick={cancel}>Cancel</button>
        <button type="submit">Submit Manuscript</button>
      </div>
    </form>
  );
}

AddManuscriptForm.propTypes = {
  visible: propTypes.bool.isRequired,
  cancel: propTypes.func.isRequired,
  fetchManuscripts: propTypes.func.isRequired,
  setError: propTypes.func.isRequired,
  currentUser: propTypes.shape({
    email: propTypes.string,
    name: propTypes.string,
  }),
};

// Component for editing an existing manuscript
function EditManuscriptForm({
  manuscript,
  visible,
  cancel,
  fetchManuscripts,
  setError,
}) {
  const [title, setTitle] = useState(manuscript.title);
  const [author, setAuthor] = useState(manuscript.author);
  const [authorEmail, setAuthorEmail] = useState(manuscript.author_email);
  const [text, setText] = useState(manuscript.text);
  const [abstract, setAbstract] = useState(manuscript.abstract);
  const [editorEmail, setEditorEmail] = useState(manuscript.editor_email);

  useEffect(() => {
    // Update form when manuscript changes
    setTitle(manuscript.title);
    setAuthor(manuscript.author);
    setAuthorEmail(manuscript.author_email);
    setText(manuscript.text);
    setAbstract(manuscript.abstract);
    setEditorEmail(manuscript.editor_email);
  }, [manuscript]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const manuscriptData = {
      title,
      author,
      author_email: authorEmail,
      text,
      abstract,
      editor_email: editorEmail,
    };

    try {
      await updateManuscript(manuscriptData);
      fetchManuscripts();
      cancel(); // Hide form after successful update
    } catch (error) {
      setError(error.message);
    }
  };

  if (!visible) return null;

  return (
    <form className="submission-form" onSubmit={handleSubmit}>
      <h2>Edit Manuscript</h2>
      
      <label htmlFor="edit-title">Title</label>
      <input
        required
        type="text"
        id="edit-title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled // Title cannot be changed as it's the primary key
      />

      <label htmlFor="edit-author">Author</label>
      <input
        required
        type="text"
        id="edit-author"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
      />

      <label htmlFor="edit-authorEmail">Author Email</label>
      <input
        required
        type="email"
        id="edit-authorEmail"
        value={authorEmail}
        onChange={(e) => setAuthorEmail(e.target.value)}
      />

      <label htmlFor="edit-abstract">Abstract</label>
      <textarea
        required
        id="edit-abstract"
        value={abstract}
        onChange={(e) => setAbstract(e.target.value)}
      />

      <label htmlFor="edit-text">Main Text</label>
      <textarea
        required
        id="edit-text"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <label htmlFor="edit-editorEmail">Editor Email</label>
      <input
        required
        type="email"
        id="edit-editorEmail"
        value={editorEmail}
        onChange={(e) => setEditorEmail(e.target.value)}
      />

      <div className="button-group">
        <button type="button" onClick={cancel}>Cancel</button>
        <button type="submit">Save Changes</button>
      </div>
    </form>
  );
}

EditManuscriptForm.propTypes = {
  manuscript: propTypes.shape({
    title: propTypes.string.isRequired,
    author: propTypes.string.isRequired,
    author_email: propTypes.string.isRequired,
    text: propTypes.string.isRequired,
    abstract: propTypes.string.isRequired,
    editor_email: propTypes.string.isRequired,
    state: propTypes.string.isRequired,
    referees: propTypes.arrayOf(propTypes.string),
    history: propTypes.arrayOf(propTypes.string),
  }).isRequired,
  visible: propTypes.bool.isRequired,
  cancel: propTypes.func.isRequired,
  fetchManuscripts: propTypes.func.isRequired,
  setError: propTypes.func.isRequired,
};

// Component for displaying a single manuscript
function Manuscript({ manuscript, fetchManuscripts, setError }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdatingState, setIsUpdatingState] = useState(false);
  const [selectedAction, setSelectedAction] = useState('');
  const [refereeEmail, setRefereeEmail] = useState('');

  // State labels for display
  const STATE_LABELS = {
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

  // Valid actions based on current state
  const getValidActions = (state) => {
    switch (state) {
      case 'SUB':
        return [
          { code: 'ARF', label: 'Assign Referee' },
          { code: 'REJ', label: 'Reject' },
          { code: 'WIT', label: 'Withdraw' }
        ];
      case 'REV':
        return [
          { code: 'ARF', label: 'Assign Referee' },
          { code: 'DRF', label: 'Delete Referee' },
          { code: 'ACC', label: 'Accept' },
          { code: 'REJ', label: 'Reject' },
          { code: 'AWR', label: 'Accept with Revisions' },
          { code: 'SBR', label: 'Submit Review' },
          { code: 'WIT', label: 'Withdraw' }
        ];
      case 'CED':
        return [
          { code: 'DON', label: 'Done' },
          { code: 'WIT', label: 'Withdraw' }
        ];
      case 'AUR':
        return [
          { code: 'DON', label: 'Done' },
          { code: 'WIT', label: 'Withdraw' }
        ];
      case 'ARV':
        return [
          { code: 'DON', label: 'Done' },
          { code: 'WIT', label: 'Withdraw' }
        ];
      case 'EDR':
        return [
          { code: 'ACC', label: 'Accept' },
          { code: 'WIT', label: 'Withdraw' }
        ];
      case 'FMT':
        return [
          { code: 'DON', label: 'Done' },
          { code: 'WIT', label: 'Withdraw' }
        ];
      case 'PUB':
        return [
          { code: 'WIT', label: 'Withdraw' }
        ];
      case 'REJ':
        return [
          { code: 'WIT', label: 'Withdraw' }
        ];
      case 'WIT':
        return [];
      default:
        return [];
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${manuscript.title}"?`)) {
      try {
        await deleteManuscriptByTitle(manuscript.title);
        fetchManuscripts();
      } catch (error) {
        setError(error.message);
      }
    }
  };

  const handleStateUpdate = async (e) => {
    e.preventDefault();
    
    try {
      const action = selectedAction;
      let extraParams = {};
      
      // For referee actions, include the referee email
      if (action === 'ARF' || action === 'DRF') {
        if (!refereeEmail.trim()) {
          setError('Referee email is required for this action');
          return;
        }
        extraParams = { ref: refereeEmail };
      }
      
      await updateManuscriptState(manuscript.title, action, extraParams);
      fetchManuscripts();
      setIsUpdatingState(false);
      setSelectedAction('');
      setRefereeEmail('');
    } catch (error) {
      setError(error.message);
    }
  };

  const showEditForm = () => setIsEditing(true);
  const hideEditForm = () => setIsEditing(false);
  const showStateUpdateForm = () => setIsUpdatingState(true);
  const hideStateUpdateForm = () => {
    setIsUpdatingState(false);
    setSelectedAction('');
    setRefereeEmail('');
  };

  const validActions = getValidActions(manuscript.state);

  return (
    <div className="manuscript-item">
      <div className={`state-tag state-${manuscript.state}`}>
        {STATE_LABELS[manuscript.state] || manuscript.state}
      </div>
      
      <h3 className="manuscript-title">{manuscript.title}</h3>
      
      <div className="manuscript-info">
        <p><span className="label">Author:</span> {manuscript.author}</p>
        <p><span className="label">Author Email:</span> {manuscript.author_email}</p>
        <p><span className="label">Editor:</span> {manuscript.editor_email}</p>
        
        {manuscript.referees && manuscript.referees.length > 0 && (
          <p>
            <span className="label">Referees:</span> 
            {manuscript.referees.join(', ')}
          </p>
        )}
        
        <div className="abstract-text">
          <p><span className="label">Abstract:</span></p>
          <p>{manuscript.abstract}</p>
        </div>
        
        <div className="main-text">
          <p><span className="label">Text:</span></p>
          <p>{manuscript.text}</p>
        </div>
        
        {manuscript.history && manuscript.history.length > 0 && (
          <p>
            <span className="label">History:</span> 
            {manuscript.history.map(state => STATE_LABELS[state] || state).join(' → ')}
          </p>
        )}
      </div>
      
      <div className="manuscript-actions">
        <button 
          className="edit-button" 
          onClick={showEditForm}
        >
          Edit
        </button>
        
        {validActions.length > 0 && (
          <button 
            className="view-button" 
            onClick={showStateUpdateForm}
          >
            Update State
          </button>
        )}
        
        <button 
          className="delete-button" 
          onClick={handleDelete}
        >
          Delete
        </button>
      </div>
      
      <EditManuscriptForm
        manuscript={manuscript}
        visible={isEditing}
        cancel={hideEditForm}
        fetchManuscripts={fetchManuscripts}
        setError={setError}
      />
      
      {isUpdatingState && (
        <div className="submission-form">
          <h3>Update Manuscript State</h3>
          <form onSubmit={handleStateUpdate}>
            <label htmlFor="action">Select Action</label>
            <select
              id="action"
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              required
            >
              <option value="">Select an action...</option>
              {validActions.map(action => (
                <option key={action.code} value={action.code}>
                  {action.label}
                </option>
              ))}
            </select>
            
            {(selectedAction === 'ARF' || selectedAction === 'DRF') && (
              <>
                <label htmlFor="referee-email">Referee Email</label>
                <input
                  type="email"
                  id="referee-email"
                  value={refereeEmail}
                  onChange={(e) => setRefereeEmail(e.target.value)}
                  required
                />
              </>
            )}
            
            <div className="button-group">
              <button type="button" onClick={hideStateUpdateForm}>Cancel</button>
              <button type="submit">Apply Action</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

Manuscript.propTypes = {
  manuscript: propTypes.shape({
    title: propTypes.string.isRequired,
    author: propTypes.string.isRequired,
    author_email: propTypes.string.isRequired,
    text: propTypes.string.isRequired,
    abstract: propTypes.string.isRequired,
    editor_email: propTypes.string.isRequired,
    state: propTypes.string.isRequired,
    referees: propTypes.arrayOf(propTypes.string),
    history: propTypes.arrayOf(propTypes.string),
  }).isRequired,
  fetchManuscripts: propTypes.func.isRequired,
  setError: propTypes.func.isRequired,
};

// Helper function to convert manuscript object to array
function manuscriptsObjectToArray(data) {
  if (!data) return [];
  return Object.keys(data).map((key) => data[key]);
}

// Main Submissions component
function Submissions({ user }) {
  const [manuscripts, setManuscripts] = useState([]);
  const [error, setError] = useState('');
  const [addingManuscript, setAddingManuscript] = useState(false);
  const [searchTitle, setSearchTitle] = useState('');
  const [filteredManuscripts, setFilteredManuscripts] = useState([]);

  const fetchManuscripts = async () => {
    try {
      const data = await getManuscript();
      const manuscriptsArray = manuscriptsObjectToArray(data);
      setManuscripts(manuscriptsArray);
      setFilteredManuscripts(manuscriptsArray);
      setError('');
    } catch (err) {
      setError(`Failed to fetch manuscripts: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchManuscripts();
  }, []);

  useEffect(() => {
    // Filter manuscripts when search term changes
    if (!searchTitle.trim()) {
      setFilteredManuscripts(manuscripts);
    } else {
      const filtered = manuscripts.filter(manuscript => 
        manuscript.title.toLowerCase().includes(searchTitle.toLowerCase())
      );
      setFilteredManuscripts(filtered);
    }
  }, [searchTitle, manuscripts]);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchTitle.trim()) {
      fetchManuscripts();
      return;
    }
    
    try {
      const data = await getManuscriptsByTitle(searchTitle);
      const manuscriptsArray = Array.isArray(data) ? data : [data];
      setFilteredManuscripts(manuscriptsArray);
      setError('');
    } catch (err) {
      setError(`Failed to search for "${searchTitle}": ${err.message}`);
    }
  };

  const showAddManuscriptForm = () => setAddingManuscript(true);
  const hideAddManuscriptForm = () => setAddingManuscript(false);

  return (
    <div className="submissions-container">
      <h1>Manuscript Submissions</h1>
      
      {error && <ErrorMessage message={error} />}
      
      <div className="controls">
        <div className="controls-group">
          <form className="search-controls" onSubmit={handleSearch}>
            <div className="search-input-group">
              <input
                type="text"
                placeholder="Search by title..."
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
              />
              <button type="submit" className="search-button">
                Search
              </button>
            </div>
          </form>
        </div>
        
        <button type="button" onClick={showAddManuscriptForm}>
          Submit New Manuscript
        </button>
      </div>
      
      <AddManuscriptForm
        visible={addingManuscript}
        cancel={hideAddManuscriptForm}
        fetchManuscripts={fetchManuscripts}
        setError={setError}
        currentUser={user}
      />
      
      <div className="manuscript-list">
        {filteredManuscripts.length > 0 ? (
          filteredManuscripts.map((manuscript) => (
            <Manuscript
              key={manuscript.title}
              manuscript={manuscript}
              fetchManuscripts={fetchManuscripts}
              setError={setError}
            />
          ))
        ) : (
          <p>No manuscripts found.</p>
        )}
      </div>
    </div>
  );
}

Submissions.propTypes = {
  user: propTypes.shape({
    email: propTypes.string,
    name: propTypes.string,
  }),
};

export default Submissions; 