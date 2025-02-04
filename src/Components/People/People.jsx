import React, { useEffect, useState } from 'react';
import propTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { getPeople, createPerson, deletePerson, updatePerson, addRole, deleteRole } from '../../services/peopleAPI';

function AddPersonForm({
  visible,
  cancel,
  fetchPeople,
  setError,
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [affiliation, setAffiliation] = useState('NYU');
  const [role, setRole] = useState('ED');

  const VALID_ROLES = ['ED', 'AU', 'RE']; // Add all valid roles here

  const changeName = (event) => { setName(event.target.value); };
  const changeEmail = (event) => { setEmail(event.target.value); };
  const changeAffiliation = (event) => { setAffiliation(event.target.value); };
  const changeRole = (event) => { setRole(event.target.value); };

  const addPerson = async (event) => {
    event.preventDefault();
    setError(''); // Clear any previous errors
    
    const newPerson = {
      name,
      email,
      role,
      affiliation,
    };

    try {
      await createPerson(newPerson);
      fetchPeople();
      cancel(); // Hide form after successful creation
    } catch (error) {
      setError(error.message); // Display the error message from the backend
    }
  };

  if (!visible) return null;
  return (
    <form>
      <label htmlFor="name">Name</label>
      <input 
        required 
        type="text" 
        id="name" 
        value={name} 
        onChange={changeName} 
      />
      
      <label htmlFor="email">Email</label>
      <input 
        required 
        type="email" 
        id="email" 
        value={email}
        onChange={changeEmail} 
      />

      <label htmlFor="affiliation">Affiliation</label>
      <input 
        required 
        type="text" 
        id="affiliation" 
        value={affiliation}
        onChange={changeAffiliation} 
      />

      <label htmlFor="role">Role</label>
      <select
        required
        id="role"
        value={role}
        onChange={changeRole}
      >
        {VALID_ROLES.map(role => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>

      <button type="button" onClick={cancel}>Cancel</button>
      <button type="submit" onClick={addPerson}>Submit</button>
    </form>
  );
}
AddPersonForm.propTypes = {
  visible: propTypes.bool.isRequired,
  cancel: propTypes.func.isRequired,
  fetchPeople: propTypes.func.isRequired,
  setError: propTypes.func.isRequired,
};

function ErrorMessage({ message }) {
  return (
    <div className="error-message">
      {message}
    </div>
  );
}
ErrorMessage.propTypes = {
  message: propTypes.string.isRequired,
};

function EditPersonForm({
  person,
  visible,
  cancel,
  fetchPeople,
  setError,
}) {
  const [name, setName] = useState(person.name);
  const [affiliation, setAffiliation] = useState(person.affiliation);
  const [newRole, setNewRole] = useState('');
  
  const VALID_ROLES = ['ED', 'AU', 'RE']; // Same as in AddPersonForm
  
  const changeName = (event) => { setName(event.target.value); };
  const changeAffiliation = (event) => { setAffiliation(event.target.value); };
  const changeNewRole = (event) => { setNewRole(event.target.value); };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await updatePerson(person.email, name, affiliation);
      fetchPeople();
      cancel();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleAddRole = async () => {
    if (!newRole) return;
    
    try {
      await addRole(person.email, newRole);
      fetchPeople();
      setNewRole(''); // Clear the input after successful addition
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDeleteRole = async (roleToDelete) => {
    try {
      await deleteRole(person.email, roleToDelete);
      fetchPeople();
    } catch (error) {
      setError(error.message);
    }
  };

  if (!visible) return null;
  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="edit-name">Name</label>
      <input
        required
        type="text"
        id="edit-name"
        value={name}
        onChange={changeName}
      />

      <label htmlFor="edit-affiliation">Affiliation</label>
      <input
        required
        type="text"
        id="edit-affiliation"
        value={affiliation}
        onChange={changeAffiliation}
      />

      <div className="roles-section">
        <h3>Current Roles</h3>
        <div className="current-roles">
          {Array.isArray(person.roles) && person.roles.map(role => (
            <div key={role} className="role-tag">
              {role}
              <button 
                type="button" 
                onClick={() => handleDeleteRole(role)}
                className="delete-role"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="add-role">
          <select
            id="new-role"
            value={newRole}
            onChange={changeNewRole}
          >
            <option value="">Select a role...</option>
            {VALID_ROLES.map(role => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <button type="button" onClick={handleAddRole}> Add Role</button>
        </div>
      </div>

      <div className="button-group">
        <button type="button" onClick={cancel}>Cancel</button>
        <button type="submit">Save Changes</button>
      </div>
    </form>
  );
}

EditPersonForm.propTypes = {
  person: propTypes.shape({
    name: propTypes.string.isRequired,
    email: propTypes.string.isRequired,
    affiliation: propTypes.string.isRequired,
    roles: propTypes.oneOfType([
      propTypes.string,
      propTypes.arrayOf(propTypes.string)
    ]).isRequired,
  }).isRequired,
  visible: propTypes.bool.isRequired,
  cancel: propTypes.func.isRequired,
  fetchPeople: propTypes.func.isRequired,
  setError: propTypes.func.isRequired,
};

function Person({ person, fetchPeople, setError }) {
  const [isEditing, setIsEditing] = useState(false);
  const { name, email, roles, affiliation } = person;

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await deletePerson(email);
        fetchPeople();
      } catch (error) {
        setError(error.message);
      }
    }
  };

  const showEditForm = () => setIsEditing(true);
  const hideEditForm = () => setIsEditing(false);

  return (
    <div className="person-wrapper">
      <Link to={name}>
        <div className="person-container">
          <div className="person-info">
            <h2>{name}</h2>
            <p>Email: {email}</p>
            <p>Affiliation: {affiliation}</p>
            <p>Roles: {Array.isArray(roles) ? roles.join(', ') : roles}</p>
          </div>
        </div>
      </Link>
      <div className="person-actions">
        <button type="button" onClick={showEditForm}>Edit</button>
        <button type="button" onClick={handleDelete}>Delete</button>
      </div>
      <EditPersonForm
        person={person}
        visible={isEditing}
        cancel={hideEditForm}
        fetchPeople={fetchPeople}
        setError={setError}
      />
    </div>
  );
}

Person.propTypes = {
  person: propTypes.shape({
    name: propTypes.string.isRequired,
    email: propTypes.string.isRequired,
    roles: propTypes.oneOfType([
      propTypes.string,
      propTypes.arrayOf(propTypes.string)
    ]).isRequired,
    affiliation: propTypes.string.isRequired,
  }).isRequired,
  fetchPeople: propTypes.func.isRequired,
  setError: propTypes.func.isRequired,
};

function peopleObjectToArray(Data) {
  const keys = Object.keys(Data);
  const people = keys.map((key) => Data[key]);
  return people;
}

function People() {
  const [error, setError] = useState('');
  const [people, setPeople] = useState([]);
  const [addingPerson, setAddingPerson] = useState(false);

  const fetchPeople = async () => {
    try {
      const data = await getPeople();
      setPeople(peopleObjectToArray(data));
    } catch (error) {
      setError(`There was a problem retrieving the list of people: ${error.message}`);
    }
  };

  const showAddPersonForm = () => { setAddingPerson(true); };
  const hideAddPersonForm = () => { setAddingPerson(false); };

  useEffect(() => {
    fetchPeople();
  }, []);

  return (
    <div className="wrapper">
      <header>
        <h1>
          View All People
        </h1>
        <button type="button" onClick={showAddPersonForm}>
          Add a Person
        </button>
      </header>
      <AddPersonForm
        visible={addingPerson}
        cancel={hideAddPersonForm}
        fetchPeople={fetchPeople}
        setError={setError}
      />
      {error && <ErrorMessage message={error} />}
      {people.map((person) => (
        <Person
          key={person.email}
          person={person}
          fetchPeople={fetchPeople}
          setError={setError}
        />
      ))}
    </div>
  );
}

export default People;
