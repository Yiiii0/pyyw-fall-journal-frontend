import React, { useState, useEffect } from 'react';
import propTypes from 'prop-types';
import { createTextPage, updateTextPage, getTextPage } from '../../services/manuscriptsAPI';
import './TextPageEditor.css';

function TextPageEditor({ manuscriptId, pageNumber: initialPageNumber, onSave, onCancel }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pageNumber, setPageNumber] = useState(initialPageNumber || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEditing = !!initialPageNumber;

  useEffect(() => {
    // If initialPageNumber is provided, fetch the existing page data
    if (initialPageNumber) {
      const fetchPageData = async () => {
        try {
          setLoading(true);
          const pageData = await getTextPage(manuscriptId, initialPageNumber);
          setTitle(pageData.title || '');
          setContent(pageData.text || '');
          setError('');
        } catch (err) {
          setError(`Failed to load page data: ${err.message}`);
        } finally {
          setLoading(false);
        }
      };

      fetchPageData();
    }
  }, [manuscriptId, initialPageNumber]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!content.trim()) {
      setError('Content is required');
      return;
    }

    if (!isEditing && !pageNumber.trim()) {
      setError('Page number is required');
      return;
    }

    try {
      setLoading(true);
      
      const pageData = {
        title,
        text: content
      };
      
      if (isEditing) {
        // Update existing page
        await updateTextPage(manuscriptId, initialPageNumber, pageData);
      } else {
        // Create new page
        pageData.page_number = pageNumber;
        await createTextPage(manuscriptId, pageData);
      }
      
      if (onSave) {
        onSave();
      }
    } catch (err) {
      setError(`Failed to ${isEditing ? 'update' : 'create'} text page: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return <div className="loading">Loading page data...</div>;
  }

  return (
    <div className="text-page-editor">
      <h2>{isEditing ? 'Edit Text Page' : 'Add New Text Page'}</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="page-title">Title</label>
          <input
            id="page-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter page title"
            required
          />
        </div>
        
        {!isEditing && (
          <div className="form-group">
            <label htmlFor="page-number">Page Number</label>
            <input
              id="page-number"
              type="text"
              value={pageNumber}
              onChange={(e) => setPageNumber(e.target.value)}
              placeholder="Enter page number"
              required
            />
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="page-content">Content</label>
          <textarea
            id="page-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter page content"
            rows={10}
            required
          />
        </div>
        
        <div className="form-actions">
          <button type="button" onClick={onCancel} className="cancel-button">
            Cancel
          </button>
          <button type="submit" className="save-button" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}

TextPageEditor.propTypes = {
  manuscriptId: propTypes.string.isRequired,
  pageNumber: propTypes.string,
  onSave: propTypes.func,
  onCancel: propTypes.func
};

TextPageEditor.defaultProps = {
  pageNumber: '',
  onSave: () => {},
  onCancel: () => {}
};

export default TextPageEditor; 