import React, { useEffect, useState } from 'react';
import propTypes from 'prop-types';
import { 
  getManuscript, 
  getManuscriptsByTitle, 
  createManuscript, 
  updateManuscript, 
  deleteManuscript,
  updateManuscriptState,
  deleteAllTextPages,
  getTextPages,
  deleteTextPage
} from '../../services/manuscriptsAPI';
import RefereeActionForm from '../Referee';
import TextPageEditor from '../Manuscripts/TextPageEditor';
import './Submissions.css';

// Error message component
function ErrorMessage({ message }) {
  return <div className="error-message">{message}</div>;
}
ErrorMessage.propTypes = {
  message: propTypes.string.isRequired,
};

// Component for creating a new manuscript
function AddManuscriptForm({ visible, cancel, fetchManuscripts, setError, currentUser }) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [abstract, setAbstract] = useState('');
  const [editorEmail, setEditorEmail] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (currentUser && currentUser.email) {
      setEditorEmail(currentUser.email);
    }
  }, [currentUser]);

  // Validate email format according to backend requirements
  const validateEmail = (email) => {
    const pattern = /^(?!.*\.\.)[A-Za-z0-9][a-zA-Z0-9._%+-]*@[A-Za-z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,10}$/;
    return pattern.test(email);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setValidationErrors({});

    // Validate inputs
    const errors = {};
    if (!validateEmail(authorEmail)) {
      errors.authorEmail = 'Invalid email format';
    }
    if (!validateEmail(editorEmail)) {
      errors.editorEmail = 'Invalid email format';
    }

    // If there are validation errors, don't submit
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    const manuscriptData = {
      title,
      author,
      author_email: authorEmail,
      abstract,
      editor_email: editorEmail,
      text: 'Initial manuscript content. Please add text pages for detailed content.',
    };
    try {
      await createManuscript(manuscriptData);
      fetchManuscripts();
      cancel();
      setTitle('');
      setAuthor('');
      setAuthorEmail('');
      setAbstract('');
    } catch (error) {
      setError(error.message);
    }
  };

  if (!visible) return null;

  return (
    <form className="submission-form" onSubmit={handleSubmit}>
      <h2>Add New Manuscript</h2>
      <label htmlFor="title">Title</label>
      <input required type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <label htmlFor="author">Author</label>
      <input required type="text" id="author" value={author} onChange={(e) => setAuthor(e.target.value)} />
      <label htmlFor="authorEmail">Author Email</label>
      <input 
        required 
        type="email" 
        id="authorEmail" 
        value={authorEmail} 
        onChange={(e) => setAuthorEmail(e.target.value)} 
        className={validationErrors.authorEmail ? 'error' : ''}
      />
      {validationErrors.authorEmail && <div className="validation-error">{validationErrors.authorEmail}</div>}
      <label htmlFor="abstract">Abstract</label>
      <textarea required id="abstract" value={abstract} onChange={(e) => setAbstract(e.target.value)} />
      <label htmlFor="editorEmail">Editor Email</label>
      <input 
        required 
        type="email" 
        id="editorEmail" 
        value={editorEmail} 
        onChange={(e) => setEditorEmail(e.target.value)} 
        className={validationErrors.editorEmail ? 'error' : ''}
      />
      {validationErrors.editorEmail && <div className="validation-error">{validationErrors.editorEmail}</div>}
      <div className="note">
        <p>Note: Text pages can be added after creating the manuscript.</p>
      </div>
      <div className="form-actions">
        <button type="submit">Submit</button>
        <button type="button" onClick={cancel}>Cancel</button>
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
function EditManuscriptForm({ manuscript, visible, cancel, fetchManuscripts, setError }) {
  // Add debugging for the manuscript object
  console.log('EditManuscriptForm - manuscript:', manuscript);
  console.log('EditManuscriptForm - manuscript._id:', manuscript._id);
  console.log('EditManuscriptForm - manuscript ID type:', typeof manuscript._id);
  
  // Ensure we have a valid manuscript ID
  const manuscriptId = manuscript._id ? (typeof manuscript._id === 'string' ? manuscript._id : String(manuscript._id)) : null;
  console.log('EditManuscriptForm - processed manuscriptId:', manuscriptId);
  
  const [title, setTitle] = useState(manuscript.title);
  const [author, setAuthor] = useState(manuscript.author);
  const [authorEmail, setAuthorEmail] = useState(manuscript.author_email);
  const [abstract, setAbstract] = useState(manuscript.abstract);
  const [editorEmail, setEditorEmail] = useState(manuscript.editor_email);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    setTitle(manuscript.title);
    setAuthor(manuscript.author);
    setAuthorEmail(manuscript.author_email);
    setAbstract(manuscript.abstract);
    setEditorEmail(manuscript.editor_email);
  }, [manuscript]);

  // Validate email format according to backend requirements
  const validateEmail = (email) => {
    const pattern = /^(?!.*\.\.)[A-Za-z0-9][a-zA-Z0-9._%+-]*@[A-Za-z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,10}$/;
    return pattern.test(email);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setValidationErrors({});

    // Validate inputs
    const errors = {};
    if (!validateEmail(authorEmail)) {
      errors.authorEmail = 'Invalid email format';
    }
    if (!validateEmail(editorEmail)) {
      errors.editorEmail = 'Invalid email format';
    }

    // If there are validation errors, don't submit
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Check if manuscript ID is available
    console.log('handleSubmit - manuscript:', manuscript);
    console.log('handleSubmit - manuscript._id:', manuscript._id);
    console.log('handleSubmit - manuscriptId:', manuscriptId);
    
    if (!manuscriptId) {
      console.error('Manuscript ID is missing');
      setError('Manuscript ID is missing. Cannot update manuscript.');
      return;
    }

    // Ensure text is not empty
    const textContent = 'Updated manuscript content. Please check text pages for detailed content.';
    
    const manuscriptData = {
      manu_id: manuscriptId,
      title,
      author,
      author_email: authorEmail,
      abstract,
      editor_email: editorEmail,
      text: textContent,
    };
    
    console.log('Submitting manuscript update with data:', manuscriptData);
    
    try {
      const response = await updateManuscript(manuscriptData);
      console.log('Manuscript update successful:', response);
      fetchManuscripts();
      cancel();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setError(error.message);
    }
  };

  if (!visible) return null;

  return (
    <form className="submission-form" onSubmit={handleSubmit}>
      <h2>Edit Manuscript</h2>
      <label htmlFor="edit-title">Title</label>
      <input required type="text" id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} disabled />
      <label htmlFor="edit-author">Author</label>
      <input required type="text" id="edit-author" value={author} onChange={(e) => setAuthor(e.target.value)} />
      <label htmlFor="edit-authorEmail">Author Email</label>
      <input 
        required 
        type="email" 
        id="edit-authorEmail" 
        value={authorEmail} 
        onChange={(e) => setAuthorEmail(e.target.value)} 
        className={validationErrors.authorEmail ? 'error' : ''}
      />
      {validationErrors.authorEmail && <div className="validation-error">{validationErrors.authorEmail}</div>}
      <label htmlFor="edit-abstract">Abstract</label>
      <textarea required id="edit-abstract" value={abstract} onChange={(e) => setAbstract(e.target.value)} />
      <label htmlFor="edit-editorEmail">Editor Email</label>
      <input 
        required 
        type="email" 
        id="edit-editorEmail" 
        value={editorEmail} 
        onChange={(e) => setEditorEmail(e.target.value)} 
        className={validationErrors.editorEmail ? 'error' : ''}
      />
      {validationErrors.editorEmail && <div className="validation-error">{validationErrors.editorEmail}</div>}
      <div className="note">
        <p>Note: Text pages can be managed in the Manuscripts section.</p>
      </div>
      <div className="form-actions">
        <button type="submit">Save Changes</button>
        <button type="button" onClick={cancel}>Cancel</button>
      </div>
    </form>
  );
}
EditManuscriptForm.propTypes = {
  manuscript: propTypes.shape({
    _id: propTypes.string.isRequired,
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

// Component for managing text pages
function ManageTextPages({ manuscript, onBack, setError }) {
  const [textPages, setTextPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [addingPage, setAddingPage] = useState(false);
  const [localError, setLocalError] = useState('');

  const fetchTextPages = async () => {
    try {
      setLoading(true);
      setLocalError('');
      const pages = await getTextPages(manuscript._id);
      setTextPages(pages);
    } catch (error) {
      setLocalError(`Failed to load text pages: ${error.message}`);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTextPages();
  }, [manuscript._id]);

  const handleEditPage = (pageNumber) => {
    setEditingPage({
      manuscriptId: manuscript._id,
      pageNumber
    });
  };

  const handleAddPage = () => {
    setAddingPage(true);
  };

  const handleDeletePage = async (pageNumber) => {
    if (!window.confirm(`Are you sure you want to delete page ${pageNumber}?`)) {
      return;
    }

    try {
      setLocalError('');
      await deleteTextPage(manuscript._id, pageNumber);
      await fetchTextPages();
    } catch (error) {
      setLocalError(`Failed to delete page: ${error.message}`);
      setError(error.message);
    }
  };

  const handleSavePage = async () => {
    await fetchTextPages();
    setEditingPage(null);
    setAddingPage(false);
  };

  const handleCancelEdit = () => {
    setEditingPage(null);
    setAddingPage(false);
  };

  // If we're editing or adding a page, show the editor
  if (editingPage) {
    return (
      <TextPageEditor
        manuscriptId={editingPage.manuscriptId}
        pageNumber={editingPage.pageNumber}
        onSave={handleSavePage}
        onCancel={handleCancelEdit}
      />
    );
  }

  if (addingPage) {
    return (
      <TextPageEditor
        manuscriptId={manuscript._id}
        onSave={handleSavePage}
        onCancel={handleCancelEdit}
      />
    );
  }

  // Sort pages by page number
  const sortedPages = [...textPages].sort((a, b) => {
    // Try to sort numerically if possible
    const numA = parseInt(a.pageNumber, 10);
    const numB = parseInt(b.pageNumber, 10);
    
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    
    // Fall back to string comparison
    return a.pageNumber.localeCompare(b.pageNumber);
  });

  return (
    <div className="manage-text-pages">
      <div className="manage-text-pages-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Manuscript
        </button>
        <h2>Manage Text Pages for &quot;{manuscript.title}&quot;</h2>
      </div>
      
      {localError && <ErrorMessage message={localError} />}
      
      <div className="text-pages-actions">
        <button className="add-page-button" onClick={handleAddPage}>
          Add New Page
        </button>
      </div>
      
      {loading ? (
        <div className="loading-text-pages">Loading text pages...</div>
      ) : sortedPages.length === 0 ? (
        <div className="no-text-pages">
          <p>No text pages available</p>
          <button className="add-page-button" onClick={handleAddPage}>
            Add First Page
          </button>
        </div>
      ) : (
        <div className="text-pages-list">
          {sortedPages.map((page) => (
            <div key={page.pageNumber} className="text-page-item">
              <div className="text-page-header">
                <h3>{page.title}</h3>
                <div className="page-number">Page {page.pageNumber}</div>
              </div>
              <div className="text-page-content">{page.text}</div>
              <div className="text-page-actions">
                <button 
                  className="edit-button" 
                  onClick={() => handleEditPage(page.pageNumber)}
                >
                  Edit
                </button>
                <button 
                  className="delete-button" 
                  onClick={() => handleDeletePage(page.pageNumber)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

ManageTextPages.propTypes = {
  manuscript: propTypes.shape({
    _id: propTypes.string.isRequired,
    title: propTypes.string.isRequired,
  }).isRequired,
  onBack: propTypes.func.isRequired,
  setError: propTypes.func.isRequired,
};

// Component for displaying a single manuscript
function Manuscript({ manuscript, fetchManuscripts, setError }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdatingState, setIsUpdatingState] = useState(false);
  const [selectedAction, setSelectedAction] = useState('');
  const [localError, setLocalError] = useState('');
  const [managingTextPages, setManagingTextPages] = useState(false);
  
  // Add a function to navigate to the Manuscripts section
  const navigateToManuscripts = () => {
    window.location.href = '/manuscripts';
  };

  // Add a function to manage text pages directly in this component
  const handleManageTextPages = () => {
    setManagingTextPages(true);
  };
  
  const handleBackFromTextPages = () => {
    setManagingTextPages(false);
  };
  
  // Build valid actions based on the current state
  const getValidActions = () => {
    const actions = [];
    switch (manuscript.state) {
      case 'SUB':
        actions.push('REV', 'REJ');
        break;
      case 'REV':
        actions.push('SBR');
        break;
      case 'AUR':
        actions.push('REV', 'REJ');
        break;
      case 'CED':
        actions.push('PUB', 'REJ');
        break;
      default:
        break;
    }
    return actions;
  };
  
  const [validActions, setValidActions] = useState([]);
  
  useEffect(() => {
    setValidActions(getValidActions());
  }, [manuscript.state]);
  
  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${manuscript.title}"?`)) {
      try {
        setLocalError('');
        // First, delete all text pages associated with the manuscript
        await deleteAllTextPages(manuscript._id);
        // Then delete the manuscript
        await deleteManuscript(manuscript._id);
        fetchManuscripts();
      } catch (error) {
        setLocalError(`Failed to delete manuscript: ${error.message}`);
        setError(error.message); // Also set the parent error state for consistent error handling
      }
    }
  };

  const handleStateUpdate = async (e) => {
    e.preventDefault();
    try {
      setLocalError('');
      await updateManuscriptState(manuscript.title, selectedAction);
      fetchManuscripts();
      setIsUpdatingState(false);
      setSelectedAction('');
    } catch (error) {
      setLocalError(`Failed to update manuscript state: ${error.message}`);
      setError(error.message); // Also set the parent error state for consistent error handling
    }
  };

  const showEditForm = () => setIsEditing(true);
  const hideEditForm = () => setIsEditing(false);
  const showStateUpdateForm = () => setIsUpdatingState(true);
  const hideStateUpdateForm = () => {
    setIsUpdatingState(false);
    setSelectedAction('');
  };

  // If we're managing text pages, show the ManageTextPages component
  if (managingTextPages) {
    return (
      <ManageTextPages 
        manuscript={manuscript} 
        onBack={handleBackFromTextPages}
        setError={setError}
      />
    );
  }

  return (
    <div className="manuscript-item">
      {localError && <ErrorMessage message={localError} />}
      <div className="manuscript-title">
        <h2>{manuscript.title}</h2>
        <span className={`state-tag state-${manuscript.state}`}>{manuscript.state}</span>
      </div>
      <div className="manuscript-info">
        <p><span className="label">Author:</span> {manuscript.author}</p>
        <p><span className="label">Author Email:</span> {manuscript.author_email}</p>
        <p><span className="label">Editor Email:</span> {manuscript.editor_email}</p>
        <p><span className="label">Abstract:</span> {manuscript.abstract}</p>
        <p><span className="label">Referees:</span> {manuscript.referees && manuscript.referees.length > 0 ? manuscript.referees.join(', ') : 'None'}</p>
        <p><span className="label">History:</span> {manuscript.history && manuscript.history.length > 0 ? manuscript.history.join(', ') : 'No history'}</p>
        <div className="text-pages-link">
          <div className="text-pages-buttons">
            <button onClick={handleManageTextPages} className="manage-text-pages-button">
              Manage Text Pages
            </button>
            <button onClick={navigateToManuscripts} className="view-text-pages-button">
              View Text Pages
            </button>
          </div>
          <p className="text-pages-note">
            You can manage text pages directly here or view them in the Manuscripts section.
          </p>
        </div>
      </div>
      <div className="manuscript-actions">
        <button className="edit-button" onClick={showEditForm}>Edit</button>
        <button className="delete-button" onClick={handleDelete}>Delete</button>
        <button className="view-button" onClick={showStateUpdateForm}>Update State</button>
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
              {validActions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
            {selectedAction !== 'SBR' && (
              <div className="button-group">
                <button type="button" onClick={hideStateUpdateForm}>Cancel</button>
                <button type="submit">Apply Action</button>
              </div>
            )}
          </form>
          {selectedAction === 'SBR' && (
            <RefereeActionForm
              title={manuscript.title}
              onSuccess={() => {
                fetchManuscripts();
                hideStateUpdateForm();
              }}
              setError={setError}
              onCancel={hideStateUpdateForm}
            />
          )}
        </div>
      )}
    </div>
  );
}
Manuscript.propTypes = {
  manuscript: propTypes.shape({
    _id: propTypes.string.isRequired,
    title: propTypes.string.isRequired,
    author: propTypes.string.isRequired,
    author_email: propTypes.string.isRequired,
    editor_email: propTypes.string.isRequired,
    abstract: propTypes.string.isRequired,
    state: propTypes.string.isRequired,
    referees: propTypes.arrayOf(propTypes.string),
    history: propTypes.arrayOf(propTypes.string),
  }).isRequired,
  fetchManuscripts: propTypes.func.isRequired,
  setError: propTypes.func.isRequired,
};

function manuscriptsObjectToArray(data) {
  if (!data) return [];
  return Object.keys(data).map((key) => data[key]);
}

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
    if (!searchTitle.trim()) {
      setFilteredManuscripts(manuscripts);
    } else {
      const filtered = manuscripts.filter((manuscript) =>
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
              <button type="submit" className="search-button">Search</button>
            </div>
          </form>
        </div>
        <button type="button" onClick={showAddManuscriptForm}>Submit New Manuscript</button>
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