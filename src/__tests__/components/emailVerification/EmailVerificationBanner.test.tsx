import React from 'react'
import { render, screen, fireEvent } from '@/__tests__/utils/test-utils'
import { waitFor } from '@testing-library/react'
import { EmailVerificationBanner } from '@/components/emailVerification/EmailVerificationBanner'
import { mockApiResponses, mockFetchResponse } from '@/__tests__/utils/test-utils'

// Mock fetch
global.fetch = jest.fn()

describe('EmailVerificationBanner', () => {
    const defaultProps = {
        email: 'test@example.com',
        isVerified: false,
        onResendVerification: jest.fn(),
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should not render when user is verified', () => {
        render(<EmailVerificationBanner {...defaultProps} isVerified={true} />)

        expect(screen.queryByText('Verify your email address')).not.toBeInTheDocument()
    })

    it('should render banner with correct content when user is not verified', () => {
        render(<EmailVerificationBanner {...defaultProps} />)

        expect(screen.getByText('Verify your email address')).toBeInTheDocument()
        expect(screen.getByText(/We sent a verification email to/)).toBeInTheDocument()
        expect(screen.getByText('test@example.com')).toBeInTheDocument()
        expect(screen.getByText(/Please check your inbox and click the verification link/)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Resend Email' })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Manual Verification' })).toBeInTheDocument()
    })

    it('should call onResendVerification when resend button is clicked', async () => {
        const mockOnResendVerification = jest.fn()
        render(<EmailVerificationBanner {...defaultProps} onResendVerification={mockOnResendVerification} />)

        const resendButton = screen.getByRole('button', { name: 'Resend Email' })
        fireEvent.click(resendButton)

        expect(mockOnResendVerification).toHaveBeenCalledTimes(1)
    })

    it('should show loading state when resending', async () => {
        const mockOnResendVerification = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
        render(<EmailVerificationBanner {...defaultProps} onResendVerification={mockOnResendVerification} />)

        const resendButton = screen.getByRole('button', { name: 'Resend Email' })
        fireEvent.click(resendButton)

        expect(screen.getByRole('button', { name: 'Sending...' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Sending...' })).toBeDisabled()
    })

    it('should show success message after successful resend', async () => {
        const mockOnResendVerification = jest.fn().mockResolvedValue(undefined)
        render(<EmailVerificationBanner {...defaultProps} onResendVerification={mockOnResendVerification} />)

        const resendButton = screen.getByRole('button', { name: 'Resend Email' })
        fireEvent.click(resendButton)

        await waitFor(() => {
            expect(screen.getByText('Verification email sent successfully!')).toBeInTheDocument()
        })
    })

    it('should show error message after failed resend', async () => {
        const mockOnResendVerification = jest.fn().mockRejectedValue(new Error('Failed to send'))
        render(<EmailVerificationBanner {...defaultProps} onResendVerification={mockOnResendVerification} />)

        const resendButton = screen.getByRole('button', { name: 'Resend Email' })
        fireEvent.click(resendButton)

        await waitFor(() => {
            expect(screen.getByText('Failed to send verification email. Please try again.')).toBeInTheDocument()
        })
    })

    it('should have correct link to manual verification page', () => {
        render(<EmailVerificationBanner {...defaultProps} />)

        const manualVerifyLink = screen.getByRole('link', { name: 'Manual Verification' })
        expect(manualVerifyLink).toHaveAttribute('href', '/verify-email')
    })

    it('should display email address in bold', () => {
        render(<EmailVerificationBanner {...defaultProps} />)

        const emailElement = screen.getByText('test@example.com')
        // Check that the email is wrapped in a strong tag (which makes it bold)
        expect(emailElement.tagName).toBe('STRONG')
    })

    it('should have proper accessibility attributes', () => {
        render(<EmailVerificationBanner {...defaultProps} />)

        const resendButton = screen.getByRole('button', { name: 'Resend Email' })
        expect(resendButton).toBeInTheDocument()

        const manualVerifyLink = screen.getByRole('link', { name: 'Manual Verification' })
        expect(manualVerifyLink).toBeInTheDocument()
    })

    it('should handle missing onResendVerification prop gracefully', () => {
        const { onResendVerification, ...propsWithoutHandler } = defaultProps
        render(<EmailVerificationBanner {...propsWithoutHandler} />)

        const resendButton = screen.getByRole('button', { name: 'Resend Email' })
        fireEvent.click(resendButton)

        // Should not throw error
        expect(resendButton).toBeInTheDocument()
    })
})
