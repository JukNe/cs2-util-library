import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock session data for testing
export const mockSession = {
    user: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        emailVerified: false,
        image: undefined,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        password: 'hashed-password',
        emailVerifiedAt: null,
    },
}

export const mockVerifiedSession = {
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

// Mock API responses
export const mockApiResponses = {
    userLimits: {
        unverified: {
            success: true,
            limits: {
                canCreateUtility: true,
                canCreateThrowingPoint: true,
                utilityCount: 0,
                throwingPointCount: 0,
            },
        },
        utilityLimitReached: {
            success: true,
            limits: {
                canCreateUtility: false,
                canCreateThrowingPoint: true,
                utilityCount: 1,
                throwingPointCount: 0,
            },
        },
        throwingPointLimitReached: {
            success: true,
            limits: {
                canCreateUtility: true,
                canCreateThrowingPoint: false,
                utilityCount: 0,
                throwingPointCount: 1,
            },
        },
        verified: {
            success: true,
            limits: {
                canCreateUtility: true,
                canCreateThrowingPoint: true,
                utilityCount: -1,
                throwingPointCount: -1,
            },
        },
    },
    verificationError: {
        success: false,
        error: 'Unverified users can only create one utility. Please verify your email to create more utilities.',
        requiresVerification: true,
    },
    resendVerification: {
        success: true,
        message: 'Verification email sent successfully!',
    },
}

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>
}

const customRender = (
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Helper function to mock fetch responses
export const mockFetchResponse = (response: unknown, status = 200) => {
    return Promise.resolve(new Response(JSON.stringify(response), {
        status,
        statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
        headers: {
            'Content-Type': 'application/json'
        }
    }))
}

// Helper function to create user event
export const createUserEvent = () => {
    return userEvent.setup()
}

// Helper function to wait for async operations
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Simple test to prevent "no tests" error
describe('Test Utilities', () => {
    it('should export test utilities', () => {
        expect(mockSession).toBeDefined()
        expect(mockApiResponses).toBeDefined()
        expect(mockFetchResponse).toBeDefined()
        expect(createUserEvent).toBeDefined()
    })
})