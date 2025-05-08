import React, { useEffect, useState } from 'react';
import propTypes from 'prop-types';
import { getText } from '../../services/textAPI';
import {
  getManuscriptsByTitle,
  createManuscript,
  updateManuscript,
  updateManuscriptState,
  getManuscripts,
  getManuscriptById
} from '../../services/manuscriptsAPI';
import { addRole } from '../../services/peopleAPI';
import { useAuth } from '../../contexts/AuthContext';
import './Submissions.css';

// Error message component
function ErrorMessage({ message }) {
  return <div className="error-message">{message}</div>;
}
ErrorMessage.propTypes = {
  message: propTypes.string.isRequired,
};

// Component for creating a new manuscript
function AddManuscriptForm({ visible, cancel, fetchManuscripts, setError }) {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [text, setText] = useState('');
  const [abstract, setAbstract] = useState('');
  const [editorEmail, setEditorEmail] = useState('');

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
      const isAuthor = currentUser?.roles?.some(role => role === 'AU');
      if (!isAuthor) {
        await addRole(currentUser.email, 'AU');
      }
      fetchManuscripts();
      cancel();
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
      <input required type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <label htmlFor="author">Author</label>
      <input required type="text" id="author" value={author} onChange={(e) => setAuthor(e.target.value)} />
      <label htmlFor="authorEmail">Author Email</label>
      <input required type="email" id="authorEmail" value={authorEmail} onChange={(e) => setAuthorEmail(e.target.value)} />
      <label htmlFor="abstract">Abstract</label>
      <textarea required id="abstract" value={abstract} onChange={(e) => setAbstract(e.target.value)} />
      <label htmlFor="text">Main Text</label>
      <textarea required id="text" value={text} onChange={(e) => setText(e.target.value)} />
      <label htmlFor="editorEmail">Editor Email</label>
      <input required type="email" id="editorEmail" value={editorEmail} onChange={(e) => setEditorEmail(e.target.value)} />
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
    id: propTypes.string,
    email: propTypes.string,
    name: propTypes.string,
  }),
};

