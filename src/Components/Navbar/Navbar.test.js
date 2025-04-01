import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Navbar from './Navbar';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock the react-router-dom hooks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/' })
}));

// Mock the AuthContext
jest.mock('../../contexts/AuthContext', () => {
  const originalModule = jest.requireActual('../../contexts/AuthContext');

  return {
    ...originalModule,
    useAuth: jest.fn()
  };
});

// Import the mocked useAuth
import { useAuth } from '../../contexts/AuthContext';

describe('Navbar Component', () => {
  // Helper function to render the Navbar with necessary providers
  const renderNavbar = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('When user is not authenticated', () => {
    beforeEach(() => {
      // Mock unauthenticated state
      useAuth.mockReturnValue({
        currentUser: null,
        logout: jest.fn()
      });
    });

    it('should render the brand name', () => {
      renderNavbar();
      expect(screen.getByText('Journal System')).toBeInTheDocument();
    });

    it('should render Home and About links', () => {
      renderNavbar();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
    });

    it('should not render Manuscripts or Submissions links', () => {
      renderNavbar();
      expect(screen.queryByText('Manuscripts')).not.toBeInTheDocument();
      expect(screen.queryByText('Submissions')).not.toBeInTheDocument();
    });

    it('should render Sign In button', () => {
      renderNavbar();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    it('should not render Logout button', () => {
      renderNavbar();
      expect(screen.queryByText('Logout')).not.toBeInTheDocument();
    });
  });

  describe('When user is authenticated as a regular user', () => {
    const mockLogout = jest.fn();

    beforeEach(() => {
      // Mock authenticated state with regular user
      useAuth.mockReturnValue({
        currentUser: {
          name: 'Test User',
          email: 'test@example.com',
          roles: ['AU'] // Author role
        },
        logout: mockLogout
      });
    });

    it('should render the user name', () => {
      renderNavbar();
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('should render Manuscripts and Submissions links', () => {
      renderNavbar();
      expect(screen.getByText('Manuscripts')).toBeInTheDocument();
      expect(screen.getByText('Submissions')).toBeInTheDocument();
    });

    it('should not render Editor Dashboard link', () => {
      renderNavbar();
      expect(screen.queryByText('Editor Dashboard')).not.toBeInTheDocument();
    });

    it('should render Logout button', () => {
      renderNavbar();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('should call logout function when Logout button is clicked', () => {
      renderNavbar();
      fireEvent.click(screen.getByText('Logout'));
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('When user is authenticated as an Editor', () => {
    beforeEach(() => {
      // Mock authenticated state with editor role
      useAuth.mockReturnValue({
        currentUser: {
          name: 'Editor User',
          email: 'editor@example.com',
          roles: ['ED'] // Editor role
        },
        logout: jest.fn()
      });
    });

    it('should render Editor Dashboard link', () => {
      renderNavbar();
      expect(screen.getByText('Editor Dashboard')).toBeInTheDocument();
    });

    it('should not render Manuscripts link', () => {
      renderNavbar();
      expect(screen.queryByText('Manuscripts')).not.toBeInTheDocument();
    });

    it('should render Submissions link', () => {
      renderNavbar();
      expect(screen.getByText('Submissions')).toBeInTheDocument();
    });
  });

  describe('When user is authenticated as a Managing Editor', () => {
    beforeEach(() => {
      // Mock authenticated state with managing editor role
      useAuth.mockReturnValue({
        currentUser: {
          name: 'Managing Editor',
          email: 'me@example.com',
          roles: ['ME'] // Managing Editor role
        },
        logout: jest.fn()
      });
    });

    it('should render Editor Dashboard link', () => {
      renderNavbar();
      expect(screen.getByText('Editor Dashboard')).toBeInTheDocument();
    });

    it('should not render Manuscripts link', () => {
      renderNavbar();
      expect(screen.queryByText('Manuscripts')).not.toBeInTheDocument();
    });
  });

  describe('When user is authenticated as a Referee', () => {
    beforeEach(() => {
      // Mock authenticated state with referee role
      useAuth.mockReturnValue({
        currentUser: {
          name: 'Referee User',
          email: 'referee@example.com',
          roles: ['RE'] // Referee role
        },
        logout: jest.fn()
      });
    });

    it('should render Referee Dashboard link', () => {
      renderNavbar();
      expect(screen.getByText('Action Dashboard')).toBeInTheDocument();
    });

    it('should not render Manuscripts link', () => {
      renderNavbar();
      expect(screen.queryByText('Manuscripts')).not.toBeInTheDocument();
    });

    it('should render Submissions link', () => {
      renderNavbar();
      expect(screen.getByText('Submissions')).toBeInTheDocument();
    });
  });

  describe('When user has multiple roles (Editor and Referee)', () => {
    beforeEach(() => {
      // Mock authenticated state with multiple roles
      useAuth.mockReturnValue({
        currentUser: {
          name: 'Multi-Role User',
          email: 'multi@example.com',
          roles: ['ED', 'RE'] // Both Editor and Referee roles
        },
        logout: jest.fn()
      });
    });

    it('should render both Editor Dashboard and Referee Dashboard links', () => {
      renderNavbar();
      expect(screen.getByText('Editor Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Action Dashboard')).toBeInTheDocument();
    });

    it('should not render Manuscripts link', () => {
      renderNavbar();
      expect(screen.queryByText('Manuscripts')).not.toBeInTheDocument();
    });

    it('should render Submissions link', () => {
      renderNavbar();
      expect(screen.getByText('Submissions')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should display email if name is not available', () => {
      useAuth.mockReturnValue({
        currentUser: {
          email: 'noname@example.com',
          roles: ['AU']
        },
        logout: jest.fn()
      });

      renderNavbar();
      expect(screen.getByText('noname@example.com')).toBeInTheDocument();
    });
  });
});