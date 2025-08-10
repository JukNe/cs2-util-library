import { NextRequest } from 'next/server'
import { GET } from '@/app/api/auth/check-user-limits/route'
import { validateSessionWithVerification, checkUnverifiedUserLimits } from '@/lib/session'

// Mock the session functions
jest.mock('@/lib/session', () => ({
    validateSessionWithVerification: jest.fn(),
    checkUnverifiedUserLimits: jest.fn(),
}))

const mockValidateSessionWithVerification = validateSessionWithVerification as jest.MockedFunction<typeof validateSessionWithVerification>
const mockCheckUnverifiedUserLimits = checkUnverifiedUserLimits as jest.MockedFunction<typeof checkUnverifiedUserLimits>

describe('GET /api/auth/check-user-limits', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should return 401 when user is not authenticated', async () => {
        mockValidateSessionWithVerification.mockResolvedValue({
            success: false,
            userId: null,
            user: null,
            isEmailVerified: false,
        })

        const request = new NextRequest('http://localhost:3000/api/auth/check-user-limits')

        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data).toEqual({
            success: false,
            error: 'User not authenticated',
        })
    })

    it('should return unlimited access for verified users', async () => {
        mockValidateSessionWithVerification.mockResolvedValue({
            success: true,
            userId: 'user-id',
            user: {
                id: 'user-id',
                name: 'Test User',
                email: 'test@example.com',
                emailVerified: true,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01'),
                password: 'hashed-password',
                emailVerifiedAt: new Date('2024-01-01'),
                image: null,
            },
            isEmailVerified: true,
        })

        const request = new NextRequest('http://localhost:3000/api/auth/check-user-limits')

        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toEqual({
            success: true,
            limits: {
                canCreateUtility: true,
                canCreateThrowingPoint: true,
                utilityCount: -1,
                throwingPointCount: -1,
            },
        })

        expect(mockCheckUnverifiedUserLimits).not.toHaveBeenCalled()
    })

    it('should return limits for unverified users', async () => {
        mockValidateSessionWithVerification.mockResolvedValue({
            success: true,
            userId: 'user-id',
            user: {
                id: 'user-id',
                name: 'Test User',
                email: 'test@example.com',
                emailVerified: false,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01'),
                password: 'hashed-password',
                emailVerifiedAt: null,
                image: null,
            },
            isEmailVerified: false,
        })

        const mockLimits = {
            canCreateUtility: true,
            canCreateThrowingPoint: true,
            utilityCount: 0,
            throwingPointCount: 0,
        }

        mockCheckUnverifiedUserLimits.mockResolvedValue(mockLimits)

        const request = new NextRequest('http://localhost:3000/api/auth/check-user-limits')

        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toEqual({
            success: true,
            limits: mockLimits,
        })

        expect(mockCheckUnverifiedUserLimits).toHaveBeenCalledWith('user-id')
    })

    it('should return limits for unverified users with reached limits', async () => {
        mockValidateSessionWithVerification.mockResolvedValue({
            success: true,
            userId: 'user-id',
            user: {
                id: 'user-id',
                name: 'Test User',
                email: 'test@example.com',
                emailVerified: false,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01'),
                password: 'hashed-password',
                emailVerifiedAt: null,
                image: null,
            },
            isEmailVerified: false,
        })

        const mockLimits = {
            canCreateUtility: false,
            canCreateThrowingPoint: false,
            utilityCount: 1,
            throwingPointCount: 1,
        }

        mockCheckUnverifiedUserLimits.mockResolvedValue(mockLimits)

        const request = new NextRequest('http://localhost:3000/api/auth/check-user-limits')

        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toEqual({
            success: true,
            limits: mockLimits,
        })

        expect(mockCheckUnverifiedUserLimits).toHaveBeenCalledWith('user-id')
    })

    it('should handle errors gracefully', async () => {
        mockValidateSessionWithVerification.mockRejectedValue(new Error('Database error'))

        const request = new NextRequest('http://localhost:3000/api/auth/check-user-limits')

        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data).toEqual({
            success: false,
            error: 'Database error',
        })
    })

    it('should handle unknown errors', async () => {
        mockValidateSessionWithVerification.mockRejectedValue('Unknown error')

        const request = new NextRequest('http://localhost:3000/api/auth/check-user-limits')

        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data).toEqual({
            success: false,
            error: 'Unknown error',
        })
    })
})
