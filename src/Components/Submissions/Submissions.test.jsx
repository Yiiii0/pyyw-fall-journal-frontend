import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import Submissions from './Submissions'
import * as manuscriptsAPI from '../../services/manuscriptsAPI'

jest.mock('../../services/manuscriptsAPI')

describe('Submissions component', () => {
  const mockList = [
    {
      _id: '1',
      title: 'Test1',
      author: 'A',
      author_email: 'a@x.com',
      text: '',
      abstract: '',
      editor_email: 'e@x.com',
      state: 'SUB',
    },
  ]

  beforeEach(() => {
    jest.resetAllMocks()
    manuscriptsAPI.getManuscripts.mockResolvedValue({ manuscripts: mockList })
    manuscriptsAPI.getValidActions.mockResolvedValue([])
  })

  it('renders heading and the fetched manuscript', async () => {
    render(<Submissions user={{ email: 'e@x.com' }} />)
    expect(await screen.findByText('Test1')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /Manuscripts/i })
    ).toBeInTheDocument()
  })

  it('shows "No manuscripts found" when initial list is empty', async () => {
    manuscriptsAPI.getManuscripts.mockResolvedValue({ manuscripts: [] })
    render(<Submissions user={{}} />)

    expect(await screen.findByText('No manuscripts found')).toBeInTheDocument()
  })

  it('displays error message if initial fetch fails', async () => {
    manuscriptsAPI.getManuscripts.mockRejectedValue(new Error('oops'))
    render(<Submissions user={{}} />)

    expect(await screen.findByText(/oops/i)).toBeInTheDocument()
  })

  it('toggles the Add Manuscript form open and closed', async () => {
    render(<Submissions user={{ email: 'e@x.com' }} />)
    await screen.findByText('Test1')

    // open
    userEvent.click(
      screen.getByRole('button', { name: /Add Manuscript/i })
    )
    expect(
      screen.getByRole('heading', { name: 'Submit New Manuscript' })
    ).toBeInTheDocument()

    // close
    userEvent.click(screen.getByRole('button', { name: /Cancel/i }))
    expect(
      screen.queryByRole('heading', { name: 'Submit New Manuscript' })
    ).toBeNull()
  })

  it('submits a new manuscript via createManuscript', async () => {
    manuscriptsAPI.createManuscript.mockResolvedValue({})
    render(<Submissions user={{ email: 'e@x.com' }} />)
    await screen.findByText('Test1')

    userEvent.click(
      screen.getByRole('button', { name: /Add Manuscript/i })
    )
    userEvent.type(screen.getByLabelText('Title'), 'New Title')
    userEvent.type(screen.getByLabelText('Author'), 'New Author')
    userEvent.type(screen.getByLabelText('Author Email'), 'new@x.com')
    userEvent.type(screen.getByLabelText('Abstract'), 'abs')
    userEvent.type(screen.getByLabelText('Main Text'), 'text')

    // prefilled editor-email
    expect(screen.getByLabelText('Editor Email')).toHaveValue('e@x.com')

    userEvent.click(
      screen.getByRole('button', { name: /Submit Manuscript/i })
    )
    await screen.findByText('Test1')
    expect(manuscriptsAPI.createManuscript).toHaveBeenCalledWith({
      title: 'New Title',
      author: 'New Author',
      author_email: 'new@x.com',
      text: 'text',
      abstract: 'abs',
      editor_email: 'e@x.com',
    })
  })

  it('searches by title and shows no-results error', async () => {
    manuscriptsAPI.getManuscriptsByTitle.mockResolvedValue({
      manuscripts: [],
    })
    render(<Submissions user={{}} />)
    await screen.findByText('Test1')

    userEvent.type(
      screen.getByPlaceholderText(/Search by title/i),
      'foo'
    )
    userEvent.click(screen.getByRole('button', { name: /Search/i }))

    expect(
      await screen.findByText(/No manuscripts found matching "foo"/i)
    ).toBeInTheDocument()
  })

  it('toggles the submission guidelines section', async () => {
    render(<Submissions user={{}} />)
    await screen.findByText('Test1')

    const toggle = screen.getByRole('button', {
      name: /View Guidelines/i,
    })
    expect(
      screen.queryByText(/SFA's Structured Finance Journal/i)
    ).toBeNull()

    userEvent.click(toggle)
    expect(
      screen.getByText(/SFA's Structured Finance Journal/i)
    ).toBeInTheDocument()

    userEvent.click(toggle)
    expect(
      screen.queryByText(/SFA's Structured Finance Journal/i)
    ).toBeNull()
  })

  it('toggles the Edit Manuscript form', async () => {
    render(<Submissions user={{ email: 'e@x.com' }} />)
    await screen.findByText('Test1')

    userEvent.click(screen.getByRole('button', { name: /Edit/i }))
    expect(
      screen.getByRole('heading', { name: 'Edit Manuscript' })
    ).toBeInTheDocument()

    userEvent.click(screen.getByRole('button', { name: /Cancel/i }))
    expect(
      screen.queryByRole('heading', { name: 'Edit Manuscript' })
    ).toBeNull()
  })
})
