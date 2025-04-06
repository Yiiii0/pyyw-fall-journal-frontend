import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import EditorDashboard from './EditorDashboard';

describe('EditorDashboard Component', () => {
  beforeEach(() => {
    render(
      <BrowserRouter>
        <EditorDashboard />
      </BrowserRouter>
    );
  });

  test('renders the Editor Dashboard heading', () => {
    const headingElement = screen.getByText(/Editor Dashboard/i);
    expect(headingElement).toBeInTheDocument();
  });

  test('renders the Manuscripts link', () => {
    const manuscriptsLink = screen.getByRole('link', { name: /Manuscripts/i });
    expect(manuscriptsLink).toBeInTheDocument();
    expect(manuscriptsLink).toHaveAttribute('href', '/manuscripts');
  });

  test('renders the People link', () => {
    const peopleLink = screen.getByRole('link', { name: /People/i });
    expect(peopleLink).toBeInTheDocument();
    expect(peopleLink).toHaveAttribute('href', '/people');
  });
});
