import React, { useState, useEffect } from 'react';
import { getText } from '../../services/textAPI';
import './About.css';

function About() {
  const [aboutData, setAboutData] = useState({ title: '', text: '' });

  useEffect(() => {
    async function fetchAboutContent() {
      try {
        const data = await getText('about');
        setAboutData(data);
      } catch (error) {
        console.error('Error fetching about content:', error);
      }
    }
    fetchAboutContent();
  }, []);

  return (
    <div className="about-container">
      {aboutData.title ? (
        <h1 className="about-heading">{aboutData.title}</h1>
      ) : (
        <h1 className="about-heading">Loading...</h1>
      )}

      {aboutData.text ? (
        <div className="about-content" dangerouslySetInnerHTML={{ __html: aboutData.text }} />
      ) : null}
    </div>
  );
}

export default About; 