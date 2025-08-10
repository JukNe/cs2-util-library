import { renderHook, act } from '@testing-library/react'
import { waitFor } from '@testing-library/react'
import { useEmailVerification, useUserLimits, useVerificationError } from '@/hooks/useEmailVerification'
import { mockApiResponses, mockFetchResponse } from '@/__tests__/utils/test-utils'

// Mock fetch
global.fetch = jest.fn()

describe('Email Verification Hooks', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('useEmailVerification', () => {
        it('should have initial state', () => {
            const { result } = renderHook(() => useEmailVerification())

            expect(result.current).toEqual({
                resendVerification: expect.any(Function),
                isResending: false,
                error: null,
                success: null,
            })
        })

        it('should successfully resend verification email', async () => {
            const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
            mockFetch.mockResolvedValue(mockFetchResponse(mockApiResponses.resendVerification))

            const { result } = renderHook(() => useEmailVerification())

            await act(async () => {
                await result.current.resendVerification('test@example.com')
            })

            await waitFor(() => {
                expect(result.current.success).toBe('Verification email sent successfully!')
                expect(result.current.error).toBe(null)
                expect(result.current.isResending).toBe(false)
            }, { timeout: 3000 })

            expect(mockFetch).toHaveBeenCalledWith('/api/auth/resend-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: 'test@example.com' }),
            })
        })

        it('should handle resend verification error', async () => {
            const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
            mockFetch.mockResolvedValue(mockFetchResponse(
                { success: false, error: 'Failed to send email' },
                400
            ))

            const { result } = renderHook(() => useEmailVerification())

            await act(async () => {
                await result.current.resendVerification('test@example.com')
            })

            await waitFor(() => {
                expect(result.current.error).toBe('Failed to send email')
                expect(result.current.success).toBe(null)
                expect(result.current.isResending).toBe(false)
            }, { timeout: 3000 })
        })

        it('should handle network error', async () => {
            const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
            mockFetch.mockRejectedValue(new Error('Network error'))

            const { result } = renderHook(() => useEmailVerification())

            await act(async () => {
                await result.current.resendVerification('test@example.com')
            })

            await waitFor(() => {
                expect(result.current.error).toBe('Failed to resend verification email. Please try again.')
                expect(result.current.success).toBe(null)
                expect(result.current.isResending).toBe(false)
            })
        })

        it('should set isResending state correctly', async () => {
            const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
            mockFetch.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockFetchResponse(mockApiResponses.resendVerification)), 100)))

            const { result } = renderHook(() => useEmailVerification())

            act(() => {
                result.current.resendVerification('test@example.com')
            })

            expect(result.current.isResending).toBe(true)

            await waitFor(() => {
                expect(result.current.isResending).toBe(false)
            })
        })
    })

    describe('useUserLimits', () => {
        it('should have initial state', () => {
            const { result } = renderHook(() => useUserLimits())

            expect(result.current).toEqual({
                limits: null,
                isLoading: false,
                error: null,
                refreshLimits: expect.any(Function),
            })
        })

        it('should successfully fetch user limits for unverified user', async () => {
            const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
            mockFetch.mockResolvedValue(mockFetchResponse(mockApiResponses.userLimits.unverified))

            const { result } = renderHook(() => useUserLimits())

            await act(async () => {
                await result.current.refreshLimits()
            })

            await waitFor(() => {
                expect(result.current.limits).toEqual(mockApiResponses.userLimits.unverified.limits)
                expect(result.current.error).toBe(null)
                expect(result.current.isLoading).toBe(false)
            }, { timeout: 3000 })

            expect(mockFetch).toHaveBeenCalledWith('/api/auth/check-user-limits', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
        })

        it('should handle user limits error', async () => {
            const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
            mockFetch.mockResolvedValue(mockFetchResponse(
                { success: false, error: 'Failed to fetch limits' },
                400
            ))

            const { result } = renderHook(() => useUserLimits())

            await act(async () => {
                await result.current.refreshLimits()
            })

            await waitFor(() => {
                expect(result.current.error).toBe('Failed to fetch limits')
                expect(result.current.limits).toBe(null)
                expect(result.current.isLoading).toBe(false)
            }, { timeout: 3000 })
        })

        it('should handle network error', async () => {
            const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
            mockFetch.mockRejectedValue(new Error('Network error'))

            const { result } = renderHook(() => useUserLimits())

            await act(async () => {
                await result.current.refreshLimits()
            })

            await waitFor(() => {
                expect(result.current.error).toBe('Failed to fetch user limits')
                expect(result.current.limits).toBe(null)
                expect(result.current.isLoading).toBe(false)
            })
        })

        it('should set isLoading state correctly', async () => {
            const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
            mockFetch.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockFetchResponse(mockApiResponses.userLimits.unverified)), 100)))

            const { result } = renderHook(() => useUserLimits())

            act(() => {
                result.current.refreshLimits()
            })

            expect(result.current.isLoading).toBe(true)

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })
        })
    })

    describe('useVerificationError', () => {
        it('should have initial state', () => {
            const { result } = renderHook(() => useVerificationError())

            expect(result.current).toEqual({
                handleApiError: expect.any(Function),
                showVerificationPrompt: false,
                verificationError: null,
                closeVerificationPrompt: expect.any(Function),
            })
        })

        it('should handle verification error and show prompt', () => {
            const { result } = renderHook(() => useVerificationError())

            act(() => {
                const wasHandled = result.current.handleApiError(mockApiResponses.verificationError)
                expect(wasHandled).toBe(true)
            })

            expect(result.current.showVerificationPrompt).toBe(true)
            expect(result.current.verificationError).toEqual(mockApiResponses.verificationError)
        })

        it('should handle error with requiresVerification flag', () => {
            const { result } = renderHook(() => useVerificationError())

            const error = { requiresVerification: true, error: 'Test error' }

            act(() => {
                const wasHandled = result.current.handleApiError(error)
                expect(wasHandled).toBe(true)
            })

            expect(result.current.showVerificationPrompt).toBe(true)
            expect(result.current.verificationError).toEqual(error)
        })

        it('should handle error with verification message in error field', () => {
            const { result } = renderHook(() => useVerificationError())

            const error = { error: 'Please verify your email to continue' }

            act(() => {
                const wasHandled = result.current.handleApiError(error)
                expect(wasHandled).toBe(true)
            })

            expect(result.current.showVerificationPrompt).toBe(true)
            expect(result.current.verificationError).toEqual(error)
        })

        it('should handle error with verification message in message field', () => {
            const { result } = renderHook(() => useVerificationError())

            const error = { message: 'Please verify your email to continue' }

            act(() => {
                const wasHandled = result.current.handleApiError(error)
                expect(wasHandled).toBe(true)
            })

            expect(result.current.showVerificationPrompt).toBe(true)
            expect(result.current.verificationError).toEqual(error)
        })

        it('should not handle non-verification errors', () => {
            const { result } = renderHook(() => useVerificationError())

            const error = { error: 'Some other error' }

            act(() => {
                const wasHandled = result.current.handleApiError(error)
                expect(wasHandled).toBe(false)
            })

            expect(result.current.showVerificationPrompt).toBe(false)
            expect(result.current.verificationError).toBe(null)
        })

        it('should close verification prompt', () => {
            const { result } = renderHook(() => useVerificationError())

            // First show the prompt
            act(() => {
                result.current.handleApiError(mockApiResponses.verificationError)
            })

            expect(result.current.showVerificationPrompt).toBe(true)

            // Then close it
            act(() => {
                result.current.closeVerificationPrompt()
            })

            expect(result.current.showVerificationPrompt).toBe(false)
            expect(result.current.verificationError).toBe(null)
        })
    })
})
