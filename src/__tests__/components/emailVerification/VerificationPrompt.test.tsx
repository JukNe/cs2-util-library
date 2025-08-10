import React from 'react'
import { render, screen, fireEvent } from '@/__tests__/utils/test-utils'
import { waitFor } from '@testing-library/react'
import { VerificationPrompt } from '@/components/emailVerification/VerificationPrompt'

describe('VerificationPrompt', () => {
    const defaultProps = {
        title: 'Email Verification Required',
        message: 'Please verify your email to continue.',
        email: 'test@example.com',
        isVerified: false,
        onResendVerification: jest.fn(),
        variant: 'banner' as const,
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should not render when user is verified', () => {
        render(<VerificationPrompt {...defaultProps} isVerified={true} />)

        expect(screen.queryByText('Email Verification Required')).not.toBeInTheDocument()
    })

    it('should render banner variant with correct content', () => {
        render(<VerificationPrompt {...defaultProps} />)

        expect(screen.getByText('Email Verification Required')).toBeInTheDocument()
        expect(screen.getByText('Please verify your email to continue.')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Resend Email' })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Manual Verification' })).toBeInTheDocument()
    })

    it('should render modal variant with correct content', () => {
        render(<VerificationPrompt {...defaultProps} variant="modal" />)

        expect(screen.getByText('Email Verification Required')).toBeInTheDocument()
        expect(screen.getByText('Please verify your email to continue.')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Resend Email' })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Manual Verification' })).toBeInTheDocument()
    })

    it('should call onResendVerification when resend button is clicked', async () => {
        const mockOnResendVerification = jest.fn()
        render(<VerificationPrompt {...defaultProps} onResendVerification={mockOnResendVerification} />)

        const resendButton = screen.getByRole('button', { name: 'Resend Email' })
        fireEvent.click(resendButton)

        expect(mockOnResendVerification).toHaveBeenCalledTimes(1)
    })

    it('should show loading state when resending', async () => {
        const mockOnResendVerification = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
        render(<VerificationPrompt {...defaultProps} onResendVerification={mockOnResendVerification} />)

        const resendButton = screen.getByRole('button', { name: 'Resend Email' })
        fireEvent.click(resendButton)

        expect(screen.getByRole('button', { name: 'Sending...' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Sending...' })).toBeDisabled()
    })

    it('should show success message after successful resend', async () => {
        const mockOnResendVerification = jest.fn().mockResolvedValue(undefined)
        render(<VerificationPrompt {...defaultProps} onResendVerification={mockOnResendVerification} />)

        const resendButton = screen.getByRole('button', { name: 'Resend Email' })
        fireEvent.click(resendButton)

        await waitFor(() => {
            expect(screen.getByText('Verification email sent successfully!')).toBeInTheDocument()
        })
    })

    it('should show error message after failed resend', async () => {
        const mockOnResendVerification = jest.fn().mockRejectedValue(new Error('Failed to send'))
        render(<VerificationPrompt {...defaultProps} onResendVerification={mockOnResendVerification} />)

        const resendButton = screen.getByRole('button', { name: 'Resend Email' })
        fireEvent.click(resendButton)

        await waitFor(() => {
            expect(screen.getByText('Failed to send verification email. Please try again.')).toBeInTheDocument()
        })
    })

    it('should have correct link to manual verification page', () => {
        render(<VerificationPrompt {...defaultProps} />)

        const manualVerifyLink = screen.getByRole('link', { name: 'Manual Verification' })
        expect(manualVerifyLink).toHaveAttribute('href', '/verify-email')
    })

    it('should have proper CSS classes for banner variant', () => {
        const { container } = render(<VerificationPrompt {...defaultProps} variant="banner" />)

        const promptElement = container.querySelector('.verification-prompt.banner')
        expect(promptElement).toBeInTheDocument()
    })

    it('should have proper CSS classes for modal variant', () => {
        const { container } = render(<VerificationPrompt {...defaultProps} variant="modal" />)

        const promptElement = container.querySelector('.verification-prompt.modal')
        expect(promptElement).toBeInTheDocument()
    })

    it('should display warning icon', () => {
        render(<VerificationPrompt {...defaultProps} />)

        // The icon should be present (BsExclamationTriangle)
        const iconElement = document.querySelector('svg')
        expect(iconElement).toBeInTheDocument()
    })

    it('should handle missing onResendVerification prop gracefully', () => {
        const { onResendVerification: _onResendVerification, ...propsWithoutHandler } = defaultProps
        render(<VerificationPrompt {...propsWithoutHandler} />)

        const resendButton = screen.getByRole('button', { name: 'Resend Email' })
        fireEvent.click(resendButton)

        // Should not throw error
        expect(resendButton).toBeInTheDocument()
    })

    it('should display custom title and message', () => {
        const customProps = {
            ...defaultProps,
            title: 'Custom Title',
            message: 'Custom message for testing.',
        }

        render(<VerificationPrompt {...customProps} />)

        expect(screen.getByText('Custom Title')).toBeInTheDocument()
        expect(screen.getByText('Custom message for testing.')).toBeInTheDocument()
    })

    it('should have proper accessibility attributes', () => {
        render(<VerificationPrompt {...defaultProps} />)

        const resendButton = screen.getByRole('button', { name: 'Resend Email' })
        expect(resendButton).toBeInTheDocument()

        const manualVerifyLink = screen.getByRole('link', { name: 'Manual Verification' })
        expect(manualVerifyLink).toBeInTheDocument()
    })
})
