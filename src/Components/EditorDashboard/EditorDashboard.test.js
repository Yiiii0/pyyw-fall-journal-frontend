import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import EditorDashboard from './EditorDashboard';

describe('EditorDashboard Component', () => {
  beforeEach(() => {
    localStorage.setItem("userData", JSON.stringify({ email: "test@example.com" }));
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch.mockClear();
    localStorage.clear();
  });

  test('renders the Editor Dashboard heading when authorized', async () => {
    const fakeResponse = { message: 'Authorized' };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => fakeResponse,
      text: async () => JSON.stringify(fakeResponse),
    });

    render(
      <BrowserRouter>
        <EditorDashboard />
      </BrowserRouter>
    );

    const headingElement = await screen.findByText(/Editor Dashboard/i);
    expect(headingElement).toBeInTheDocument();

    const manuscriptsLink = screen.getByRole('link', { name: /Manuscripts/i });
    expect(manuscriptsLink).toBeInTheDocument();
    expect(manuscriptsLink).toHaveAttribute('href', '/manuscripts');

    const peopleLink = screen.getByRole('link', { name: /People/i });
    expect(peopleLink).toBeInTheDocument();
    expect(peopleLink).toHaveAttribute('href', '/people');
  });

  test('renders no permission message when unauthorized', async () => {
    const fakeResponse = {
      error: "User test@example.com lacks required roles: ['ED', 'ME']"
    };
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => fakeResponse,
      text: async () => JSON.stringify(fakeResponse),
    });

    render(
      <BrowserRouter>
        <EditorDashboard />
      </BrowserRouter>
    );

    const errorElement = await screen.findByText(/You do not have permission to view this page/i);
    expect(errorElement).toBeInTheDocument();
  });
});
