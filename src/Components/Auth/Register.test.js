import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Register from './Register';
import { register as registerAPI } from '../../services/peopleAPI';

// Mock the peopleAPI
jest.mock('../../services/peopleAPI', () => ({
  register: jest.fn()
}));

// Mock the useNavigate hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

describe('Register Component', () => {
  const mockOnRegister = jest.fn();

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  const renderRegister = () => {
    return render(
      <BrowserRouter>
        <Register onRegister={mockOnRegister} />
      </BrowserRouter>
    );
  };

  describe('Form Rendering', () => {
    it('should render all form fields and buttons', () => {
      renderRegister();
      
      // Check for form elements
      expect(screen.getByLabelText(/email\*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/name\*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password\*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password\*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/affiliation/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/bio/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
      
      // Check for sign in link
      expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error when passwords do not match', async () => {
      renderRegister();
      
      // Fill out the form with mismatched passwords
      fireEvent.change(screen.getByLabelText(/email\*/i), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/name\*/i), {
        target: { value: 'Test User' }
      });
      fireEvent.change(screen.getByLabelText(/^password\*/i), {
        target: { value: 'password123' }
      });
      fireEvent.change(screen.getByLabelText(/confirm password\*/i), {
        target: { value: 'password456' }
      });
      
      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /register/i }));
      
      // Check for error message
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      
      // Verify API was not called
      expect(registerAPI).not.toHaveBeenCalled();
    });

    it('should require all mandatory fields to be filled', () => {
      renderRegister();
      
      // Try to submit empty form
      fireEvent.click(screen.getByRole('button', { name: /register/i }));
      
      // Check that HTML5 validation is present for required fields
      expect(screen.getByLabelText(/email\*/i)).toBeInvalid();
      expect(screen.getByLabelText(/name\*/i)).toBeInvalid();
      expect(screen.getByLabelText(/^password\*/i)).toBeInvalid();
      expect(screen.getByLabelText(/confirm password\*/i)).toBeInvalid();
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid required data', async () => {
      const mockUserData = {
        email: 'test@example.com',
        name: 'Test User'
      };
      
      // Mock successful registration
      registerAPI.mockResolvedValueOnce(mockUserData);
      
      renderRegister();
      
      // Fill out the required fields
      fireEvent.change(screen.getByLabelText(/email\*/i), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/name\*/i), {
        target: { value: 'Test User' }
      });
      fireEvent.change(screen.getByLabelText(/^password\*/i), {
        target: { value: 'password123' }
      });
      fireEvent.change(screen.getByLabelText(/confirm password\*/i), {
        target: { value: 'password123' }
      });
      
      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /register/i }));
      
      // Wait for API call and callbacks
      await waitFor(() => {
        expect(registerAPI).toHaveBeenCalledWith({
          username: 'test@example.com',
          name: 'Test User',
          password: 'password123'
        });
        expect(mockOnRegister).toHaveBeenCalledWith(mockUserData);
      });
    });

    it('should submit form with all fields including optional ones', async () => {
      const mockUserData = {
        email: 'test@example.com',
        name: 'Test User'
      };
      
      // Mock successful registration
      registerAPI.mockResolvedValueOnce(mockUserData);
      
      renderRegister();
      
      // Fill out all fields including optional ones
      fireEvent.change(screen.getByLabelText(/email\*/i), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/name\*/i), {
        target: { value: 'Test User' }
      });
      fireEvent.change(screen.getByLabelText(/^password\*/i), {
        target: { value: 'password123' }
      });
      fireEvent.change(screen.getByLabelText(/confirm password\*/i), {
        target: { value: 'password123' }
      });
      fireEvent.change(screen.getByLabelText(/affiliation/i), {
        target: { value: 'Test University' }
      });
      fireEvent.change(screen.getByLabelText(/bio/i), {
        target: { value: 'This is a test bio' }
      });
      
      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /register/i }));
      
      // Wait for API call and callbacks
      await waitFor(() => {
        expect(registerAPI).toHaveBeenCalledWith({
          username: 'test@example.com',
          name: 'Test User',
          password: 'password123',
          affiliation: 'Test University',
          bio: 'This is a test bio'
        });
        expect(mockOnRegister).toHaveBeenCalledWith(mockUserData);
      });
    });

    it('should display error message on API failure', async () => {
      const errorMessage = 'Registration failed';
      
      // Mock API failure
      registerAPI.mockRejectedValueOnce(new Error(errorMessage));
      
      renderRegister();
      
      // Fill out the required fields
      fireEvent.change(screen.getByLabelText(/email\*/i), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/name\*/i), {
        target: { value: 'Test User' }
      });
      fireEvent.change(screen.getByLabelText(/^password\*/i), {
        target: { value: 'password123' }
      });
      fireEvent.change(screen.getByLabelText(/confirm password\*/i), {
        target: { value: 'password123' }
      });
      
      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /register/i }));
      
      // Wait for error message to appear
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });

  describe('Form State Management', () => {
    it('should update form state when typing', () => {
      renderRegister();
      
      const emailInput = screen.getByLabelText(/email\*/i);
      const nameInput = screen.getByLabelText(/name\*/i);
      const passwordInput = screen.getByLabelText(/^password\*/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password\*/i);
      const affiliationInput = screen.getByLabelText(/affiliation/i);
      const bioInput = screen.getByLabelText(/bio/i);
      
      // Type in each field
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      fireEvent.change(affiliationInput, { target: { value: 'Test University' } });
      fireEvent.change(bioInput, { target: { value: 'This is a test bio' } });
      
      // Check values
      expect(emailInput.value).toBe('test@example.com');
      expect(nameInput.value).toBe('Test User');
      expect(passwordInput.value).toBe('password123');
      expect(confirmPasswordInput.value).toBe('password123');
      expect(affiliationInput.value).toBe('Test University');
      expect(bioInput.value).toBe('This is a test bio');
    });

    it('should handle password mismatch error state', async () => {
      renderRegister();
      
      // Fill out required fields
      fireEvent.change(screen.getByLabelText(/email\*/i), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/name\*/i), {
        target: { value: 'Test User' }
      });
      
      // Submit with mismatched passwords to trigger error
      fireEvent.change(screen.getByLabelText(/^password\*/i), {
        target: { value: 'password123' }
      });
      fireEvent.change(screen.getByLabelText(/confirm password\*/i), {
        target: { value: 'password456' }
      });
      fireEvent.click(screen.getByRole('button', { name: /register/i }));
      
      // Verify error is shown
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      
      // Fix the password mismatch
      fireEvent.change(screen.getByLabelText(/confirm password\*/i), {
        target: { value: 'password123' }
      });
      
      // Wait for the error to clear due to the useEffect hook
      await waitFor(() => {
        expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument();
      });
    });
  });
}); 