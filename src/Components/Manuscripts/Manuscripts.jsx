import React, { useEffect, useState } from 'react';
import propTypes from 'prop-types';
import { useAuth } from '../../contexts/AuthContext';
import { getManuscript, getManuscriptsByTitle, updateManuscript } from '../../services/manuscriptsAPI';
import { addRefereeToManuscript as apiAddRefereeToManuscript, createReferee as apiCreateReferee } from '../../services/refereeAPI';
import { getAllPeople } from '../../services/peopleAPI';
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
  });
  const [selectedReferee, setSelectedReferee] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const hasEditorRole = currentUser?.roles?.includes('ED');

  const fetchManuscripts = async () => {
    try {
      const data = await getManuscript();
      const manuscriptsArray = Array.isArray(data) ? data : ManuscriptsObjectToArray(data);
      setManuscripts(manuscriptsArray);
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
      await apiAddRefereeToManuscript(manuscriptId, refereeEmail);
      fetchManuscripts();
      setDropdownOpen(prev => ({ ...prev, [manuscriptId]: false }));
      setSelectedReferee(prev => ({ ...prev, [manuscriptId]: '' }));
    } catch (err) {
      setError(`Error adding referee: ${err.message}`);
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
      const data = await apiCreateReferee(newRefereeData);
      setPeople(prev => [...prev, data]);
      setNewRefereeData({
        email: '',
        password: '',
        affiliation: ''
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

  useEffect(() => {
    fetchManuscripts();
    if (hasEditorRole) {
      fetchPeople();
    }
  }, [hasEditorRole]);

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
            manuscripts.map((manuscript) => (
              <div key={manuscript._id} className="manuscript-card">
                <div className="manuscript-simple-content">
                  <StatusBadge state={manuscript.state} />
                  <h3 className="manuscript-title">{manuscript.title}</h3>
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
                      {manuscript.referees && manuscript.referees.length > 0 && (
                        <p><span className="info-label">Referees:</span> {manuscript.referees.join(', ')}</p>
                      )}
                      <div className="abstract-section">
                        <p><span className="info-label">Full Abstract:</span></p>
                        <p>{manuscript.abstract}</p>
                      </div>
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
                          Add Referee
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
                                {isLoading ? 'Adding...' : 'Confirm'}
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
            ))
          ) : (
            <div className="no-manuscripts">No manuscripts found</div>
          )}
        </div>
      ) : (
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
                                Add Referee
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
                                      {isLoading ? 'Adding...' : 'Confirm'}
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
                    type="name"
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
    </div>
  );
}

export default Manuscripts;
