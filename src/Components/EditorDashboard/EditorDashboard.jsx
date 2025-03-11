import React, { useState, useEffect } from 'react';
import EditorActionForm from '../Editor';
import { useAuth } from '../../contexts/AuthContext';
import { getManuscript } from '../../services/manuscriptsAPI';
import './EditorDashboard.css';

function EditorDashboard() {
  const { currentUser } = useAuth();
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [manuscripts, setManuscripts] = useState([]);
  const [selectedTitle, setSelectedTitle] = useState('');
  const rolesArray = Array.isArray(currentUser?.roles)
  ? currentUser.roles
  : [currentUser.roles];
  const isEditorOrME = rolesArray.some(r => r === 'ED' || r === 'ME');
  if (!isEditorOrME) {
    return <p>Access Denied: You must be an Editor or Managing Editor.</p>;
  }

  useEffect(() => {
    async function fetchAllManuscripts() {
      try {
        const data = await getManuscript();
        let arr = [];
        if (Array.isArray(data)) {
          arr = data;
        } else {
          arr = Object.keys(data).map((key) => data[key]);
        }
        setManuscripts(arr);
      } catch (err) {
        setError(`Failed to load manuscripts: ${err.message}`);
      }
    }
    fetchAllManuscripts();
  }, []);

  const handlePerformAction = () => {
    if (!selectedTitle) {
      setError('Please select a manuscript first.');
      return;
    }
    setError('');
    setShowForm(true);
  };

  return (
    <div className="editor-dashboard-container">
      <h2 className="editor-dashboard-heading">Editor Dashboard</h2>

      {error && <p className="editor-dashboard-error">{error}</p>}

      <div className="editor-dashboard-select-row">
        <label htmlFor="manuscript-select">Select Manuscript:</label>
        <select
          id="manuscript-select"
          value={selectedTitle}
          onChange={(e) => setSelectedTitle(e.target.value)}
        >
          <option value="">-- Select a manuscript --</option>
          {manuscripts.map((m) => (
            <option key={m.title} value={m.title}>
              {m.title}
            </option>
          ))}
        </select>

        <button onClick={handlePerformAction}>Perform Editor Action</button>
      </div>

      {showForm && selectedTitle && (
        <EditorActionForm
          title={selectedTitle}
          onSuccess={() => {
            console.log('Editor action done!');
            setShowForm(false);
          }}
          setError={(errMsg) => setError(errMsg)}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

export default EditorDashboard;
