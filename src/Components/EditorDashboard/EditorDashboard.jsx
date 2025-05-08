import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getText, updateText } from '../../services/textAPI';
import { useAuth } from '../../contexts/AuthContext';
import './EditorDashboard.css';

const EditorDashboard = () => {
  const { currentUser } = useAuth();
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState(null);
  const [websiteTitle, setWebsiteTitle] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');

  // New state for static page editing
  const [isEditingStaticPage, setIsEditingStaticPage] = useState(false);
  const [selectedStaticPage, setSelectedStaticPage] = useState("home");
  const [staticPageTitle, setStaticPageTitle] = useState("");
  const [staticPageText, setStaticPageText] = useState("");

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

    const fetchWebsiteTitle = async () => {
      try {
        const data = await getText('title');
        // Assuming data.text contains the website title.
        setWebsiteTitle(data.text);
        setTitleInput(data.text);
      } catch (err) {
        console.error("Failed to fetch website title:", err);
      }
    };

    checkAuthorization();
    fetchWebsiteTitle();
  }, []);

  const handleEditClick = () => {
    setEditingTitle(true);
  };

  const handleCancelEdit = () => {
    setTitleInput(websiteTitle);
    setEditingTitle(false);
  };

  const handleSaveTitle = async () => {
    try {
      await updateText({
        pageNumber: 'title',
        title: 'Journal System',
        text: titleInput
      }, currentUser.email);
      setWebsiteTitle(titleInput);
      setEditingTitle(false);
      window.location.reload();
    } catch (err) {
      console.error("Error updating title:", err);
      setError(err.message);
    }
  };

  // --- New functions for static page editing ---
  const fetchStaticPageData = async (page) => {
    try {
      const data = await getText(page);
      setStaticPageTitle(data.title || "");
      setStaticPageText(data.text || "");
    } catch (err) {
      console.error("Failed to fetch static page data:", err);
    }
  };

  const handleEditStaticPageClick = () => {
    setIsEditingStaticPage(true);
    fetchStaticPageData("home");
    setSelectedStaticPage("home");
  };

  const handleStaticPageChange = (e) => {
    const page = e.target.value;
    setSelectedStaticPage(page);
    fetchStaticPageData(page);
  };

  const handleCancelStaticEdit = () => {
    setIsEditingStaticPage(false);
    setStaticPageTitle("");
    setStaticPageText("");
  };

  const handleSaveStaticEdit = async () => {
    try {
      await updateText({
        pageNumber: selectedStaticPage,
        title: staticPageTitle,
        text: staticPageText
      }, currentUser.email);
      setIsEditingStaticPage(false);
      window.location.reload();
    } catch (err) {
      console.error("Error updating static page:", err);
      setError(err.message);
    }
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!authorized) {
    return <div>Loading...</div>;
  }

  return (
    <div className="editor-dashboard-container">
      <div className="editor-dashboard-heading">
        <h2>Editor Dashboard</h2>
      </div>
      <nav>
        <div className="button-group">
          <Link to="/manuscripts" className="dashboard-button">Manuscripts</Link>
          <Link to="/people" className="dashboard-button">People</Link>
          <button 
            type="button" 
            className="dashboard-button edit-title-button"
            onClick={handleEditClick}
          >
            Edit Journal Title
          </button>
          <button 
            type="button" 
            className="dashboard-button edit-static-button"
            onClick={handleEditStaticPageClick}
          >
            Edit Static Page
          </button>
        </div>
      </nav>

      {editingTitle && (
        <div className="title-edit-form">
          <label htmlFor="websiteTitle">Website Title:</label>
          <input 
            type="text" 
            id="websiteTitle" 
            value={titleInput} 
            onChange={(e) => setTitleInput(e.target.value)}
          />
          <div className="form-button-group">
            <button type="button" onClick={handleSaveTitle}>Save</button>
            <button type="button" onClick={handleCancelEdit}>Cancel</button>
          </div>
        </div>
      )}

      {isEditingStaticPage && (
        <div className="static-page-edit-form">
          <label htmlFor="static-page-select">Select Static Page:</label>
          <select id="static-page-select" value={selectedStaticPage} onChange={handleStaticPageChange}>
            <option value="home">Home</option>
            <option value="about">About</option>
            <option value="submissionGuideline">Submission Guideline</option>
          </select>
          <div className="static-page-fields">
            <label htmlFor="staticPageTitle">Page Title:</label>
            <input 
              type="text" 
              id="staticPageTitle" 
              value={staticPageTitle} 
              onChange={(e) => setStaticPageTitle(e.target.value)}
            />
            <label htmlFor="staticPageText">Page Text:</label>
            <textarea 
              id="staticPageText" 
              value={staticPageText}
              onChange={(e) => setStaticPageText(e.target.value)}
            />
          </div>
          <div className="form-button-group">
            <button type="button" onClick={handleSaveStaticEdit}>Save</button>
            <button type="button" onClick={handleCancelStaticEdit}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorDashboard;