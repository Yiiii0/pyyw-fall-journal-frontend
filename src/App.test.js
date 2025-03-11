import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event'

import App from './App';
import { homeHeader } from './App';

describe('App', () => {
  it('renders nav and home', async () => {
    render(<App />);

    await screen.findByRole('heading');
    await screen.findAllByRole('listitem');

    expect(screen.getByRole('heading')).toHaveTextContent('Welcome to Journal System');
    
    expect(screen.getAllByRole('listitem')).toHaveLength(6);
  });

  it('switches to about page', async () => {
    render(<App />);

    userEvent.click(screen.getByText('About'));

    expect(screen.getByRole('heading', { level: 1 }))
      .toHaveTextContent('About Our Journal System')
  });
});