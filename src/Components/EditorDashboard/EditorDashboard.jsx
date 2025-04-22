import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './EditorDashboard.css';

const EditorDashboard = () => {
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        const userData = localStorage.getItem("userData");
        if (!userData) {
          setError("No user data found");
          return;
        }

        const { email } = JSON.parse(userData);
        const response = await fetch(`http://127.0.0.1:8000/dev/editor_dashboard?email=${encodeURIComponent(email)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          await response.json();
          setAuthorized(true);
          setError(null);
        } else {
          const errorData = await response.json();
          setAuthorized(false);
          setError(errorData.error || "You do not have permission to view this page");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setAuthorized(false);
        setError("An error occurred while checking authorization");
      }
    };

    checkAuthorization();
  }, []);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!authorized) {
    return <div>Loading...</div>;
  }

  return (
    <div className="editor-dashboard">
      <h1>Editor Dashboard</h1>
      <nav>
        <ul>
          <li>
            <Link to="/manuscripts">Manuscripts</Link>
          </li>
          <li>
            <Link to="/people">People</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default EditorDashboard;
