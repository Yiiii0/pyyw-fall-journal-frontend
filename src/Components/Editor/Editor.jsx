import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { updateManuscriptState } from '../../services/manuscriptsAPI';
import './Editor.css';

const EDITOR_ACTIONS = [
  { code: 'EDITOR_REJECT_SUB', label: 'Reject (Submitted → Rejected)' },
  { code: 'EDITOR_ASSIGN_REF', label: 'Assign new referee (Submitted → Referee Review)' },
  { code: 'EDITOR_REJECT_REV', label: 'Reject (Referee Review → Rejected)' },
  { code: 'EDITOR_ACCEPT_REV_WITH_REVISIONS', label: 'Accept w/ Revisions (Ref Rev → Author Revisions)' },
  { code: 'EDITOR_ACCEPT_REV', label: 'Accept (Referee Review → Copy Edit)' },
  { code: 'EDITOR_DONE_ARV', label: 'Done (Author Revisions → Editor Review)' },
  { code: 'EDITOR_ACCEPT_EDR', label: 'Accept (Editor Review → Copy Edit)' },
  { code: 'EDITOR_DONE_CED', label: 'Done (Copy Edit → Author Review)' },
  { code: 'EDITOR_DONE_AUR', label: 'Done (Author Review → Formatting)' },
  { code: 'EDITOR_DONE_FMT', label: 'Done (Formatting → Published)' },
  { code: 'EDITOR_REMOVE_REF', label: 'Remove referee (Ref Rev → Submitted)' },
];

function EditorActionForm({
  title,
  onSuccess,
  setError,
  onCancel,
}) {
  const [selectedAction, setSelectedAction] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedAction) {
      setError('Please select an Editor action.');
      return;
    }

    try {
      await updateManuscriptState(title, selectedAction);
      onSuccess();
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="editor-action-form">
      <form onSubmit={handleSubmit}>
        <label htmlFor="editor-action">Editor Action (Red Arrows):</label>
        <select
          id="editor-action"
          value={selectedAction}
          onChange={(e) => setSelectedAction(e.target.value)}
          required
        >
          <option value="">-- Select an action --</option>
          {EDITOR_ACTIONS.map((item) => (
            <option key={item.code} value={item.code}>
              {item.label}
            </option>
          ))}
        </select>

        <div className="button-group">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit">Apply Action</button>
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
