# Journal Management System 
## Progress

### General Features
- Implemented endpoints:
  - Retrieve journal title.
  - Retrieve a journal’s masthead.

---

## People

### Roles and Characteristics
- Types of people associated with a journal:
  - Editors
  - Authors
  - Referees
  - Managing Editors
  - Copy Editors
  - Typesetters
- A person can have multiple roles.
- Each person has the following fields:
  - Name
  - Affiliation
  - Email address

### Endpoints for People Management
- Manage journal-related people:
  - Add, update, and delete people or their roles.
  - Retrieve the journal’s masthead.
  - Fetch details by email.
- Assign new roles to people.
- Create new people.
- Delete people.
- Data layer support for people management.

---

## Roles

### Features
- Each person can have multiple roles, stored as a list.
- A dedicated module ensures the validity of roles.
- Validation process:
  - Every role added or updated for a person is checked against the roles module.

---

## Text

### Endpoints
- Create new text.
- Read existing text.
- Update text.
- Delete text.

### Text Fields
- `PageNumber`
- `Title`
- `Text`

### Additional Features
- Data layer support for text management.

---

## Manuscripts

### Workflow
- Manuscripts follow a workflow outlined in the [Manuscript FSM Chart](https://github.com/AthenaKouKou/journal/blob/main/docs/Manuscript_FSM.jpg).

### Endpoints
- Retrieve all manuscripts.
- Add a new manuscript.
- Update manuscript information.
- Retrieve a manuscript by title.
- Delete a manuscript by title.

---

## Goals

### Fully Functional Frontend
- **Frontend Requirements:**
  - JavaScript pages for:
    - Title
    - Masthead
    - About
    - Submission guidelines
    - Sign up, login, and withdraw account functionalities
- **User Access:**
  - Different users granted different levels of access.
  - Users can edit and delete their own accounts.
  - Editors and managing editors:
    - Can create, update, and delete other accounts.
    - Access a listing of all people.
    - Directly modify manuscript text via a functional interface.
- **Frontend Features:**
  - Generate and display the journal masthead.
  - Dashboard with manuscript visualization and filtering functionality.

---

### Error Tracing and Validation
- Add logs for interactions between entities:
  - Paper submission
  - Account creation
  - Paper approval
  - Role assignment
- Frontend interface for log access.
- Audit trails for title changes.
- Validation:
  - Ensure a referee cannot be assigned multiple times to the same manuscript.

---

### Core Functionality
- Manuscript workflow integration in both frontend and backend.
- Account Management:
  - Submitting a manuscript creates an author account.
  - Users can create, edit, and delete their own accounts.
- Dashboard:
  - Visual representation of manuscripts.
  - Filter functionality.