import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import Manuscripts from '../../Components/Manuscripts/Manuscripts';
import * as manuscriptsAPI from '../../services/manuscriptsAPI';
import * as peopleAPI from '../../services/peopleAPI';

// Mock the API calls
jest.mock('../../services/manuscriptsAPI');
jest.mock('../../services/peopleAPI');
jest.mock('../../services/refereeAPI');

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock AuthContext
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: {
      email: 'test@example.com',
      roles: ['ED']
    }
  }),
  AuthProvider: ({ children }) => <div>{children}</div>
}));

describe('Manuscripts Component', () => {
  const mockManuscripts = [
    {
      _id: '1',
      title: 'Test Manuscript 1',
      author: 'Test Author',
      author_email: 'author@test.com',
      abstract: 'Test abstract',
      state: 'SUB',
      text: 'Test manuscript text'
    },
    {
      _id: '2',
      title: 'Test Manuscript 2',
      author: 'Test Author 2',
      author_email: 'author2@test.com',
      abstract: 'Test abstract 2',
      state: 'REV',
      text: 'Test manuscript text 2'
    }
  ];

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Setup default API responses
    manuscriptsAPI.getManuscript.mockResolvedValue(mockManuscripts);
    manuscriptsAPI.getManuscriptsByTitle.mockResolvedValue(mockManuscripts);
    peopleAPI.getAllPeople.mockResolvedValue([]);
    
    // Clear localStorage
    localStorage.clear();
  });

  test('renders manuscripts list', async () => {
    render(
      <AuthProvider>
        <Manuscripts />
      </AuthProvider>
    );

    // Wait for manuscripts to load
    await waitFor(() => {
      expect(screen.getByText('Test Manuscript 1')).toBeInTheDocument();
      expect(screen.getByText('Test Manuscript 2')).toBeInTheDocument();
    });
  });

  test('handles search functionality', async () => {
    render(
      <AuthProvider>
        <Manuscripts />
      </AuthProvider>
    );

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
    manuscriptsAPI.getManuscript.mockRejectedValueOnce(new Error(errorMessage));

    render(
      <AuthProvider>
        <Manuscripts />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(new RegExp(errorMessage))).toBeInTheDocument();
    });
  });

  test('toggles between simple and detailed view', async () => {
    render(
      <AuthProvider>
        <Manuscripts />
      </AuthProvider>
    );

    const viewToggleButton = screen.getByTitle('Switch to Card View');
    
    // Initial state should show detailed view
    await waitFor(() => {
      expect(screen.getByText('Test Manuscript 1')).toBeInTheDocument();
    });

    // Toggle to simple view
    fireEvent.click(viewToggleButton);
    
    // Should still show titles but in a simpler format
    expect(screen.getByText('Test Manuscript 1')).toBeInTheDocument();
  });
}); 