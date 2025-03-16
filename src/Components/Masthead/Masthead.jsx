import React, { useState, useEffect } from 'react';
import './Masthead.css';
import { getMasthead } from '../../services/mastheadAPI';

function Masthead() {
    const [mastheadData, setMastheadData] = useState({
        "Editor": [],
        "Managing Editor": [],
        "Consulting Editor": []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchMastheadData() {
            try {
                const data = await getMasthead();
                if (data && data.Masthead) {
                    setMastheadData(data.Masthead);
                }
            } catch (error) {
                console.error("Error fetching masthead data:", error);
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
                    <section className="editor-section">
                        <h2>Editors</h2>
                        <div className="editor-list">
                            {mastheadData["Editor"] && mastheadData["Editor"].length > 0 ? (
                                mastheadData["Editor"].map((editor, index) => (
                                    <div className="editor-item" key={index}>
                                        <h3>{editor.name} {editor.role && <span className="editor-role">({editor.role})</span>}</h3>
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
                        <div className="editor-list">
                            {mastheadData["Managing Editor"] && mastheadData["Managing Editor"].length > 0 ? (
                                mastheadData["Managing Editor"].map((editor, index) => (
                                    <div className="editor-item" key={index}>
                                        <h3>{editor.name} {editor.role && <span className="editor-role">({editor.role})</span>}</h3>
                                        <p>{editor.affiliation}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="no-editors">No managing editors available</p>
                            )}
                        </div>
                    </section>

                    <section className="editor-section">
                        <h2>Consulting Editors</h2>
                        <div className="editor-list consulting-editors">
                            {mastheadData["Consulting Editor"] && mastheadData["Consulting Editor"].length > 0 ? (
                                mastheadData["Consulting Editor"].map((editor, index) => (
                                    <div className="editor-item" key={index}>
                                        <h3>{editor.name}</h3>
                                        <p>{editor.affiliation}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="no-editors">No consulting editors available</p>
                            )}
                        </div>
                    </section>

                    <section className="editor-notes">
                        <p>* Executive committee</p>
                    </section>
                </>
            )}
        </div>
    );
}

export default Masthead;