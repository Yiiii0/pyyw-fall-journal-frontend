import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ManuscriptReview from '../../Components/ManuscriptReview/ManuscriptReview';
import { getManuscriptById, updateManuscriptState } from '../../services/manuscriptsAPI';

// Mock the API calls
jest.mock('../../services/manuscriptsAPI');

// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: '123' })
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

  test('displays error message when manuscript fetch fails', async () => {
    // Mock API error
    getManuscriptById.mockRejectedValueOnce(new Error('Failed to fetch manuscript'));

    render(
      <MemoryRouter initialEntries={['/manuscript-review/123']}>
        <Routes>
          <Route path="/manuscript-review/:id" element={<ManuscriptReview />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch manuscript')).toBeInTheDocument();
    });
  });

  test('displays not found message when manuscript is null', async () => {
    // Mock API returning null
    getManuscriptById.mockResolvedValueOnce(null);

    render(
      <MemoryRouter initialEntries={['/manuscript-review/123']}>
        <Routes>
          <Route path="/manuscript-review/:id" element={<ManuscriptReview />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No manuscript found with ID: 123')).toBeInTheDocument();
    });
  });

  test('accept button calls updateManuscriptState with ACC action', async () => {
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

    const acceptButton = screen.getByText('Accept');
    
    await act(async () => {
      fireEvent.click(acceptButton);
    });

    await waitFor(() => {
      expect(updateManuscriptState).toHaveBeenCalledWith('Test Manuscript', 'ACC');
      expect(window.alert).toHaveBeenCalledWith('Manuscript accepted successfully!');
      expect(mockNavigate).toHaveBeenCalledWith('/action-dashboard');
    });
  });

  test('reject button calls updateManuscriptState with REJ action', async () => {
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

    const rejectButton = screen.getByText('Reject');
    
    await act(async () => {
      fireEvent.click(rejectButton);
    });

    await waitFor(() => {
      expect(updateManuscriptState).toHaveBeenCalledWith('Test Manuscript', 'REJ');
      expect(window.alert).toHaveBeenCalledWith('Manuscript rejected successfully!');
      expect(mockNavigate).toHaveBeenCalledWith('/action-dashboard');
    });
  });

  test('displays error message when action fails', async () => {
    // Mock API error for action
    updateManuscriptState.mockRejectedValueOnce(new Error('Action failed'));

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

    const acceptButton = screen.getByText('Accept');
    
    await act(async () => {
      fireEvent.click(acceptButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Action failed')).toBeInTheDocument();
    });
  });
}); 