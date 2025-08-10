import { NextRequest } from 'next/server'
import { validateSession, validateSessionWithVerification, checkUnverifiedUserLimits } from '@/lib/session'
import prisma from '@/lib/prisma'

// Define types for test data
interface MockUser {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
}

interface MockSession {
    token: string;
    expiresAt: Date;
    user: MockUser;
}

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
    session: {
        findUnique: jest.fn() as jest.MockedFunction<() => Promise<MockSession | null>>,
    },
    utility: {
        count: jest.fn() as jest.MockedFunction<() => Promise<number>>,
    },
    throwingPoint: {
        count: jest.fn() as jest.MockedFunction<() => Promise<number>>,
    },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Session Validation', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('validateSession', () => {
        it('should return failure when no session token is provided', async () => {
            const request = {
                cookies: {
                    get: jest.fn().mockReturnValue(undefined),
                },
            } as unknown as NextRequest

            const result = await validateSession(request)

            expect(result).toEqual({
                success: false,
                userId: null,
                user: null,
            })
        })

        it('should return failure when session is not found', async () => {
            const request = {
                cookies: {
                    get: jest.fn().mockReturnValue({ value: 'invalid-token' }),
                },
            } as unknown as NextRequest

                ; (mockPrisma.session.findUnique as jest.Mock).mockResolvedValue(null)

            const result = await validateSession(request)

            expect(result).toEqual({
                success: false,
                userId: null,
                user: null,
            })
        })

        it('should return failure when session is expired', async () => {
            const request = {
                cookies: {
                    get: jest.fn().mockReturnValue({ value: 'expired-token' }),
                },
            } as unknown as NextRequest

            const expiredDate = new Date()
            expiredDate.setHours(expiredDate.getHours() - 1) // 1 hour ago

                ; (mockPrisma.session.findUnique as jest.Mock).mockResolvedValue({
                    token: 'expired-token',
                    expiresAt: expiredDate,
                    user: {
                        id: 'user-id',
                        name: 'Test User',
                        email: 'test@example.com',
                        emailVerified: false,
                    },
                } as MockSession)

            const result = await validateSession(request)

            expect(result).toEqual({
                success: false,
                userId: null,
                user: null,
            })
        })

        it('should return success when session is valid', async () => {
            const request = {
                cookies: {
                    get: jest.fn().mockReturnValue({ value: 'valid-token' }),
                },
            } as unknown as NextRequest

            const futureDate = new Date()
            futureDate.setHours(futureDate.getHours() + 1) // 1 hour from now

            const mockUser = {
                id: 'user-id',
                name: 'Test User',
                email: 'test@example.com',
                emailVerified: false,
            }

                ; (mockPrisma.session.findUnique as jest.Mock).mockResolvedValue({
                    token: 'valid-token',
                    expiresAt: futureDate,
                    user: mockUser,
                } as MockSession)

            const result = await validateSession(request)

            expect(result).toEqual({
                success: true,
                userId: 'user-id',
                user: mockUser,
            })
        })
    })

    describe('validateSessionWithVerification', () => {
        it('should return failure with isEmailVerified false when session validation fails', async () => {
            const request = {
                cookies: {
                    get: jest.fn().mockReturnValue(undefined),
                },
            } as unknown as NextRequest

            const result = await validateSessionWithVerification(request)

            expect(result).toEqual({
                success: false,
                userId: null,
                user: null,
                isEmailVerified: false,
            })
        })

        it('should return success with isEmailVerified true when user is verified', async () => {
            const request = {
                cookies: {
                    get: jest.fn().mockReturnValue({ value: 'valid-token' }),
                },
            } as unknown as NextRequest

            const futureDate = new Date()
            futureDate.setHours(futureDate.getHours() + 1)

            const mockUser = {
                id: 'user-id',
                name: 'Test User',
                email: 'test@example.com',
                emailVerified: true,
            }

                ; (mockPrisma.session.findUnique as jest.Mock).mockResolvedValue({
                    token: 'valid-token',
                    expiresAt: futureDate,
                    user: mockUser,
                } as MockSession)

            const result = await validateSessionWithVerification(request)

            expect(result).toEqual({
                success: true,
                userId: 'user-id',
                user: mockUser,
                isEmailVerified: true,
            })
        })

        it('should return success with isEmailVerified false when user is not verified', async () => {
            const request = {
                cookies: {
                    get: jest.fn().mockReturnValue({ value: 'valid-token' }),
                },
            } as unknown as NextRequest

            const futureDate = new Date()
            futureDate.setHours(futureDate.getHours() + 1)

            const mockUser = {
                id: 'user-id',
                name: 'Test User',
                email: 'test@example.com',
                emailVerified: false,
            }

                ; (mockPrisma.session.findUnique as jest.Mock).mockResolvedValue({
                    token: 'valid-token',
                    expiresAt: futureDate,
                    user: mockUser,
                } as MockSession)

            const result = await validateSessionWithVerification(request)

            expect(result).toEqual({
                success: true,
                userId: 'user-id',
                user: mockUser,
                isEmailVerified: false,
            })
        })
    })

    describe('checkUnverifiedUserLimits', () => {
        it('should return correct limits for user with no utilities or throwing points', async () => {
            ; (mockPrisma.utility.count as jest.Mock).mockResolvedValue(0)
                ; (mockPrisma.throwingPoint.count as jest.Mock).mockResolvedValue(0)

            const result = await checkUnverifiedUserLimits('user-id')

            expect(result).toEqual({
                canCreateUtility: true,
                canCreateThrowingPoint: true,
                utilityCount: 0,
                throwingPointCount: 0,
            })

            expect(mockPrisma.utility.count).toHaveBeenCalledWith({
                where: { createdBy: 'user-id' },
            })

            expect(mockPrisma.throwingPoint.count).toHaveBeenCalledWith({
                where: {
                    utility: {
                        createdBy: 'user-id',
                    },
                },
            })
        })

        it('should return correct limits for user with one utility', async () => {
            ; (mockPrisma.utility.count as jest.Mock).mockResolvedValue(1)
                ; (mockPrisma.throwingPoint.count as jest.Mock).mockResolvedValue(0)

            const result = await checkUnverifiedUserLimits('user-id')

            expect(result).toEqual({
                canCreateUtility: false,
                canCreateThrowingPoint: true,
                utilityCount: 1,
                throwingPointCount: 0,
            })
        })

        it('should return correct limits for user with one throwing point', async () => {
            ; (mockPrisma.utility.count as jest.Mock).mockResolvedValue(0)
                ; (mockPrisma.throwingPoint.count as jest.Mock).mockResolvedValue(1)

            const result = await checkUnverifiedUserLimits('user-id')

            expect(result).toEqual({
                canCreateUtility: true,
                canCreateThrowingPoint: false,
                utilityCount: 0,
                throwingPointCount: 1,
            })
        })

        it('should return correct limits for user with both utility and throwing point', async () => {
            ; (mockPrisma.utility.count as jest.Mock).mockResolvedValue(1)
                ; (mockPrisma.throwingPoint.count as jest.Mock).mockResolvedValue(1)

            const result = await checkUnverifiedUserLimits('user-id')

            expect(result).toEqual({
                canCreateUtility: false,
                canCreateThrowingPoint: false,
                utilityCount: 1,
                throwingPointCount: 1,
            })
        })
    })
})
