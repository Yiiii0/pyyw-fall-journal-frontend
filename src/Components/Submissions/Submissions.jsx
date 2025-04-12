import React, { useEffect, useState } from 'react';
import propTypes from 'prop-types';
import {
  getManuscriptsByTitle,
  createManuscript,
  updateManuscript,
  deleteManuscriptByTitle,
  updateManuscriptState,
  getManuscripts,
  getValidActions,
  getManuscriptById
} from '../../services/manuscriptsAPI';
import RefereeActionForm from '../Referee';
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
  const [text, setText] = useState('');
  const [abstract, setAbstract] = useState('');
  const [editorEmail, setEditorEmail] = useState('');

  useEffect(() => {
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
  const [isUpdatingState, setIsUpdatingState] = useState(false);
  const [selectedAction, setSelectedAction] = useState('');
  const [validActions, setValidActions] = useState([]);

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

  useEffect(() => {
    const fetchValidActions = async () => {
      try {
        const actions = await getValidActions(manuscript.state);
        setValidActions(actions);
      } catch (error) {
        setError(error.message);
      }
    };
    fetchValidActions();
  }, [manuscript.state, setError]);

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
      await updateManuscriptState(manuscript.title, selectedAction);
      fetchManuscripts();
      setIsUpdatingState(false);
      setSelectedAction('');
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
  };

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
        <button className="edit-button" onClick={showEditForm}>Edit</button>
        {validActions.length > 0 && (
          <button className="view-button" onClick={showStateUpdateForm}>Update State</button>
        )}
        <button className="delete-button" onClick={handleDelete}>Delete</button>
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
                <option key={action.code} value={action.code}>
                  {action.label}
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
function SubmissionGuidelines({ visible, toggleVisibility }) {
  return (
    <div className={`submission-guidelines ${visible ? 'visible' : ''}`}>
      <div className="guidelines-header">
        <h2>Submission Guidelines</h2>
        <button className="toggle-guidelines" onClick={toggleVisibility}>
          {visible ? 'Hide Guidelines' : 'View Guidelines'}
        </button>
      </div>

      {visible && (
        <div className="guidelines-content">
          <h3>SFA&apos;s Structured Finance Journal (SFJ)</h3>

          <h4>Editorial Procedure</h4>
          <p>The SFJ follows a double-blind peer review procedure -- the author&apos;s and reviewer&apos;s identity and institution are not disclosed.</p>

          <h4>Target Audience</h4>
          <p>Structured fixed income markets professionals</p>

          <h4>Target Length</h4>
          <p>The manuscript should be 2,500-3,500 words, excluding the abstract, exhibits, and references.</p>

          <h4>Originality and Exclusivity</h4>
          <p>Any manuscript submitted must be an original work that has not been previously published in any form, including, but not limited to, journals, magazines, corporate websites, book chapters, or widely-distributed research for clients and must not be under consideration for publication elsewhere.</p>
          <p>An author must attest to the originality of the work and agree to take full responsibility for the content of the manuscript and accuracy of information. In cases where there are multiple authors, each author must submit an Attestation of Originality and Accountability (attached as an exhibit hereto).</p>

          <h4>Guidelines on the Use of Artificial Intelligence (AI)</h4>
          <p>We follow the threshold of originality as defined by US case law. Specifically, we accept originality as involving two key conditions: independent creation by the author and a level of novelty or newness. Large Language Models (LLMs) or other AI models, like ChatGPT, cannot be used to generate content claimed to be original.\ The use of AIs is limited to mechanical, technical and stylistic aspects of the manuscript, as outlined below. AI used in this way must be clearly disclosed in Chicago Manual of Style CMS style footnotes. Failure to disclose AI usage is considered unethical and will result in the rejection of the submission.</p>

          <h5>Not Permissible</h5>
          <p><strong>Content Generation:</strong></p>
          <ul>
            <li><strong>Substantive Writing:</strong> AIs should not be used to generate substantive parts of the manuscript, such as entire paragraphs or sections. The core arguments, analysis, and conclusions must be the original work of the author, not generated by AI.</li>
            <li><strong>Paraphrasing:</strong> AIs should not be used to paraphrase existing content to create the illusion of originality.</li>
            <li><strong>Unattributed Text:</strong> Using AI-generated text without proper attribution or presenting it as the author&apos;s own work is strictly prohibited.</li>
          </ul>

          <h5>Permissible</h5>
          <ul>
            <li><strong>Mechanical Editing:</strong> AIs may be used as a production tool, such as for mechanical editing to improve clarity and flow of content, and to correct grammatical, spelling, punctuation and typographical errors. AIs used in this way must be clearly disclosed.</li>
            <li><strong>Mechanical Data Processing:</strong> AIs may be used for repetitive and specifically defined activities such as data cleaning, aggregation, integration and basic statistical computations. AIs cannot be used for analytical data processing, which includes activities like as data interpretation and critical problem-solving.</li>
            <li><strong>Idea generation:</strong> AIs may be used in the early stages of research to facilitate the generation of ideas. Use of AIs in this way must be disclosed and the specific AI tool used should be credited as an endnote. The author(s) remain solely responsible for core arguments, analysis, and conclusions.</li>
            <li><strong>Citation Management:</strong> AIs may be used to format and organize citations and bibliographies.</li>
          </ul>

          <h4>Submission Process</h4>
          <p>SFJ accepts submissions exclusively through its online article submission system. This includes agreeing to the terms of the SFJ copyright agreement and completing an Attestation of Originality and Accountability. A submission may be accepted, accepted with revisions or rejected.</p>

          <h4>Rejections</h4>
          <p>A submission will be rejected immediately for the following reasons:</p>
          <ul>
            <li>Non-compliance with these submission guidelines</li>
            <li>Irrelevant topic to the scope of the SFJ</li>
            <li>Poor quality of research (Research that is not an original contribution or contains poor methodology)</li>
            <li>Inclusion of plagiarized content or issues with data integrity</li>
            <li>Overly promotional or biased</li>
            <li>Contains language that is discriminatory, offensive or disrespectful that does not align with the SFJ&apos;s standards of professionalism</li>
          </ul>

          <h4>Permissions</h4>
          <p>All exhibits must include their source [if the exhibit is not an original work of the author(s)]. If an exhibit has been published elsewhere, the author is responsible for obtaining permission from the copyright owner and must include this permission during the submission process.</p>

          <h4>Preferred Style</h4>
          <p>Articles should be in plain English, with minimal technical or industry jargon, written clearly and concisely.</p>
          <p><strong>Style:</strong> We follow the Chicago Manual of Style (CMS) for the text body, headings, footnotes, references, and exhibits, including guidelines on hyphenation, abbreviations, and capitalization.</p>
          <p><strong>Mechanical Standards:</strong> Manuscripts should be submitted as MS Word following SFA&apos;s specified formatting requirement for margins, font sizes, spacing, and pagination.</p>

          <h4>Typography</h4>
          <ul>
            <li><strong>Titles:</strong> Century Gothic Bold</li>
            <li><strong>Subtitles:</strong> Times New Roman</li>
            <li><strong>Accent Text:</strong> Calibri Light</li>
          </ul>

          <h4>Exhibits</h4>
          <p>Tabular or graphical materials should be labeled as exhibits, numbered consecutively, and referenced in the text. Exhibits must be submitted following SFA&apos;s guidelines for formatting tables and charts. Additionally, please submit CSV or Excel files containing the raw data and original graphs.</p>

          <h5>Typography for Exhibits</h5>
          <ul>
            <li><strong>Chart Titles:</strong> Calibri Light (Bold), 14</li>
            <li><strong>Sub-Title:</strong> Calibri Light (Italics), 12</li>
            <li>Calibri Light within graphs (axis titles, data points, labels, legends, etc.)</li>
          </ul>

          <h4>Content Organization</h4>
          <ul>
            <li><strong>Title:</strong> Articles should have a concise, descriptive title.</li>
            <li><strong>Abstract:</strong> An abstract should summarize the article&apos;s main points and help the reader decide if they want to read the full document. The tone is formal, straightforward and informative. Limit to 100 words.</li>
            <li><strong>Main Text Introductory Paragraphs:</strong> Authors should craft compelling introductory paragraphs to complement the abstract, communicating the article&apos;s main points, supporting analysis, and practical implications. A roadmap paragraph outlining the article&apos;s organization is recommended.</li>
            <li><strong>Headings:</strong> Articles may feature up to three levels of headings, each formatted in bold uppercase, indented bold, or bold in-line paragraph style. The first heading should follow the introductory material.</li>
            <li><strong>Exhibits:</strong> All exhibits should be numbered, with a descriptive title and referred to in the main text. All exhibits must include a source.</li>
            <li><strong>Footnotes:</strong> Footnotes should be used sparingly for peripheral commentary rather than references and follow the CMS author-date format.</li>
            <li><strong>References:</strong> References should follow the CMS author-date reference format for both in-text citations and the reference list.</li>
            <li><strong>Conclusion:</strong> End the main text with a succinct conclusion summarizing the article&apos;s main point, resembling the abstract but allowing for references and technical terms.</li>
          </ul>

          <h4>Republication</h4>
          <p>Republication is allowed with proper attribution to the original paper, using hyperlinks to the SFA platform.</p>
        </div>
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
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdatingState, setIsUpdatingState] = useState(false);
  const [selectedAction, setSelectedAction] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [validActions, setValidActions] = useState([]);

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

  const fetchManuscripts = async () => {
    try {
      const data = await getManuscripts();
      const manuscriptsArray = Array.isArray(data.manuscripts) ? data.manuscripts : [];
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
        setFilteredManuscripts(data.manuscripts);
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

  const showEditForm = () => setIsEditing(true);
  const hideEditForm = () => setIsEditing(false);
  const showStateUpdateForm = (manuscript) => {
    const fetchValidActions = async () => {
      try {
        const actions = await getValidActions(manuscript.state);
        setValidActions(actions);
      } catch (error) {
        setError(error.message);
      }
    };
    fetchValidActions();
    setIsUpdatingState(true);
  };
  const hideStateUpdateForm = () => {
    setIsUpdatingState(false);
    setSelectedAction('');
  };

  const handleDelete = async (manuscript) => {
    if (window.confirm(`Are you sure you want to delete "${manuscript.title}"?`)) {
      try {
        await deleteManuscriptByTitle(manuscript.title);
        fetchManuscripts();
      } catch (error) {
        setError(error.message);
      }
    }
  };

  const handleStateUpdate = async (e, manuscript) => {
    e.preventDefault();
    try {
      await updateManuscriptState(manuscript.title, selectedAction);
      fetchManuscripts();
      setIsUpdatingState(false);
      setSelectedAction('');
    } catch (error) {
      setError(error.message);
    }
  };

  const toggleGuidelines = () => {
    setGuidelinesVisible(!guidelinesVisible);
  };

  return (
    <div className="submissions-container">
      <div className="submissions-header">
        <h2>Manuscripts</h2>
        <button onClick={showAddManuscriptForm} className="add-button">
          Add Manuscript
        </button>
      </div>

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
            <div key={manuscript._id} className="manuscript-item">
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
                <button className="edit-button" onClick={showEditForm}>Edit</button>
                {validActions.length > 0 && (
                  <button className="view-button" onClick={() => showStateUpdateForm(manuscript)}>Update State</button>
                )}
                <button className="delete-button" onClick={() => handleDelete(manuscript)}>Delete</button>
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
                  <form onSubmit={(e) => handleStateUpdate(e, manuscript)}>
                    <label htmlFor="action">Select Action</label>
                    <select
                      id="action"
                      value={selectedAction}
                      onChange={(e) => setSelectedAction(e.target.value)}
                      required
                    >
                      <option value="">Select an action...</option>
                      {validActions.map((action) => (
                        <option key={action.code} value={action.code}>
                          {action.label}
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
          ))
        ) : (
          <div className="no-manuscripts">
            {!searchTitle.trim() ? "No manuscripts found" : null}
          </div>
        )}
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
    email: propTypes.string,
    name: propTypes.string,
  }),
};

export default Submissions;