import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Submissions from '../../Components/Submissions/Submissions';
import * as manuscriptsAPI from '../../services/manuscriptsAPI';

// Mock the API calls
jest.mock('../../services/manuscriptsAPI');

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

describe('Submissions Component', () => {
  const mockUser = {
    email: 'test@example.com',
    name: 'Test User',
    roles: ['AU']
  };

  const mockManuscripts = [
    {
      _id: '1',
      title: 'Test Manuscript 1',
      author: 'Test Author',
      author_email: 'author@test.com',
      text: 'Test manuscript text',
      abstract: 'Test abstract',
      editor_email: 'editor@test.com',
      state: 'SUB',
      referees: [],
      history: []
    },
    {
      _id: '2',
      title: 'Test Manuscript 2',
      author: 'Test Author 2',
      author_email: 'author2@test.com',
      text: 'Test manuscript text 2',
      abstract: 'Test abstract 2',
      editor_email: 'editor@test.com',
      state: 'REV',
      referees: [],
      history: []
    }
  ];

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Setup default API responses
    manuscriptsAPI.getManuscripts.mockResolvedValue(mockManuscripts);
    manuscriptsAPI.getManuscriptsByTitle.mockResolvedValue(mockManuscripts);
    manuscriptsAPI.getValidActions.mockResolvedValue(['SUB', 'REV', 'REJ']);
    manuscriptsAPI.getManuscriptById.mockResolvedValue(mockManuscripts[0]);
    
    // Clear localStorage
    localStorage.clear();
  });

  test('renders submissions page with user manuscripts', async () => {
    render(<Submissions user={mockUser} />);

    // Wait for manuscripts to load
    await waitFor(() => {
      expect(screen.getByText('Test Manuscript 1')).toBeInTheDocument();
      expect(screen.getByText('Test Manuscript 2')).toBeInTheDocument();
    });

    // Check for submission button
    expect(screen.getByText('Submit New Manuscript')).toBeInTheDocument();
  });

  test('handles search functionality', async () => {
    render(<Submissions user={mockUser} />);

    const searchInput = screen.getByPlaceholderText(/search by title/i);
    const searchButton = screen.getByRole('button', { name: /search/i });

    // Type in search
    fireEvent.change(searchInput, { target: { value: 'Test Manuscript 1' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(manuscriptsAPI.getManuscriptsByTitle).toHaveBeenCalledWith('Test Manuscript 1');
    });
  });

  test('displays error message when API call fails', async () => {
    const errorMessage = 'Failed to fetch manuscripts';
    manuscriptsAPI.getManuscripts.mockRejectedValueOnce(new Error(errorMessage));

    render(<Submissions user={mockUser} />);

    await waitFor(() => {
      expect(screen.getByText(new RegExp(errorMessage))).toBeInTheDocument();
    });
  });

  test('opens add manuscript form when submit button is clicked', async () => {
    render(<Submissions user={mockUser} />);

    // Wait for page to load
    await waitFor(() => {
      expect(screen.getByText('Test Manuscript 1')).toBeInTheDocument();
    });

    // Click submit button
    const submitButton = screen.getByRole('button', { name: /submit new manuscript/i });
    fireEvent.click(submitButton);

    // Check if form is displayed
    expect(screen.getByText('Submit New Manuscript')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Author')).toBeInTheDocument();
    expect(screen.getByLabelText('Author Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Abstract')).toBeInTheDocument();
    expect(screen.getByLabelText('Main Text')).toBeInTheDocument();
    expect(screen.getByLabelText('Editor Email')).toBeInTheDocument();
  });

  test('shows submission guidelines when button is clicked', async () => {
    render(<Submissions user={mockUser} />);

    // Wait for page to load
    await waitFor(() => {
      expect(screen.getByText('Test Manuscript 1')).toBeInTheDocument();
    });

    // Click guidelines button
    const guidelinesButton = screen.getByRole('button', { name: /submission guidelines/i });
    fireEvent.click(guidelinesButton);

    // Check if guidelines are displayed
    expect(screen.getByText(/Submission Guidelines/i)).toBeInTheDocument();
    expect(screen.getByText(/Formatting Requirements/i)).toBeInTheDocument();
  });
}); 