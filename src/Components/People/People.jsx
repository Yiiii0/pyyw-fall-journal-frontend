import React, { useEffect, useState } from 'react';
import propTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { getPeople, createPerson } from '../../services/peopleAPI';

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

  const changeName = (event) => { setName(event.target.value); };
  const changeEmail = (event) => { setEmail(event.target.value); };
  const changeAffiliation = (event) => { setAffiliation(event.target.value); };
  const changeRole = (event) => { setRole(event.target.value); };

  const addPerson = async (event) => {
    event.preventDefault();
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
      setError(`There was a problem adding the person: ${error.message}`);
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
      <input 
        required 
        type="text" 
        id="role" 
        value={role}
        onChange={changeRole} 
      />

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

function Person({ person }) {
  const { name, email, roles, affiliation } = person;
  return (
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
      {people.map((person) => <Person key={person.name} person={person} />)}
    </div>
  );
}

export default People;
