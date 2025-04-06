import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EditorActionForm from './EditorActionForm';
import { getEditorActions, updateManuscriptState } from '../../services/manuscriptsAPI';

jest.mock('../../services/manuscriptsAPI');

const mockOnSuccess = jest.fn();
const mockSetError = jest.fn();
const mockOnCancel = jest.fn();

describe('EditorActionForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getEditorActions.mockResolvedValue(['Accept', 'Reject']);
  });

  test('renders the form elements', async () => {
    render(
      <EditorActionForm
        title="Test Manuscript"
        onSuccess={mockOnSuccess}
        setError={mockSetError}
        onCancel={mockOnCancel}
      />
    );

    await waitFor(() => expect(screen.getByText('Accept')).toBeInTheDocument());
    expect(screen.getByLabelText('Action:')).toBeInTheDocument();
  });

  test('shows error when submitted without selecting action', async () => {
    render(
      <EditorActionForm
        title="Test Manuscript"
        onSuccess={mockOnSuccess}
        setError={mockSetError}
        onCancel={mockOnCancel}
      />
    );

    await waitFor(() => expect(screen.getByText('Accept')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Submit'));
    expect(mockSetError).toHaveBeenCalledWith('Please select an Editor action.');
  });

  test('successfully submits selected action', async () => {
    updateManuscriptState.mockResolvedValueOnce();

    render(
      <EditorActionForm
        title="Test Manuscript"
        onSuccess={mockOnSuccess}
        setError={mockSetError}
        onCancel={mockOnCancel}
      />
    );

    await waitFor(() => screen.getByText('Accept'));
    fireEvent.change(screen.getByLabelText('Action:'), { target: { value: 'Accept' } });
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => expect(mockOnSuccess).toHaveBeenCalled());
  });

  test('handles API errors gracefully', async () => {
    updateManuscriptState.mockRejectedValueOnce(new Error('API Error'));

    render(
      <EditorActionForm
        title="Test Manuscript"
        onSuccess={mockOnSuccess}
        setError={mockSetError}
        onCancel={mockOnCancel}
      />
    );

    await waitFor(() => screen.getByText('Reject'));
    fireEvent.change(screen.getByLabelText('Action:'), { target: { value: 'Reject' } });
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => expect(mockSetError).toHaveBeenCalledWith('API Error'));
  });

  test('cancel button calls onCancel', async () => {
    render(
      <EditorActionForm
        title="Test Manuscript"
        onSuccess={mockOnSuccess}
        setError={mockSetError}
        onCancel={mockOnCancel}
      />
    );

    await waitFor(() => screen.getByText('Cancel'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnCancel).toHaveBeenCalled();
  });
});
