import React from 'react'
import { render, screen, fireEvent } from '@/__tests__/utils/test-utils'
import { waitFor } from '@testing-library/react'
import { EmailVerificationWrapper } from '@/components/emailVerification/EmailVerificationWrapper'
import { mockSession, mockApiResponses } from '@/__tests__/utils/test-utils'

// Mock fetch
global.fetch = jest.fn()

// Mock the hooks
jest.mock('@/hooks/useEmailVerification', () => ({
    useEmailVerification: jest.fn(),
    useUserLimits: jest.fn(),
}))

import { useEmailVerification, useUserLimits } from '@/hooks/useEmailVerification'

const mockUseEmailVerification = useEmailVerification as jest.MockedFunction<typeof useEmailVerification>
const mockUseUserLimits = useUserLimits as jest.MockedFunction<typeof useUserLimits>

describe('Email Verification Flow - E2E', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        // Default mock implementations
        mockUseEmailVerification.mockReturnValue({
            resendVerification: jest.fn(),
            isResending: false,
            error: null,
            success: null,
        })
    })

    describe('Unverified User Experience', () => {
        it('should show banner initially for unverified user', () => {
            mockUseUserLimits.mockReturnValue({
                limits: mockApiResponses.userLimits.unverified.limits,
                isLoading: false,
                error: null,
                refreshLimits: jest.fn(),
            })

            render(<EmailVerificationWrapper session={mockSession} />)

            expect(screen.getByText('Verify your email address')).toBeInTheDocument()
            expect(screen.getByText(/We sent a verification email to/)).toBeInTheDocument()
            expect(screen.getByText('test@example.com')).toBeInTheDocument()
        })

        it('should show limit prompt when user creates one utility', () => {
            mockUseUserLimits.mockReturnValue({
                limits: mockApiResponses.userLimits.utilityLimitReached.limits,
                isLoading: false,
                error: null,
                refreshLimits: jest.fn(),
            })

            render(<EmailVerificationWrapper session={mockSession} />)

            expect(screen.getByText('Email Verification Required')).toBeInTheDocument()
            expect(screen.getByText(/You've reached the limit for unverified users/)).toBeInTheDocument()
            expect(screen.queryByText('Verify your email address')).not.toBeInTheDocument()
        })

        it('should show limit prompt when user creates one throwing point', () => {
            mockUseUserLimits.mockReturnValue({
                limits: mockApiResponses.userLimits.throwingPointLimitReached.limits,
                isLoading: false,
                error: null,
                refreshLimits: jest.fn(),
            })

            render(<EmailVerificationWrapper session={mockSession} />)

            expect(screen.getByText('Email Verification Required')).toBeInTheDocument()
            expect(screen.getByText(/You've reached the limit for unverified users/)).toBeInTheDocument()
        })

        it('should show limit prompt when user hits both limits', () => {
            mockUseUserLimits.mockReturnValue({
                limits: {
                    canCreateUtility: false,
                    canCreateThrowingPoint: false,
                    utilityCount: 1,
                    throwingPointCount: 1,
                },
                isLoading: false,
                error: null,
                refreshLimits: jest.fn(),
            })

            render(<EmailVerificationWrapper session={mockSession} />)

            expect(screen.getByText('Email Verification Required')).toBeInTheDocument()
            expect(screen.getByText(/You've reached the limit for unverified users/)).toBeInTheDocument()
        })
    })

    describe('Verified User Experience', () => {
        it('should not show any verification prompts for verified user', () => {
            const verifiedSession = {
                user: {
                    id: 'test-user-id',
                    name: 'Test User',
                    email: 'test@example.com',
                    emailVerified: true,
                    image: undefined,
                    createdAt: new Date('2024-01-01'),
                    updatedAt: new Date('2024-01-01'),
                    password: 'hashed-password',
                    emailVerifiedAt: new Date('2024-01-01'),
                },
            }

            render(<EmailVerificationWrapper session={verifiedSession} />)

            expect(screen.queryByText('Verify your email address')).not.toBeInTheDocument()
            expect(screen.queryByText('Email Verification Required')).not.toBeInTheDocument()
        })
    })

    describe('Resend Verification Flow', () => {
        it('should handle successful resend verification', async () => {
            const mockResendVerification = jest.fn().mockResolvedValue(undefined)
            mockUseEmailVerification.mockReturnValue({
                resendVerification: mockResendVerification,
                isResending: false,
                error: null,
                success: null,
            })

            mockUseUserLimits.mockReturnValue({
                limits: mockApiResponses.userLimits.unverified.limits,
                isLoading: false,
                error: null,
                refreshLimits: jest.fn(),
            })

            render(<EmailVerificationWrapper session={mockSession} />)

            const resendButton = screen.getByRole('button', { name: 'Resend Email' })
            fireEvent.click(resendButton)

            await waitFor(() => {
                expect(screen.getByText('Verification email sent successfully!')).toBeInTheDocument()
            })
        })

        it('should handle failed resend verification', async () => {
            const mockResendVerification = jest.fn().mockRejectedValue(new Error('Failed to send'))
            mockUseEmailVerification.mockReturnValue({
                resendVerification: mockResendVerification,
                isResending: false,
                error: null,
                success: null,
            })

            mockUseUserLimits.mockReturnValue({
                limits: mockApiResponses.userLimits.unverified.limits,
                isLoading: false,
                error: null,
                refreshLimits: jest.fn(),
            })

            render(<EmailVerificationWrapper session={mockSession} />)

            const resendButton = screen.getByRole('button', { name: 'Resend Email' })
            fireEvent.click(resendButton)

            await waitFor(() => {
                expect(screen.getByText('Failed to send verification email. Please try again.')).toBeInTheDocument()
            })
        })

        it('should show loading state during resend', async () => {
            const mockResendVerification = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
            mockUseEmailVerification.mockReturnValue({
                resendVerification: mockResendVerification,
                isResending: false,
                error: null,
                success: null,
            })

            mockUseUserLimits.mockReturnValue({
                limits: mockApiResponses.userLimits.unverified.limits,
                isLoading: false,
                error: null,
                refreshLimits: jest.fn(),
            })

            render(<EmailVerificationWrapper session={mockSession} />)

            const resendButton = screen.getByRole('button', { name: 'Resend Email' })
            fireEvent.click(resendButton)

            expect(screen.getByRole('button', { name: 'Sending...' })).toBeInTheDocument()
            expect(screen.getByRole('button', { name: 'Sending...' })).toBeDisabled()
        })
    })

    describe('Manual Verification Link', () => {
        it('should have correct link to manual verification page', () => {
            mockUseUserLimits.mockReturnValue({
                limits: mockApiResponses.userLimits.unverified.limits,
                isLoading: false,
                error: null,
                refreshLimits: jest.fn(),
            })

            render(<EmailVerificationWrapper session={mockSession} />)

            const manualVerifyLink = screen.getByRole('link', { name: 'Manual Verification' })
            expect(manualVerifyLink).toHaveAttribute('href', '/verify-email')
        })

        it('should have correct link in limit prompt', () => {
            mockUseUserLimits.mockReturnValue({
                limits: mockApiResponses.userLimits.utilityLimitReached.limits,
                isLoading: false,
                error: null,
                refreshLimits: jest.fn(),
            })

            render(<EmailVerificationWrapper session={mockSession} />)

            const manualVerifyLink = screen.getByRole('link', { name: 'Manual Verification' })
            expect(manualVerifyLink).toHaveAttribute('href', '/verify-email')
        })
    })

    describe('Error Handling', () => {
        it('should handle loading state gracefully', () => {
            mockUseUserLimits.mockReturnValue({
                limits: null,
                isLoading: true,
                error: null,
                refreshLimits: jest.fn(),
            })

            render(<EmailVerificationWrapper session={mockSession} />)

            // Should show banner when loading
            expect(screen.getByText('Verify your email address')).toBeInTheDocument()
        })

        it('should handle error state gracefully', () => {
            mockUseUserLimits.mockReturnValue({
                limits: null,
                isLoading: false,
                error: 'Failed to fetch limits',
                refreshLimits: jest.fn(),
            })

            render(<EmailVerificationWrapper session={mockSession} />)

            // Should show banner when there's an error
            expect(screen.getByText('Verify your email address')).toBeInTheDocument()
        })
    })

    describe('State Transitions', () => {
        it('should transition from banner to prompt when limits are reached', async () => {
            const mockRefreshLimits = jest.fn()

            // Start with no limits
            mockUseUserLimits.mockReturnValue({
                limits: mockApiResponses.userLimits.unverified.limits,
                isLoading: false,
                error: null,
                refreshLimits: mockRefreshLimits,
            })

            const { rerender } = render(<EmailVerificationWrapper session={mockSession} />)

            expect(screen.getByText('Verify your email address')).toBeInTheDocument()
            expect(screen.queryByText('Email Verification Required')).not.toBeInTheDocument()

            // Simulate limits being reached
            mockUseUserLimits.mockReturnValue({
                limits: mockApiResponses.userLimits.utilityLimitReached.limits,
                isLoading: false,
                error: null,
                refreshLimits: mockRefreshLimits,
            })

            rerender(<EmailVerificationWrapper session={mockSession} />)

            expect(screen.getByText('Email Verification Required')).toBeInTheDocument()
            expect(screen.queryByText('Verify your email address')).not.toBeInTheDocument()
        })
    })
})
