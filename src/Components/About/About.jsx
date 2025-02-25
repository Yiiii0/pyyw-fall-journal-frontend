import React from 'react';
import './About.css';

function About() {
  return (
    <div className="about-container">
      <h1>About Our Journal System</h1>
      
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
        <h2>Our Team</h2>
        <p>
          Our journal is managed by a dedicated team of professionals committed to advancing
          scholarly communication:
        </p>
        <div className="team-members">
          <div className="team-member">
            <h3>Yuwei Sun</h3>
            <p className="role">xxx</p>
            <p>NYU B.S. in Computer Science</p>
            <p>Specializing in xxx</p>
          </div>
          <div className="team-member">
            <h3>Yiqiao Zhou</h3>
            <p className="role">xxx</p>
            <p>NYU B.S. in Computer Science</p>
            <p>Specializing in xxx</p>
          </div>
          <div className="team-member">
            <h3>Yirong Wang</h3>
            <p className="role">xxx</p>
            <p>NYU B.S. in Computer Science</p>
            <p>Specializing in xxx</p>
          </div>
          <div className="team-member">
            <h3>Wayne Wang</h3>
            <p className="role">xxx</p>
            <p>NYU B.S. in Computer Science</p>
            <p>Specializing in xxx</p>
          </div>
          <div className="team-member">
            <h3>Chelsea Wang</h3>
            <p className="role">xxx</p>
            <p>NYU B.S. in Computer Science</p>
            <p>Specializing in xxx</p>
          </div>
        </div>
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