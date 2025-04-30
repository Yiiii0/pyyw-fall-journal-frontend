import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updatePerson, getPerson } from '../../services/peopleAPI';
import './Profile.css';

function Profile() {
  const { currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    affiliation: '',
    bio: ''
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser?.email) {
        try {
          const data = await getPerson(currentUser.email);
          setUserData(data);
          setFormData({
            name: data.name || '',
            affiliation: data.affiliation || '',
            bio: data.bio || ''
          });
        } catch (err) {
          setError(err.message);
        }
      }
    };
    fetchUserData();
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updatePerson(currentUser.email, formData.name, formData.affiliation, formData.bio);
      const updatedData = await getPerson(currentUser.email);
      setUserData(updatedData);
      setIsEditing(false);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  if (!currentUser) {
    return <div className="profile-container">Please log in to view your profile.</div>;
  }

  return (
    <div className="profile-container">
      <h1>My Profile</h1>
      {error && <div className="error-message">{error}</div>}
      
      {isEditing ? (
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="affiliation">Affiliation</label>
            <input
              type="text"
              id="affiliation"
              name="affiliation"
              value={formData.affiliation}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows="4"
            />
          </div>
          <div className="button-group">
            <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
            <button type="submit">Save Changes</button>
          </div>
        </form>
      ) : (
        <div className="profile-info">
          <div className="info-group">
            <h2>Email</h2>
            <p>{userData?.email || 'Not specified'}</p>
          </div>
          <div className="info-group">
            <h2>Name</h2>
            <p>{userData?.name || 'Not specified'}</p>
          </div>
          <div className="info-group">
            <h2>Affiliation</h2>
            <p>{userData?.affiliation || 'Not specified'}</p>
          </div>
          <div className="info-group">
            <h2>Roles</h2>
            <p>{Array.isArray(userData?.roles) ? userData.roles.join(', ') : 'No roles assigned'}</p>
          </div>
          <div className="info-group">
            <h2>Bio</h2>
            <p>{userData?.bio || 'No bio provided'}</p>
          </div>
          <button onClick={() => setIsEditing(true)} className="edit-button">Edit Profile</button>
        </div>
      )}
    </div>
  );
}

export default Profile;
