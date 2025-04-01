import React from 'react';
import { Link } from 'react-router-dom';
import './EditorDashboard.css';

function EditorDashboard() {
  return (
    <div className="editor-dashboard-container">
      <h2 className="editor-dashboard-heading">Editor Dashboard</h2>
      <ul className="editor-dashboard-links">
        <li>
          <Link to="/manuscripts" className="editor-dashboard-link">
            Manuscripts
          </Link>
        </li>
        <li>
          <Link to="/people" className="editor-dashboard-link">
            People
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default EditorDashboard;
