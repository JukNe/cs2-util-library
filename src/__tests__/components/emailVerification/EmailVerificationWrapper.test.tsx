import React from 'react'
import { render, screen } from '@/__tests__/utils/test-utils'
import { waitFor } from '@testing-library/react'
import { EmailVerificationWrapper } from '@/components/emailVerification/EmailVerificationWrapper'
import { mockSession, mockVerifiedSession, mockApiResponses } from '@/__tests__/utils/test-utils'

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

describe('EmailVerificationWrapper', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        // Default mock implementations
        mockUseEmailVerification.mockReturnValue({
            resendVerification: jest.fn(),
            isResending: false,
            error: null,
            success: null,
        })

        mockUseUserLimits.mockReturnValue({
            limits: null,
            isLoading: false,
            error: null,
            refreshLimits: jest.fn(),
        })
    })

    it('should not render anything when user is verified', () => {
        const { container } = render(<EmailVerificationWrapper session={mockVerifiedSession} />)

        expect(container.firstChild).toBeNull()
    })

    it('should render EmailVerificationBanner for unverified user with no limits', () => {
        mockUseUserLimits.mockReturnValue({
            limits: mockApiResponses.userLimits.unverified.limits,
            isLoading: false,
            error: null,
            refreshLimits: jest.fn(),
        })

        render(<EmailVerificationWrapper session={mockSession} />)

        expect(screen.getByText('Verify your email address')).toBeInTheDocument()
        expect(screen.getByText(/We sent a verification email to/)).toBeInTheDocument()
    })

    it('should render VerificationPrompt when user has hit limits', () => {
        mockUseUserLimits.mockReturnValue({
            limits: mockApiResponses.userLimits.utilityLimitReached.limits,
            isLoading: false,
            error: null,
            refreshLimits: jest.fn(),
        })

        render(<EmailVerificationWrapper session={mockSession} />)

        expect(screen.getByText('Email Verification Required')).toBeInTheDocument()
        expect(screen.getByText(/You've reached the limit for unverified users/)).toBeInTheDocument()
    })

    it('should render VerificationPrompt when user has hit throwing point limit', () => {
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

    it('should call refreshLimits when user is not verified', async () => {
        const mockRefreshLimits = jest.fn()
        mockUseUserLimits.mockReturnValue({
            limits: null,
            isLoading: false,
            error: null,
            refreshLimits: mockRefreshLimits,
        })

        render(<EmailVerificationWrapper session={mockSession} />)

        await waitFor(() => {
            expect(mockRefreshLimits).toHaveBeenCalled()
        })
    })

    it('should not call refreshLimits when user is verified', () => {
        const mockRefreshLimits = jest.fn()
        mockUseUserLimits.mockReturnValue({
            limits: null,
            isLoading: false,
            error: null,
            refreshLimits: mockRefreshLimits,
        })

        render(<EmailVerificationWrapper session={mockVerifiedSession} />)

        expect(mockRefreshLimits).not.toHaveBeenCalled()
    })

    it('should show banner when limits are not reached', () => {
        mockUseUserLimits.mockReturnValue({
            limits: {
                canCreateUtility: true,
                canCreateThrowingPoint: true,
                utilityCount: 0,
                throwingPointCount: 0,
            },
            isLoading: false,
            error: null,
            refreshLimits: jest.fn(),
        })

        render(<EmailVerificationWrapper session={mockSession} />)

        expect(screen.getByText('Verify your email address')).toBeInTheDocument()
        expect(screen.queryByText('Email Verification Required')).not.toBeInTheDocument()
    })

    it('should show prompt when utility limit is reached', () => {
        mockUseUserLimits.mockReturnValue({
            limits: {
                canCreateUtility: false,
                canCreateThrowingPoint: true,
                utilityCount: 1,
                throwingPointCount: 0,
            },
            isLoading: false,
            error: null,
            refreshLimits: jest.fn(),
        })

        render(<EmailVerificationWrapper session={mockSession} />)

        expect(screen.getByText('Email Verification Required')).toBeInTheDocument()
        expect(screen.queryByText('Verify your email address')).not.toBeInTheDocument()
    })

    it('should show prompt when throwing point limit is reached', () => {
        mockUseUserLimits.mockReturnValue({
            limits: {
                canCreateUtility: true,
                canCreateThrowingPoint: false,
                utilityCount: 0,
                throwingPointCount: 1,
            },
            isLoading: false,
            error: null,
            refreshLimits: jest.fn(),
        })

        render(<EmailVerificationWrapper session={mockSession} />)

        expect(screen.getByText('Email Verification Required')).toBeInTheDocument()
        expect(screen.queryByText('Verify your email address')).not.toBeInTheDocument()
    })

    it('should show prompt when both limits are reached', () => {
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
        expect(screen.queryByText('Verify your email address')).not.toBeInTheDocument()
    })

    it('should handle missing limits gracefully', () => {
        mockUseUserLimits.mockReturnValue({
            limits: null,
            isLoading: false,
            error: null,
            refreshLimits: jest.fn(),
        })

        render(<EmailVerificationWrapper session={mockSession} />)

        // Should show banner when limits are null
        expect(screen.getByText('Verify your email address')).toBeInTheDocument()
    })

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
})
