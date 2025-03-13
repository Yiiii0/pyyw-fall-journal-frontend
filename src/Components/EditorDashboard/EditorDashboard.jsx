import React from 'react';
import { Link } from 'react-router-dom';
import './EditorDashboard.css';

function EditorDashboard() {
  return (
    <div className="editor-dashboard-container">
      <h2 className="editor-dashboard-heading">Editor Dashboard</h2>

      {/* Two link-buttons for navigation */}
      <div className="editor-dashboard-links">
        <Link to="/manuscripts" className="editor-dashboard-link">
          Go to Manuscripts
        </Link>
        <Link to="/people" className="editor-dashboard-link">
          Go to People
        </Link>
      </div>
    </div>
  );
}

export default EditorDashboard;
