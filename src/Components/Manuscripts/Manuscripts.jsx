import React, { useEffect, useState } from 'react';
import propTypes from 'prop-types';

import { getManuscript } from '../../services/manuscriptsAPI';

// import './Manuscripts.css';

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


function ManuscriptsObjectToArray(Data) {
  const keys = Object.keys(Data);
  const manuscripts = keys.map((key) => Data[key]);
  return manuscripts;
}

function Manuscripts() {
  const [error, setError] = useState('');
  const [manuscripts, setManuscripts] = useState([]);

  const fetchManuscripts = async () => {
    try {
      const data = await getManuscript();
      setManuscripts(ManuscriptsObjectToArray(data));
    } catch (err) {
      setError(`There was a problem retrieving the list of manuscripts. ${error}`);
    }
  };

  useEffect(() => {
    fetchManuscripts();
  }, []);

  return (
    <div className="wrapper">
      <header>
        <h1>View All Manuscripts</h1>
      </header>
      {error && <ErrorMessage message={error} />}
      <ul>
        {manuscripts.map((manuscript) => (
          <li key={manuscript.id}>
            <strong>Title:</strong> {manuscript.title} <br />
            <strong>Author:</strong> {manuscript.author} <br />
            <strong>Author Email:</strong> {manuscript.author_email} <br />
            <strong>State:</strong> {manuscript.state} <br />
            <strong>Referees:</strong> {manuscript.referees.length > 0 ? manuscript.referees.join(', ') : 'None'} <br />
            <strong>Text:</strong> {manuscript.text} <br />
            <strong>Abstract:</strong> {manuscript.abstract} <br />
            <strong>History:</strong> {manuscript.history.join(', ')} <br />
            <strong>Editor Email:</strong> {manuscript.editor_email} <br />
            <hr />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Manuscripts;