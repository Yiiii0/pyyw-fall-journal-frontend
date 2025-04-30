import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import About from './About'
import * as peopleAPI from '../../services/peopleAPI'

jest.mock('../../services/peopleAPI')

describe('About component', () => {
  const mockPeople = {
    'a@x.com': { name: 'Alice', roles: ['ED'], affiliation: 'Org', bio: 'Bio' },
    'b@y.com': { name: 'Bob', roles: ['AU'], affiliation: 'Org2', bio: 'Bio2' },
  }
  const mockRoles = { ED: 'Editor', AU: 'Author' }

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('renders static headings and sections', () => {
    peopleAPI.getPeople.mockResolvedValue({})
    peopleAPI.getRoles.mockResolvedValue({})
    render(<About />)
    expect(
      screen.getByRole('heading', { name: 'About Our Journal System' })
    ).toBeInTheDocument()

    expect(screen.getByText('Our Mission')).toBeInTheDocument()
    expect(screen.getByText('The Publication Process')).toBeInTheDocument()
    expect(screen.getByText('Our Editorial Team')).toBeInTheDocument()
    expect(screen.getByText('Contact Us')).toBeInTheDocument()
  })

  it('shows loading and then only the editor team member', async () => {
    peopleAPI.getPeople.mockResolvedValue(mockPeople)
    peopleAPI.getRoles.mockResolvedValue(mockRoles)

    render(<About />)
    expect(
      screen.getByText(/Loading editorial team information\.\.\./i)
    ).toBeInTheDocument()

    expect(await screen.findByText('Alice')).toBeInTheDocument()
    expect(screen.queryByText('Bob')).toBeNull()

    expect(screen.getByText('Org')).toBeInTheDocument()
    expect(screen.getByText('Bio')).toBeInTheDocument()
  })

  it('displays an error message if the APIs fail', async () => {
    peopleAPI.getPeople.mockRejectedValue(new Error('fail'))
    peopleAPI.getRoles.mockRejectedValue(new Error('fail'))

    render(<About />)
    expect(
      await screen.findByText(/Failed to load team data\. Please try again later\./i)
    ).toBeInTheDocument()
  })
})
