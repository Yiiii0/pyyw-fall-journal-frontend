import React, { useState, useEffect } from 'react';
import './About.css';
import { getPeople, getRoles } from '../../services/peopleAPI';

function About() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [roles, setRoles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true);
        
        // Fetch team members from the people API
        const peopleData = await getPeople();
        console.log('People data received:', peopleData);
        
        // Fetch roles to map role codes to readable names
        const rolesData = await getRoles();
        console.log('Roles data received:', rolesData);
        
        const rolesMap = {};
        
        // Process roles data
        if (rolesData && typeof rolesData === 'object') {
          Object.keys(rolesData).forEach(key => {
            rolesMap[key] = rolesData[key];
          });
        }
        
        console.log('Processed roles map:', rolesMap);
        setRoles(rolesMap);
        
        // Process people data
        let allPeople = [];
        
        if (peopleData && typeof peopleData === 'object') {
          // Convert object to array
          allPeople = Object.values(peopleData);
        } else if (Array.isArray(peopleData)) {
          allPeople = peopleData;
        }
        
        // Filter to show only team members with editor roles
        const teamData = allPeople.filter(person => {
          if (!person) return false;
          
          // Check if roles is an array
          if (Array.isArray(person.roles)) {
            // Check if any role in the array is an editor role
            return person.roles.some(role => {
              // Check if the role code is ED (Editor) or contains "editor"
              if (role === 'ED' || role === 'ME' || role === 'CE') return true;
              if (role.toLowerCase().includes('editor')) return true;
              
              // Check if the mapped role name contains "editor"
              const roleName = rolesMap[role];
              return roleName && roleName.toLowerCase().includes('editor');
            });
          }
          
          // Fallback checks for other role formats
          if (person.role) {
            if (person.role === 'ED' || person.role === 'ME' || person.role === 'CE') return true;
            if (person.role.toLowerCase().includes('editor')) return true;
            
            const roleName = rolesMap[person.role];
            if (roleName && roleName.toLowerCase().includes('editor')) return true;
          }
          
          return false;
        });
        
        console.log('Filtered team data (editors only):', teamData);
        setTeamMembers(teamData);
        setError(null);
      } catch (err) {
        console.error('Error fetching team data:', err);
        setError('Failed to load team data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, []);

  return (
    <div className="about-container">
      <h1 className="about-heading">About Our Journal System</h1>
      
      <div className="about-section">
        <h2>Our Mission</h2>
        <p>
          Our journal system is dedicated to facilitating the academic publishing process by providing
          a streamlined platform for authors, editors, and reviewers. We aim to make the submission,
          review, and publication process as efficient and transparent as possible.
        </p>
        <p>
          By leveraging modern technology, we hope to accelerate the dissemination of knowledge
          while maintaining the highest standards of academic integrity and peer review.
        </p>
      </div>
      
      <div className="about-section">
        <h2>The Publication Process</h2>
        <p>
          Our journal follows a rigorous publication process to ensure the quality and integrity of all published works:
        </p>
        <ol>
          <li><strong>Submission</strong>: Authors submit their manuscripts through our online system.</li>
          <li><strong>Initial Review</strong>: Editors review submissions for suitability and completeness.</li>
          <li><strong>Peer Review</strong>: Qualified referees evaluate the manuscript for scientific merit.</li>
          <li><strong>Revision</strong>: Authors may be asked to revise their work based on reviewer feedback.</li>
          <li><strong>Copy Editing</strong>: Accepted manuscripts undergo copy editing for clarity and style.</li>
          <li><strong>Author Review</strong>: Authors review the edited manuscript before final formatting.</li>
          <li><strong>Formatting</strong>: The manuscript is formatted according to journal standards.</li>
          <li><strong>Publication</strong>: The final manuscript is published and made available to readers.</li>
        </ol>
      </div>
      
      <div className="about-section">
        <h2>Our Editorial Team</h2>
        <p>
          Our journal is managed by a dedicated team of editors committed to advancing
          scholarly communication:
        </p>
        {loading ? (
          <p>Loading editorial team information...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : (
          <div className="team-members">
            {teamMembers.length > 0 ? (
              teamMembers.map((member, index) => (
                <div className="team-member" key={index}>
                  <h3>{member.name || 'Team Member'}</h3>
                  <p className="role">
                    {Array.isArray(member.roles) && member.roles.length > 0 
                      ? member.roles.map(role => roles[role] || role).join(', ')
                      : roles[member.role] || member.role || 'Editor'}
                  </p>
                  <p>{member.affiliation || 'Affiliation not specified'}</p>
                  <p>{member.bio || 'Bio not available'}</p>
                </div>
              ))
            ) : (
              <p>No editorial team members found. Check the console for debugging information.</p>
            )}
          </div>
        )}
      </div>
      
      <div className="about-section">
        <h2>Contact Us</h2>
        <p>
          If you have any questions about our journal or the submission process,
          please don&apos;t hesitate to contact us at <a href="mailto:journal@example.com">journal@example.com</a>.
        </p>
      </div>
    </div>
  );
}

export default About; 