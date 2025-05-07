import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ManuscriptReview from '../../Components/ManuscriptReview/ManuscriptReview';
import { getManuscriptById, updateManuscriptState } from '../../services/manuscriptsAPI';
import { createComment } from '../../services/commentsAPI';

// Mock the API calls
jest.mock('../../services/manuscriptsAPI');
jest.mock('../../services/commentsAPI');

// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: '123' })
}));

// Mock useAuth hook
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: {
      email: 'referee@example.com',
      id: 'referee-123'
    }
  })
}));

describe('ManuscriptReview Component', () => {
  const mockManuscript = {
    _id: '123',
    title: 'Test Manuscript',
    author: 'John Doe',
    author_email: 'john@example.com',
    abstract: 'This is a test abstract',
    text: 'This is the main text of the manuscript',
    state: 'REV'
  };

  beforeEach(() => {
    // Mock API responses
    getManuscriptById.mockResolvedValue(mockManuscript);
    updateManuscriptState.mockResolvedValue({ success: true });
    createComment.mockResolvedValue({ success: true });
    // Reset the mock navigate function
    mockNavigate.mockReset();
    // Mock window.alert
    window.alert = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading message initially', async () => {
    render(
      <MemoryRouter initialEntries={['/manuscript-review/123']}>
        <Routes>
          <Route path="/manuscript-review/:id" element={<ManuscriptReview />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Loading manuscript...')).toBeInTheDocument();
  });

  test('displays manuscript details after loading', async () => {
    render(
      <MemoryRouter initialEntries={['/manuscript-review/123']}>
        <Routes>
          <Route path="/manuscript-review/:id" element={<ManuscriptReview />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Manuscript')).toBeInTheDocument();
      expect(screen.getByText('Author: John Doe')).toBeInTheDocument();
      expect(screen.getByText('Email: john@example.com')).toBeInTheDocument();
      expect(screen.getByText('This is a test abstract')).toBeInTheDocument();
      expect(screen.getByText('This is the main text of the manuscript')).toBeInTheDocument();
    });
  });

  test('submits comments when "Submit Comments" button is clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/manuscript-review/123']}>
        <Routes>
          <Route path="/manuscript-review/:id" element={<ManuscriptReview />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Manuscript')).toBeInTheDocument();
    });

    // Type comments
    fireEvent.change(screen.getByPlaceholderText(/Enter your comments/i), {
      target: { value: 'These are my review comments' }
    });

    // Submit comments
    const submitButton = screen.getByText('Submit Comments');

    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      // Check if updateManuscriptState was called with SBR action
      expect(updateManuscriptState).toHaveBeenCalledWith('123', 'SBR', {
        comments: 'These are my review comments',
        referee: 'referee@example.com'
      });

      // Check if createComment was called
      expect(createComment).toHaveBeenCalledWith('123', 'referee@example.com', 'These are my review comments');

      // Check if alert was shown
      expect(window.alert).toHaveBeenCalled();

      // Check if redirected
      expect(mockNavigate).toHaveBeenCalledWith('/action-dashboard');
    });
  });

  test('displays error when submitting without comments', async () => {
    render(
      <MemoryRouter initialEntries={['/manuscript-review/123']}>
        <Routes>
          <Route path="/manuscript-review/:id" element={<ManuscriptReview />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Manuscript')).toBeInTheDocument();
    });

    // Submit button should be disabled if no comments
    const submitButton = screen.getByText('Submit Comments');
    expect(submitButton).toBeDisabled();

    // Add empty comments (just spaces)
    fireEvent.change(screen.getByPlaceholderText(/Enter your comments/i), {
      target: { value: '   ' }
    });

    // Submit button should still be disabled
    expect(submitButton).toBeDisabled();
  });

  test('displays error message when API call fails', async () => {
    updateManuscriptState.mockRejectedValueOnce(new Error('API Error'));

    render(
      <MemoryRouter initialEntries={['/manuscript-review/123']}>
        <Routes>
          <Route path="/manuscript-review/:id" element={<ManuscriptReview />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Manuscript')).toBeInTheDocument();
    });

    // Type comments
    fireEvent.change(screen.getByPlaceholderText(/Enter your comments/i), {
      target: { value: 'These are my review comments' }
    });

    // Submit comments
    const submitButton = screen.getByText('Submit Comments');

    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });
});