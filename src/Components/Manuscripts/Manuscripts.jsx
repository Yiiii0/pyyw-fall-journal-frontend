import React, { useEffect, useState } from 'react';
import propTypes from 'prop-types';

import { getManuscript, getManuscriptsByTitle, updateManuscript } from '../../services/manuscriptsAPI';
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
  // Convert a dictionary of manuscripts (keyed by title) to an array
  if (!data) return [];
  return Object.keys(data).map((key) => data[key]);
}

// Status renderer that displays state in a nicely formatted badge
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

  const fetchManuscripts = async () => {
    try {
      console.log('Fetching manuscripts...');
      const data = await getManuscript();
      console.log('Received data:', data);
      // Convert data to array if necessary
      const manuscriptsArray = Array.isArray(data)
        ? data
        : ManuscriptsObjectToArray(data);
      setManuscripts(manuscriptsArray);
      setError('');
    } catch (err) {
      console.error('Error fetching manuscripts:', err);
      setError(`There was a problem retrieving the list of manuscripts. ${err.message}`);
    }
  };

  const handleSearch = async (e) => {
    if (e) {
      e.preventDefault();
    }

    if (!searchTitle.trim()) {
      fetchManuscripts();
      return;
    }
    try {
      const data = await getManuscriptsByTitle(searchTitle);
      // Convert data to array if necessary
      const manuscriptsArray = Array.isArray(data)
        ? data
        : ManuscriptsObjectToArray(data);
      setManuscripts(manuscriptsArray);
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
      console.log("Sending update with data:", editFormData);
      await updateManuscript(editFormData);
      setEditingManuscript(null);
      fetchManuscripts(); // Refresh the list after update
      setError('');
    } catch (err) {
      setError(`Failed to update manuscript: ${err.message}`);
      console.error("Update error:", err);
    }
  };

  useEffect(() => {
    console.log('Manuscripts component mounted');
    fetchManuscripts();
  }, []);

  return (
    <div className="manuscripts-wrapper">
      <div className="manuscripts-header">
        <h1>View All Manuscripts</h1>
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
      
      <div className="manuscripts-table-container">
        <table className="manuscripts-table">
          <thead>
            <tr>
              <th>Basic Information</th>
              <th>Referee Review</th>
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
                            ? manuscript.referees.join(', ') 
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
                      <button 
                        className="edit-button" 
                        onClick={() => handleEditClick(manuscript)}
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                  <td className="process-cell">
                    {manuscript.state === 'REV' ? (
                      <div className="stage-content active-stage">
                        <span className="stage-indicator">In Progress</span>
                      </div>
                    ) : manuscript.history && manuscript.history.includes('REV') ? (
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
                    {manuscript.state === 'ARV' ? (
                      <div className="stage-content active-stage">
                        <span className="stage-indicator">In Progress</span>
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
                <td colSpan="7" className="no-results">No manuscripts found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Add PropTypes for the Manuscripts component if needed
Manuscripts.propTypes = {
  // If there are any props, define them here
};

export default Manuscripts;
