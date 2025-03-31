import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { updateManuscriptState, getEditorActions } from '../../services/manuscriptsAPI';
import './EditorActionForm.css';

function EditorActionForm({
  title,
  onSuccess,
  setError,
  onCancel,
}) {
  const [action, setAction] = useState('');
  const [editorActions, setEditorActions] = useState([]);

  useEffect(() => {
    const fetchEditorActions = async () => {
      try {
        const actions = await getEditorActions();
        setEditorActions(actions);
      } catch (error) {
        setError(error.message);
      }
    };
    fetchEditorActions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!action) {
      setError('Please select an Editor action.');
      return;
    }

    try {
      await updateManuscriptState(title, action);
      onSuccess();
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="editor-action-form">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="action">Action:</label>
          <select
            id="action"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            required
          >
            <option value="">Select an action...</option>
            {editorActions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>
        {setError && <div className="error">{setError}</div>}
        <div className="button-group">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit">Submit</button>
        </div>
      </form>
    </div>
  );
}

EditorActionForm.propTypes = {
  title: PropTypes.string.isRequired,
  onSuccess: PropTypes.func.isRequired,
  setError: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default EditorActionForm;
