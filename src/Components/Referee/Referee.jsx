import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { updateManuscriptState, getRefereeActions } from '../../services/manuscriptsAPI';
import './Referee.css';

const RefereeActionForm = ({ manuscript, onSubmit, onCancel }) => {
  const [action, setAction] = useState('');
  const [refereeActions, setRefereeActions] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRefereeActions = async () => {
      try {
        const actions = await getRefereeActions();
        setRefereeActions(actions);
      } catch (error) {
        setError(error.message);
      }
    };
    fetchRefereeActions();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(action);
  };

  return (
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
          {refereeActions.map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
        </select>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="button-group">
        <button type="button" onClick={onCancel}>Cancel</button>
        <button type="submit">Submit</button>
      </div>
    </form>
  );
};

RefereeActionForm.propTypes = {
  manuscript: PropTypes.string.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default RefereeActionForm;