// Component for editing an existing manuscript
function EditManuscriptForm({ manuscript, visible, cancel, fetchManuscripts, setError }) {
  const [title, setTitle] = useState(manuscript.title);
  const [author, setAuthor] = useState(manuscript.author);
  const [authorEmail, setAuthorEmail] = useState(manuscript.author_email);
  const [text, setText] = useState(manuscript.text);
  const [abstract, setAbstract] = useState(manuscript.abstract);
  const [editorEmail, setEditorEmail] = useState(manuscript.editor_email);

  useEffect(() => {
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
      _id: manuscript._id,
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
      cancel();
    } catch (error) {
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
      <input required type="email" id="edit-authorEmail" value={authorEmail} onChange={(e) => setAuthorEmail(e.target.value)} />
      <label htmlFor="edit-abstract">Abstract</label>
      <textarea required id="edit-abstract" value={abstract} onChange={(e) => setAbstract(e.target.value)} />
      <label htmlFor="edit-text">Main Text</label>
      <textarea required id="edit-text" value={text} onChange={(e) => setText(e.target.value)} />
      <label htmlFor="edit-editorEmail">Editor Email</label>
      <input required type="email" id="edit-editorEmail" value={editorEmail} onChange={(e) => setEditorEmail(e.target.value)} />
      <div className="button-group">
        <button type="button" onClick={cancel}>Cancel</button>
        <button type="submit">Save Changes</button>
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

// Component for displaying a single manuscript
function Manuscript({ manuscript, fetchManuscripts, setError }) {
  const [isEditing, setIsEditing] = useState(false);

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

  const handleWithdraw = async () => {
    if (window.confirm(`Are you sure you want to withdraw "${manuscript.title}"?`)) {
      try {
        await updateManuscriptState(manuscript._id, "WIT");
        fetchManuscripts();
      } catch (error) {
        console.error("Withdraw error:", error);
        setError(`Failed to withdraw manuscript: ${error.message}`);
      }
    }
  };

  const showEditForm = () => setIsEditing(true);
  const hideEditForm = () => setIsEditing(false);
  const notEditable = manuscript?.state === 'WIT' || manuscript?.state === 'PUB' || manuscript?.state === 'REJ';
  return (
    <div className="manuscript-item">
      <div className={`state-tag state-${manuscript.state}`}>
        {STATE_LABELS[manuscript.state] || manuscript.state}
      </div>
      <h3 className="manuscript-title">
        <a href={`/manuscript/${manuscript._id}`} className="manuscript-link">
          {manuscript.title}
        </a>
      </h3>
      <div className="manuscript-info">
        <p><span className="label">Author:</span> {manuscript.author}</p>
        <p><span className="label">Author Email:</span> {manuscript.author_email}</p>
        <p><span className="label">Editor:</span> {manuscript.editor_email}</p>
        {manuscript.referees && manuscript.referees.length > 0 && (
          <p><span className="label">Referees:</span> {manuscript.referees.join(', ')}</p>
        )}
        <div className="abstract-text">
          <p><span className="label">Abstract:</span></p>
          <p>{manuscript.abstract}</p>
        </div>
        {manuscript.history && manuscript.history.length > 0 && (
          <p><span className="label">History:</span> {manuscript.history.map(state => STATE_LABELS[state] || state).join(' → ')}</p>
        )}
      </div>
      <div className="manuscript-actions">
        {(!notEditable) && (
          <button className="edit-button" onClick={showEditForm}>Edit</button>
        )}
        <button className="withdraw-button" onClick={handleWithdraw}>Withdraw</button>
      </div>
      <EditManuscriptForm
        manuscript={manuscript}
        visible={isEditing}
        cancel={hideEditForm}
        fetchManuscripts={fetchManuscripts}
        setError={setError}
      />
    </div>
  );
}
Manuscript.propTypes = {
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
  fetchManuscripts: propTypes.func.isRequired,
  setError: propTypes.func.isRequired,
};

// Submission Guidelines Component
function SubmissionGuidelines({ visible }) {
  const [submissionData, setSubmissionData] = useState({ title: '', text: '' });

  useEffect(() => {
    async function fetchSubmissionContent() {
      try {
        const data = await getText('submissionGuideline');
        setSubmissionData(data);
      } catch (error) {
        console.error('Error fetching submission guidelines:', error);
      }
    }
    fetchSubmissionContent();
  }, []);

  return (
    <div className={`submission-guidelines ${visible ? 'visible' : ''}`}>
      <div className="guidelines-header">
        {submissionData.title ? (
          <h2>{submissionData.title}</h2>
        ) : (
          <h2>Loading...</h2>
        )}
      </div>

      {visible && submissionData.text && (
        <div className="guidelines-content" dangerouslySetInnerHTML={{ __html: submissionData.text }} />
      )}
    </div>
  );
}

SubmissionGuidelines.propTypes = {
  visible: propTypes.bool.isRequired,
  toggleVisibility: propTypes.func.isRequired
};

const Submissions = ({ user }) => {
  const [filteredManuscripts, setFilteredManuscripts] = useState([]);
  const [error, setError] = useState('');
  const [addingManuscript, setAddingManuscript] = useState(false);
  const [guidelinesVisible, setGuidelinesVisible] = useState(false);
  const [searchTitle, setSearchTitle] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const fetchManuscripts = async () => {
    try {
      const data = await getManuscripts();
      let manuscriptsArray = Array.isArray(data.manuscripts) ? data.manuscripts : [];
      // only show current user’s own submissions
      if (user?.email) {
        manuscriptsArray = manuscriptsArray.filter(m => m.author_email === user.email);
      }
      setFilteredManuscripts(manuscriptsArray);
      setError('');
    } catch (err) {
      setError(err.message);
      setFilteredManuscripts([]);
    }
  };

  const fetchManuscriptById = async (id) => {
    try {
      const data = await getManuscriptById(id);
      if (data) {
        setFilteredManuscripts([data]);
      }
      setError('');
    } catch (err) {
      setError(`Failed to fetch manuscript: ${err.message}`);
      setFilteredManuscripts([]);
    }
  };

  useEffect(() => {
    // Check if we have an ID in the URL
    const path = window.location.pathname;
    const match = path.match(/\/manuscript\/(.+)/);
    if (match) {
      const id = match[1];
      fetchManuscriptById(id);
    } else {
      fetchManuscripts();
    }
  }, []);

  const handleSearch = async (e) => {
    if (e) {
      e.preventDefault();
    }
    setIsSearching(true);
    try {
      if (!searchTitle.trim()) {
        await fetchManuscripts();
      } else {
        const data = await getManuscriptsByTitle(searchTitle);
        let results = Array.isArray(data.manuscripts) ? data.manuscripts : [];
        if (user?.email) {
          results = results.filter(m => m.author_email === user.email);
        }
        setFilteredManuscripts(results);
        if (data.manuscripts.length === 0) {
          setError(`No manuscripts found matching "${searchTitle}"`);
        } else {
          setError('');
        }
      }
    } catch (err) {
      setError(`Failed to search for "${searchTitle}": ${err.message}`);
      setFilteredManuscripts([]);
    } finally {
      setIsSearching(false);
    }
  };

  const showAddManuscriptForm = () => setAddingManuscript(true);
  const hideAddManuscriptForm = () => setAddingManuscript(false);
  const toggleGuidelines = () => setGuidelinesVisible(!guidelinesVisible);

  return (
    <div className="submissions-container">
      <div className="submissions-header">
        <h2>Manuscripts</h2>
      </div>

      <div className="controls-container">
        <button onClick={showAddManuscriptForm} className="add-button">
          Add
        </button>

        <div className="search-controls">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search by title..."
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
            />
            <button type="submit" disabled={isSearching}>
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {addingManuscript && (
        <AddManuscriptForm
          visible={addingManuscript}
          cancel={hideAddManuscriptForm}
          fetchManuscripts={fetchManuscripts}
          setError={setError}
          currentUser={user}
        />
      )}

      <div className="manuscripts-list">
        {filteredManuscripts && filteredManuscripts.length > 0 ? (
          filteredManuscripts.map((manuscript) => (
            <Manuscript
              key={manuscript._id}
              manuscript={manuscript}
              fetchManuscripts={fetchManuscripts}
              setError={setError}
            />
          ))
        ) : (
          <div className="no-manuscripts">
            {!searchTitle.trim() ? "No manuscripts found" : null}
          </div>
        )}
      </div>

      <div className="guidelines-button-container">
        <button
          className="view-guidelines-button"
          onClick={toggleGuidelines}
        >
          {guidelinesVisible ? 'Hide Submission Guidelines' : 'View Submission Guidelines'}
        </button>
      </div>

      <SubmissionGuidelines
        visible={guidelinesVisible}
        toggleVisibility={toggleGuidelines}
      />
    </div>
  );
};

Submissions.propTypes = {
  user: propTypes.shape({
    id: propTypes.string,
    email: propTypes.string,
    name: propTypes.string,
  }),
};

export default Submissions;