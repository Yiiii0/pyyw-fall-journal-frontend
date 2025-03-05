import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { updateManuscriptState } from '../../services/manuscriptsAPI';
import './Referee.css';

const REFEREE_ACTIONS = [
  { code: 'SBR', label: 'Submit Review' },
];

function RefereeActionForm({ title, onSuccess, setError, onCancel }) {
  const [action, setAction] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!action) {
      setError('Please select the Referee action.');
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
    <div className="referee-action-form">
      <form onSubmit={handleSubmit}>
        <label htmlFor="referee-action">Referee Action:</label>
        <select
          id="referee-action"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          required
        >
          <option value="">-- Select an action --</option>
          {REFEREE_ACTIONS.map((item) => (
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

RefereeActionForm.propTypes = {
  title: PropTypes.string.isRequired,
  /** Called after a successful action */
  onSuccess: PropTypes.func.isRequired,
  setError: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default RefereeActionForm;
