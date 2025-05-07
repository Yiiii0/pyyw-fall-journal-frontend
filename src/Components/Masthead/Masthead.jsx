/* Masthead.jsx */
import React, { useState, useEffect } from 'react';
import './Masthead.css';
import { getMasthead } from '../../services/mastheadAPI';

function Masthead() {
  const [mastheadData, setMastheadData] = useState({
    Editor: [],
    'Managing Editor': [],
    'Consulting Editor': []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMastheadData() {
      try {
        const data = await getMasthead();
        if (data?.Masthead) {
          setMastheadData(data.Masthead);
        }
      } catch (error) {
        console.error('Error fetching masthead data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMastheadData();
  }, []);

  return (
    <div className="masthead-container">
      <h1>Masthead</h1>
      {loading ? (
        <p>Loading masthead data...</p>
      ) : (
        <>
          <p className="masthead-intro">
            Our Masthead comprises the editorial leadership who guide the journal’s vision,
            ensure scholarly standards, and manage the publication process.
          </p>

          <section className="editor-section">
            <h2>Editors</h2>
            <p className="editor-description">
              Editors are responsible for manuscript selection, peer review coordination,
              and ensuring scientific rigor across all submissions.
            </p>
            <div className="editor-list">
              {mastheadData.Editor.length > 0 ? (
                mastheadData.Editor.map((editor, idx) => (
                  <div className="editor-item" key={idx}>
                    <h3>
                      {editor.name}{' '}
                      {editor.role && <span className="editor-role">({editor.role})</span>}
                    </h3>
                    <p>{editor.affiliation}</p>
                  </div>
                ))
              ) : (
                <p className="no-editors">No editors available</p>
              )}
            </div>
          </section>

          <section className="editor-section">
            <h2>Managing Editors</h2>
            <p className="editor-description">
              Managing Editors handle daily operations, communicate with authors, and oversee
              the publication workflow to ensure timely releases.
            </p>
            <div className="editor-list">
              {mastheadData['Managing Editor'].length > 0 ? (
                mastheadData['Managing Editor'].map((editor, idx) => (
                  <div className="editor-item" key={idx}>
                    <h3>
                      {editor.name}{' '}
                      {editor.role && <span className="editor-role">({editor.role})</span>}
                    </h3>
                    <p>{editor.affiliation}</p>
                  </div>
                ))
              ) : (
                <p className="no-editors">No managing editors available</p>
              )}
            </div>
          </section>

          <section className="editor-section consulting-editors">
            <h2>Consulting Editors</h2>
            <p className="editor-description">
              Consulting Editors provide expert advice on specialized topics and assist in guest
              issues or thematic editions.
            </p>
            <div className="editor-list">
              {mastheadData['Consulting Editor'].length > 0 ? (
                mastheadData['Consulting Editor'].map((editor, idx) => (
                  <div className="editor-item" key={idx}>
                    <h3>{editor.name}</h3>
                    <p>{editor.affiliation}</p>
                  </div>
                ))
              ) : (
                <p className="no-editors">No consulting editors available</p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default Masthead;
