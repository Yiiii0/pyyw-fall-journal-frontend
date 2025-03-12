import React from 'react';
import './Masthead.css';

function Masthead() {
    return (
        <div className="masthead-container">
            <h1>Masthead</h1>

            <section className="editor-section">
                <h2>Honorary Founding Editors</h2>
                <div className="editor-list">
                    <div className="editor-item">
                        <h3>Test data</h3>
                        <p>New York University, United States</p>
                    </div>

                    <div className="editor-item">
                        <h3>Yixxxx Wang</h3>
                        <p>Meta College, United States</p>
                    </div>
                </div>
            </section>

            <section className="editor-section">
                <h2>Editors</h2>
                <div className="editor-list">
                    <div className="editor-item">
                        <h3>Michael Williams <span className="editor-role">(managing editor)</span></h3>
                        <p>Central University</p>
                    </div>

                    <div className="editor-item">
                        <h3>Sarah Davis <span className="editor-role">(deputy editor)</span></h3>
                        <p>Northern Institute</p>
                    </div>
                </div>
            </section>

            <section className="editor-section">
                <h2>Consulting Editors</h2>
                <div className="editor-list consulting-editors">
                    <div className="editor-item">
                        <h3>Test Brown</h3>
                        <p>California University</p>
                    </div>

                    <div className="editor-item">
                        <h3>Jennifer White</h3>
                        <p>Western Academy</p>
                    </div>
                </div>
            </section>

            <section className="editor-section delineated">
                <div className="editor-list">
                    <div className="editor-item">
                        <h3>ABC Green†</h3>
                        <p>Eastern College</p>
                    </div>

                    <div className="editor-item">
                        <h3>ABC ABC</h3>
                        <p>ABC University</p>
                    </div>
                </div>
            </section>

            <section className="editor-notes">
                <p>* Executive committee</p>
            </section>
        </div>
    );
}

export default Masthead;