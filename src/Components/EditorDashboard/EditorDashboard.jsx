import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './EditorDashboard.css';

function EditorDashboard() {
  const [authorized, setAuthorized] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("userData")) || {};
    const email = user.email || "";
    console.log("EditorDashboard email:", email);
    const backendUrl = `http://127.0.0.1:8000/dev/editor_dashboard?email=${encodeURIComponent(email)}`;

    fetch(backendUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
      .then(response => {
        if (!response.ok) {
          return response.text().then(text => {
            throw new Error(`Error: ${text}`);
          });
        }
        return response.json();
      })
      .then(() => {
        setAuthorized(true);
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setError(err.message || "Error connecting to server");
        setAuthorized(false);
      });
  }, []);

  if (authorized === null) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!authorized) {
    return <div>You do not have permission to view this page.</div>;
  }

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
