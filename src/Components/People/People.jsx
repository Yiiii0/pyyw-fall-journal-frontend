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
  const [people, setPeople] = useState([]);
  const [error, setError] = useState('');
  const [addingPerson, setAddingPerson] = useState(false);
  
  // Add new state for search and sort
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('name'); // 'name' or 'email'
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedRole, setSelectedRole] = useState(''); // Add state for role filter

  const VALID_ROLES = ['ED', 'AU', 'RE']; // Define valid roles
  const ROLE_LABELS = {
    'ED': 'Editor',
    'AU': 'Author',
    'RE': 'Reviewer'
  };

  const fetchPeople = async () => {
    try {
      const data = await getPeople();
      setPeople(peopleObjectToArray(data));
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  const showAddPersonForm = () => { setAddingPerson(true); };
  const hideAddPersonForm = () => { setAddingPerson(false); };

  // Filter and sort functions
  const filterPeople = (peopleList) => {
    return peopleList.filter(person => {
      // First apply search filter
      const searchValue = searchQuery.toLowerCase();
      const matchesSearch = searchField === 'name' 
        ? person.name.toLowerCase().includes(searchValue)
        : person.email.toLowerCase().includes(searchValue);

      // Then apply role filter
      const matchesRole = selectedRole === '' || (Array.isArray(person.roles) && person.roles.includes(selectedRole));

      return matchesSearch && matchesRole;
    });
  };

  const sortPeople = (peopleList) => {
    return [...peopleList].sort((a, b) => {
      let valueA = a[sortField];
      let valueB = b[sortField];
      
      // Handle roles array for sorting
      if (sortField === 'role') {
        valueA = a.roles.join(',');
        valueB = b.roles.join(',');
      }

      if (sortDirection === 'asc') {
        return valueA.localeCompare(valueB);
      } else {
        return valueB.localeCompare(valueA);
      }
    });
  };

  const handleSortChange = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault(); // Prevent form submission
    // The search is already implemented in filterPeople
    // This is just to provide better UX with a search button
  };

  const filteredAndSortedPeople = sortPeople(filterPeople(people));

  return (
    <div className="people-container">
      <h1>People</h1>
      {error && <ErrorMessage message={error} />}
      
      {/* Search and Sort Controls */}
      <div className="controls">
        <div className="controls-group">
          <form className="search-controls" onSubmit={handleSearch}>
            <div className="search-input-group">
              <input
                type="text"
                placeholder={`Search by ${searchField}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select
                value={searchField}
                onChange={(e) => setSearchField(e.target.value)}
              >
                <option value="name">Name</option>
                <option value="email">Email</option>
              </select>
              <button type="submit" className="search-button">
                Search
              </button>
            </div>
          </form>

          <div className="role-filter">
            <label htmlFor="role-filter">Filter by Role:</label>
            <select
              id="role-filter"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="">All Roles</option>
              {VALID_ROLES.map(role => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="sort-controls">
          <button
            onClick={() => handleSortChange('role')}
            className={sortField === 'role' ? 'active' : ''}
          >
            Sort by Role {sortField === 'role' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSortChange('affiliation')}
            className={sortField === 'affiliation' ? 'active' : ''}
          >
            Sort by Affiliation {sortField === 'affiliation' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      <button type="button" onClick={showAddPersonForm}>Add Person</button>
      <AddPersonForm
        visible={addingPerson}
        cancel={hideAddPersonForm}
        fetchPeople={fetchPeople}
        setError={setError}
      />
      
      <div className="people-list">
        {filteredAndSortedPeople.map((person) => (
          <Person
            key={person.email}
            person={person}
            fetchPeople={fetchPeople}
            setError={setError}
          />
        ))}
      </div>
    </div>
  );
}

export default People;
