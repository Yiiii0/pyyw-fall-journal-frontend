import React, { useEffect, useState } from 'react';
import propTypes from 'prop-types';

import { getManuscript, getManuscriptsByTitle } from '../../services/manuscriptsAPI';
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

function Manuscripts() {
  const [error, setError] = useState('');
  const [manuscripts, setManuscripts] = useState([]);
  const [searchTitle, setSearchTitle] = useState('');

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

  const handleSearch = async () => {
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

  useEffect(() => {
    console.log('Manuscripts component mounted');
    fetchManuscripts();
  }, []);

  return (
    <div className="wrapper">
      <header>
        <h1>View All Manuscripts</h1>
        <input
          type="text"
          placeholder="Search by title..."
          value={searchTitle}
          onChange={(e) => setSearchTitle(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
      </header>
      {error && <ErrorMessage message={error} />}
      <ul>
        {manuscripts.map((manuscript, index) => (
          <li key={manuscript.title || index}>
            <strong>Title:</strong> {manuscript.title} <br />
            <strong>Author:</strong> {manuscript.author} <br />
            <strong>Author Email:</strong> {manuscript.author_email} <br />
            <strong>State:</strong> {manuscript.state} <br />
            <strong>Referees:</strong> {manuscript.referees && manuscript.referees.length > 0 ? manuscript.referees.join(', ') : 'None'} <br />
            <strong>Text:</strong> {manuscript.text} <br />
            <strong>Abstract:</strong> {manuscript.abstract} <br />
            <strong>History:</strong> {manuscript.history && manuscript.history.length > 0 ? manuscript.history.join(', ') : 'No history'} <br />
            <strong>Editor Email:</strong> {manuscript.editor_email} <br />
            <hr />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Manuscripts;
