import React, { useEffect, useState } from 'react';
import propTypes from 'prop-types';

import { 
  getManuscript, 
  getManuscriptsByTitle, 
  getTextPages
} from '../../services/manuscriptsAPI';
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

function TextPages({ pages }) { // eslint-disable-line no-unused-vars
  if (!pages || pages.length === 0) {
    return (
      <div className="no-text-pages">
        <p>No text pages available</p>
      </div>
    );
  }

  // Sort pages by page number
  const sortedPages = [...pages].sort((a, b) => {
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
    <div className="text-pages">
      <div className="text-pages-header">
        <h3>Text Pages</h3>
      </div>
      <div className="pages-container">
        {sortedPages.map((page) => (
          <div key={page.pageNumber} className="text-page">
            <div className="text-page-header">
              <h4>{page.title}</h4>
            </div>
            <div className="page-number">Page {page.pageNumber}</div>
            <div className="page-content">{page.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

TextPages.propTypes = {
  pages: propTypes.arrayOf(
    propTypes.shape({
      pageNumber: propTypes.string.isRequired,
      title: propTypes.string.isRequired,
      text: propTypes.string.isRequired,
    })
  ).isRequired,
  manuscriptId: propTypes.string.isRequired,
};

function Manuscripts() {
  const [manuscripts, setManuscripts] = useState([]);
  const [expandedManuscript, setExpandedManuscript] = useState(null);
  const [manuscriptTextPages, setManuscriptTextPages] = useState({});
  const [textPageErrors, setTextPageErrors] = useState({});
  const [searchTitle, setSearchTitle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchManuscripts = async () => {
    try {
      setLoading(true);
      const data = await getManuscript();
      // Convert data to array if necessary
      const manuscriptsArray = Array.isArray(data)
        ? data
        : ManuscriptsObjectToArray(data);
      setManuscripts(manuscriptsArray);
      setError('');
    } catch (err) {
      setError(`There was a problem retrieving manuscripts: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchTextPages = async (manuscriptId) => {
    try {
      const pages = await getTextPages(manuscriptId);
      
      // Map the pages to the expected format
      const formattedPages = pages.map(page => ({
        ...page,
        pageNumber: page.pageNumber
      }));
      
      setManuscriptTextPages(prev => ({
        ...prev,
        [manuscriptId]: formattedPages
      }));
      
      // Clear any previous errors for this manuscript
      setTextPageErrors(prev => ({
        ...prev,
        [manuscriptId]: null
      }));
    } catch (err) {
      console.error(`Error fetching text pages for manuscript ${manuscriptId}:`, err);
      setTextPageErrors(prev => ({
        ...prev,
        [manuscriptId]: `Failed to load text pages: ${err.message}`
      }));
    }
  };

  const handleSearch = async () => {
    if (!searchTitle.trim()) {
      fetchManuscripts();
      return;
    }
    try {
      setLoading(true);
      const data = await getManuscriptsByTitle(searchTitle);
      // Convert data to array if necessary
      const manuscriptsArray = Array.isArray(data)
        ? data
        : ManuscriptsObjectToArray(data);
      setManuscripts(manuscriptsArray);
      setError('');
    } catch (err) {
      setError(`There was a problem retrieving the manuscript with title "${searchTitle}". ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleManuscriptExpansion = async (manuscriptId) => {
    if (expandedManuscript === manuscriptId) {
      setExpandedManuscript(null);
    } else {
      setExpandedManuscript(manuscriptId);
      if (!manuscriptTextPages[manuscriptId]) {
        await fetchTextPages(manuscriptId);
      }
    }
  };

  useEffect(() => {
    console.log('Manuscripts component mounted');
    fetchManuscripts();
  }, []);

  return (
    <div className="wrapper">
      <header>
        <h1>View All Manuscripts</h1>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by title..."
            value={searchTitle}
            onChange={(e) => setSearchTitle(e.target.value)}
          />
          <button onClick={handleSearch} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </header>
      {error && <ErrorMessage message={error} />}
      
      {loading ? (
        <div className="loading-manuscripts">Loading manuscripts...</div>
      ) : manuscripts.length === 0 ? (
        <div className="no-manuscripts">No manuscripts found</div>
      ) : (
        <ul className="manuscripts-list">
          {manuscripts.map((manuscript) => (
            <li key={manuscript._id} className="manuscript-item">
              <div className="manuscript-header" onClick={() => toggleManuscriptExpansion(manuscript._id)}>
                <h2>{manuscript.title}</h2>
                <span className="expand-icon">{expandedManuscript === manuscript._id ? '▼' : '►'}</span>
              </div>
              <div className="manuscript-details">
                <strong>Author:</strong> {manuscript.author} <br />
                <strong>Author Email:</strong> {manuscript.author_email} <br />
                <strong>State:</strong> {manuscript.state} <br />
                <strong>Referees:</strong> {manuscript.referees && manuscript.referees.length > 0 ? manuscript.referees.join(', ') : 'None'} <br />
                <strong>Abstract:</strong> {manuscript.abstract} <br />
                <strong>History:</strong> {manuscript.history && manuscript.history.length > 0 ? manuscript.history.join(', ') : 'No history'} <br />
                <strong>Editor Email:</strong> {manuscript.editor_email} <br />
              </div>
              {expandedManuscript === manuscript._id && (
                <div className="manuscript-text-pages">
                  {textPageErrors[manuscript._id] ? (
                    <ErrorMessage message={textPageErrors[manuscript._id]} />
                  ) : manuscriptTextPages[manuscript._id] ? (
                    <TextPages 
                      pages={manuscriptTextPages[manuscript._id]} 
                      manuscriptId={manuscript._id}
                    />
                  ) : (
                    <div className="loading-text-pages">Loading text pages...</div>
                  )}
                </div>
              )}
              <hr />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Manuscripts;
