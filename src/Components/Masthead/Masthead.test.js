import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Masthead from './Masthead';
import { getMasthead } from '../../services/mastheadAPI';

// Mock the masthead API
jest.mock('../../services/mastheadAPI');

describe('Masthead Component', () => {
    // Sample masthead data for testing
    const mockMastheadData = {
        Masthead: {
            "Editor": [
                {
                    name: "John Doe",
                    role: "Senior Editor",
                    affiliation: "University of Example"
                }
            ],
            "Managing Editor": [
                {
                    name: "Jane Smith",
                    role: "Lead Editor",
                    affiliation: "Example College"
                }
            ],
            "Consulting Editor": [
                {
                    name: "Alice Johnson",
                    affiliation: "Example University"
                }
            ]
        }
    };

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    test('renders loading state initially', () => {
        render(<Masthead />);
        expect(screen.getByText('Loading masthead data...')).toBeInTheDocument();
    });

    test('renders masthead data successfully', async () => {
        getMasthead.mockResolvedValueOnce(mockMastheadData);
        render(<Masthead />);

        // Wait for data to load and component to update
        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });

        // Check section headers
        expect(screen.getByText('Editors')).toBeInTheDocument();
        expect(screen.getByText('Managing Editors')).toBeInTheDocument();
        expect(screen.getByText('Consulting Editors')).toBeInTheDocument();

        // Check editor information
        expect(screen.getByText(/Senior Editor/)).toBeInTheDocument();
        expect(screen.getByText('University of Example')).toBeInTheDocument();

        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText(/Lead Editor/)).toBeInTheDocument();
        expect(screen.getByText('Example College')).toBeInTheDocument();

        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
        expect(screen.getByText('Example University')).toBeInTheDocument();
    });

    test('handles empty masthead data', async () => {
        const emptyData = {
            Masthead: {
                "Editor": [],
                "Managing Editor": [],
                "Consulting Editor": []
            }
        };
        getMasthead.mockResolvedValueOnce(emptyData);
        render(<Masthead />);

        // Wait for data to load and component to update
        await waitFor(() => {
            expect(screen.getByText('No editors available')).toBeInTheDocument();
        });

        // Check for "no editors" messages
        expect(screen.getByText('No managing editors available')).toBeInTheDocument();
        expect(screen.getByText('No consulting editors available')).toBeInTheDocument();
    });

    test('handles API error gracefully', async () => {
        // Mock console.error to prevent error output in tests
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        getMasthead.mockRejectedValueOnce(new Error('API Error'));
        render(<Masthead />);

        // Wait for error handling and component to update
        await waitFor(() => {
            expect(screen.getByText('Editors')).toBeInTheDocument();
        });

        // Verify that the component still renders without crashing
        expect(screen.getByText('Managing Editors')).toBeInTheDocument();
        expect(screen.getByText('Consulting Editors')).toBeInTheDocument();

        // Restore console.error
        consoleSpy.mockRestore();
    });

    test('renders executive committee note', async () => {
        getMasthead.mockResolvedValueOnce(mockMastheadData);
        render(<Masthead />);

        // Wait for data to load and component to update
        await waitFor(() => {
            expect(screen.getByText('* Executive committee')).toBeInTheDocument();
        });
    });
}); 