import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { updateManuscriptState } from '../../services/manuscriptsAPI';

function RefereeActionForm({ title, action, currentReferee, onSuccess, setError, onCancel }) {
  const [refereeEmail, setRefereeEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!refereeEmail.trim()) {
      setError('Referee email is required');
      return;
    }
    try {
      if (action === 'ARF' && currentReferee) {
        await updateManuscriptState(title, 'DRF', { referee: currentReferee });
      }
      await updateManuscriptState(title, action, { referee: refereeEmail });
      onSuccess();
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="referee-action-form">
      <form onSubmit={handleSubmit}>
        <label htmlFor="referee-email">Referee Email:</label>
        <input
          type="email"
          id="referee-email"
          value={refereeEmail}
          onChange={(e) => setRefereeEmail(e.target.value)}
          required
        />
        <div className="button-group">
          <button type="button" onClick={onCancel}>Cancel</button>
          <button type="submit">Apply Action</button>
        </div>
      </form>
    </div>
  );
}

RefereeActionForm.propTypes = {
  title: PropTypes.string.isRequired,
  action: PropTypes.oneOf(['ARF', 'DRF']).isRequired,
  currentReferee: PropTypes.string,
  onSuccess: PropTypes.func.isRequired,
  setError: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default RefereeActionForm;
