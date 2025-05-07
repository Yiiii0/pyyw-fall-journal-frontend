import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Profile from './Profile';
import { useAuth } from '../../contexts/AuthContext';
import { getPerson, updatePerson, deletePerson } from '../../services/peopleAPI';

jest.mock('../../contexts/AuthContext');
jest.mock('../../services/peopleAPI');

describe('Profile component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders login prompt when not authenticated', () => {
    useAuth.mockReturnValue({ currentUser: null });
    render(<Profile />);
    expect(
      screen.getByText(/please log in to view your profile/i)
    ).toBeInTheDocument();
  });

  test('fetches and displays user data when authenticated', async () => {
    const mockUser = {
      email: 'user@test.com',
      name: 'Test User',
      affiliation: 'Test Affil',
      roles: ['User'],
      bio: 'Bio text'
    };
    useAuth.mockReturnValue({ currentUser: { email: mockUser.email } });
    getPerson.mockResolvedValue(mockUser);

    render(<Profile />);

    expect(getPerson).toHaveBeenCalledWith(mockUser.email);
    await waitFor(() =>
      expect(screen.getByText(/Test User/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/Test Affil/i)).toBeInTheDocument();
    expect(screen.getByText(/User/i)).toBeInTheDocument();
    expect(screen.getByText(/Bio text/i)).toBeInTheDocument();
  });

  test('shows error when getPerson fails', async () => {
    useAuth.mockReturnValue({ currentUser: { email: 'a@b.com' } });
    getPerson.mockRejectedValue(new Error('Fetch failed'));

    render(<Profile />);
    await waitFor(() =>
      expect(screen.getByText(/Fetch failed/i)).toBeInTheDocument()
    );
  });

  test('allows editing and saving profile', async () => {
    const initial = {
      email: 'e@e.com',
      name: 'Old Name',
      affiliation: 'Old Affil',
      roles: ['Member'],
      bio: 'Old bio'
    };
    const updated = {
      ...initial,
      name: 'New Name',
      affiliation: 'New Affil',
      bio: 'New bio'
    };

    useAuth.mockReturnValue({ currentUser: { email: initial.email } });
    // first call returns initial, second returns updated
    getPerson
      .mockResolvedValueOnce(initial)
      .mockResolvedValueOnce(updated);
    updatePerson.mockResolvedValue();

    render(<Profile />);
    // wait for initial load
    await waitFor(() =>
      expect(screen.getByText(/Old Name/i)).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText(/edit profile/i));

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: updated.name }
    });
    fireEvent.change(screen.getByLabelText(/affiliation/i), {
      target: { value: updated.affiliation }
    });
    fireEvent.change(screen.getByLabelText(/bio/i), {
      target: { value: updated.bio }
    });

    fireEvent.click(screen.getByText(/save changes/i));

    await waitFor(() =>
      expect(updatePerson).toHaveBeenCalledWith(
        initial.email,
        updated.name,
        updated.affiliation,
        updated.bio,
        initial.email
      )
    );
    // ensure we re-fetch
    expect(getPerson).toHaveBeenCalledTimes(2);

    await waitFor(() =>
      expect(screen.getByText(/New Name/i)).toBeInTheDocument()
    );
  });

  test('delete account flow calls deletePerson on confirm', async () => {
    useAuth.mockReturnValue({ currentUser: { email: 'd@d.com' } });
    getPerson.mockResolvedValue({});
    deletePerson.mockResolvedValue();
    window.confirm = jest.fn().mockReturnValue(true);

    // stub window.location.href
    delete window.location;
    window.location = { href: '' };

    render(<Profile />);
    await waitFor(() => expect(getPerson).toHaveBeenCalled());

    fireEvent.click(screen.getByText(/delete account/i));

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringMatching(/are you sure/i)
    );
    await waitFor(() =>
      expect(deletePerson).toHaveBeenCalledWith('d@d.com', 'd@d.com')
    );
    expect(window.location.href).toBe('/');
  });
});
