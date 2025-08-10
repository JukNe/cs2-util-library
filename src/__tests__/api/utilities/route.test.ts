import { NextRequest } from 'next/server'
import { GET, POST, DELETE } from '@/app/api/utilities/route'
import { validateSessionWithVerification, checkUnverifiedUserLimits } from '@/lib/session'
import prisma from '@/lib/prisma'

// Define types for test data
interface MockMap {
    id: string;
    name: string;
}

interface MockThrowingPoint {
    id: string;
    x: number;
    y: number;
    utilityId: string;
}

interface MockUtility {
    id: string;
    utilityType: string;
    team: string;
    landingPointX: number;
    landingPointY: number;
    throwingPoints: MockThrowingPoint[];
    title?: string;
    description?: string;
    createdBy?: string;
    mapId?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

// Mock the session functions and Prisma
jest.mock('@/lib/session', () => ({
    validateSessionWithVerification: jest.fn(),
    checkUnverifiedUserLimits: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
    map: {
        findUnique: jest.fn(),
    },
    utility: {
        findMany: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn(),
    },
    session: {
        findUnique: jest.fn(),
    },
    throwingPoint: {
        count: jest.fn(),
    },
}))

const mockValidateSessionWithVerification = validateSessionWithVerification as jest.MockedFunction<typeof validateSessionWithVerification>
const mockCheckUnverifiedUserLimits = checkUnverifiedUserLimits as jest.MockedFunction<typeof checkUnverifiedUserLimits>
const mockPrisma = prisma as jest.Mocked<typeof prisma> & {
    map: {
        findUnique: jest.MockedFunction<() => Promise<MockMap | null>>;
    };
    utility: {
        findMany: jest.MockedFunction<() => Promise<MockUtility[]>>;
        create: jest.MockedFunction<() => Promise<MockUtility>>;
        findFirst: jest.MockedFunction<() => Promise<MockUtility | null>>;
        delete: jest.MockedFunction<() => Promise<MockUtility>>;
    };
    throwingPoint: {
        count: jest.MockedFunction<() => Promise<number>>;
    };
}

describe('Utilities API Route', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('GET /api/utilities', () => {
        it('should return 400 when mapName is missing', async () => {
            const request = new NextRequest('http://localhost:3000/api/utilities')

            const response = await GET(request)
            const data = await response.json()

            expect(response.status).toBe(400)
            expect(data).toEqual({
                success: false,
                error: 'Map name is required',
            })
        })

        it('should return 401 when user is not authenticated', async () => {
            mockValidateSessionWithVerification.mockResolvedValue({
                success: false,
                userId: null,
                user: null,
                isEmailVerified: false,
            })

            const request = new NextRequest('http://localhost:3000/api/utilities?mapName=dust2')

            const response = await GET(request)
            const data = await response.json()

            expect(response.status).toBe(401)
            expect(data).toEqual({
                success: false,
                error: 'User not authenticated',
            })
        })

        it('should return 404 when map is not found', async () => {
            mockValidateSessionWithVerification.mockResolvedValue({
                success: true,
                userId: 'user-id',
                user: {
                    id: 'user-id',
                    emailVerified: true,
                    name: 'Test User',
                    email: 'test@example.com',
                    createdAt: new Date('2024-01-01'),
                    updatedAt: new Date('2024-01-01'),
                    password: 'hashed-password',
                    emailVerifiedAt: new Date('2024-01-01'),
                    image: null,
                },
                isEmailVerified: true,
            })

            mockPrisma.map.findUnique.mockResolvedValue(null)

            const request = new NextRequest('http://localhost:3000/api/utilities?mapName=invalid-map')

            const response = await GET(request)
            const data = await response.json()

            expect(response.status).toBe(404)
            expect(data).toEqual({
                success: false,
                error: 'Map not found',
            })
        })

        it('should return utilities for authenticated user', async () => {
            mockValidateSessionWithVerification.mockResolvedValue({
                success: true,
                userId: 'user-id',
                user: {
                    id: 'user-id',
                    emailVerified: true,
                    name: 'Test User',
                    email: 'test@example.com',
                    createdAt: new Date('2024-01-01'),
                    updatedAt: new Date('2024-01-01'),
                    password: 'hashed-password',
                    emailVerifiedAt: new Date('2024-01-01'),
                    image: null,
                },
                isEmailVerified: true,
            })

            const mockMap = { id: 'map-id', name: 'dust2' }
            const mockUtilities = [
                {
                    id: 'utility-1',
                    utilityType: 'smoke',
                    team: 'T',
                    landingPointX: 50,
                    landingPointY: 50,
                    throwingPoints: [],
                },
            ]

            mockPrisma.map.findUnique.mockResolvedValue(mockMap as MockMap)
            mockPrisma.utility.findMany.mockResolvedValue(mockUtilities as MockUtility[])

            const request = new NextRequest('http://localhost:3000/api/utilities?mapName=dust2')

            const response = await GET(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.success).toBe(true)
            expect(data.data).toHaveLength(1)
            expect(data.data[0]).toEqual({
                id: 'utility-1',
                map: 'dust2',
                utilityType: 'smoke',
                team: 'T',
                position: { X: 50, Y: 50 },
                throwingPoints: [],
            })
        })
    })

    describe('POST /api/utilities', () => {
        const validUtilityData = {
            mapName: 'dust2',
            utilityType: 'smoke',
            position: { X: 50, Y: 50 },
            team: 'T',
        }

        it('should return 400 when required fields are missing', async () => {
            const request = new NextRequest('http://localhost:3000/api/utilities', {
                method: 'POST',
                body: JSON.stringify({ mapName: 'dust2' }),
            })

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(400)
            expect(data).toEqual({
                success: false,
                error: 'Map name, utility type, and position are required',
            })
        })

        it('should return 401 when user is not authenticated', async () => {
            mockValidateSessionWithVerification.mockResolvedValue({
                success: false,
                userId: null,
                user: null,
                isEmailVerified: false,
            })

            const request = new NextRequest('http://localhost:3000/api/utilities', {
                method: 'POST',
                body: JSON.stringify(validUtilityData),
            })

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(401)
            expect(data).toEqual({
                success: false,
                error: 'User not authenticated',
            })
        })

        it('should return 403 when unverified user has reached utility limit', async () => {
            mockValidateSessionWithVerification.mockResolvedValue({
                success: true,
                userId: 'user-id',
                user: {
                    id: 'user-id',
                    emailVerified: false,
                    name: 'Test User',
                    email: 'test@example.com',
                    createdAt: new Date('2024-01-01'),
                    updatedAt: new Date('2024-01-01'),
                    password: 'hashed-password',
                    emailVerifiedAt: null,
                    image: null,
                },
                isEmailVerified: false,
            })

            mockCheckUnverifiedUserLimits.mockResolvedValue({
                canCreateUtility: false,
                canCreateThrowingPoint: true,
                utilityCount: 1,
                throwingPointCount: 0,
            })

            const request = new NextRequest('http://localhost:3000/api/utilities', {
                method: 'POST',
                body: JSON.stringify(validUtilityData),
            })

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(403)
            expect(data).toEqual({
                success: false,
                error: 'Unverified users can only create one utility. Please verify your email to create more utilities.',
                requiresVerification: true,
            })
        })

        it('should create utility for verified user', async () => {
            mockValidateSessionWithVerification.mockResolvedValue({
                success: true,
                userId: 'user-id',
                user: {
                    id: 'user-id',
                    emailVerified: true,
                    name: 'Test User',
                    email: 'test@example.com',
                    createdAt: new Date('2024-01-01'),
                    updatedAt: new Date('2024-01-01'),
                    password: 'hashed-password',
                    emailVerifiedAt: new Date('2024-01-01'),
                    image: null,
                },
                isEmailVerified: true,
            })

            const mockMap = { id: 'map-id', name: 'dust2' }
            const mockCreatedUtility = {
                id: 'utility-1',
                utilityType: 'smoke',
                team: 'T',
                landingPointX: 50,
                landingPointY: 50,
                throwingPoints: [],
            }

            mockPrisma.map.findUnique.mockResolvedValue(mockMap as MockMap)
            mockPrisma.utility.create.mockResolvedValue(mockCreatedUtility as MockUtility)

            const request = new NextRequest('http://localhost:3000/api/utilities', {
                method: 'POST',
                body: JSON.stringify(validUtilityData),
            })

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.success).toBe(true)
            expect(data.data).toEqual({
                id: 'utility-1',
                map: 'dust2',
                utilityType: 'smoke',
                team: 'T',
                position: { X: 50, Y: 50 },
                throwingPoints: [],
            })
        })

        it('should create utility for unverified user within limits', async () => {
            mockValidateSessionWithVerification.mockResolvedValue({
                success: true,
                userId: 'user-id',
                user: {
                    id: 'user-id',
                    emailVerified: false,
                    name: 'Test User',
                    email: 'test@example.com',
                    createdAt: new Date('2024-01-01'),
                    updatedAt: new Date('2024-01-01'),
                    password: 'hashed-password',
                    emailVerifiedAt: null,
                    image: null,
                },
                isEmailVerified: false,
            })

            mockCheckUnverifiedUserLimits.mockResolvedValue({
                canCreateUtility: true,
                canCreateThrowingPoint: true,
                utilityCount: 0,
                throwingPointCount: 0,
            })

            const mockMap = { id: 'map-id', name: 'dust2' }
            const mockCreatedUtility = {
                id: 'utility-1',
                utilityType: 'smoke',
                team: 'T',
                landingPointX: 50,
                landingPointY: 50,
                throwingPoints: [],
            }

            mockPrisma.map.findUnique.mockResolvedValue(mockMap as MockMap)
            mockPrisma.utility.create.mockResolvedValue(mockCreatedUtility as MockUtility)

            const request = new NextRequest('http://localhost:3000/api/utilities', {
                method: 'POST',
                body: JSON.stringify(validUtilityData),
            })

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.success).toBe(true)
        })
    })

    describe('DELETE /api/utilities', () => {
        it('should return 400 when utilityId is missing', async () => {
            const request = new NextRequest('http://localhost:3000/api/utilities')

            const response = await DELETE(request)
            const data = await response.json()

            expect(response.status).toBe(400)
            expect(data).toEqual({
                success: false,
                error: 'Utility ID is required',
            })
        })

        it('should return 401 when user is not authenticated', async () => {
            mockValidateSessionWithVerification.mockResolvedValue({
                success: false,
                userId: null,
                user: null,
                isEmailVerified: false,
            })

            const request = new NextRequest('http://localhost:3000/api/utilities?utilityId=utility-1')

            const response = await DELETE(request)
            const data = await response.json()

            expect(response.status).toBe(401)
            expect(data).toEqual({
                success: false,
                error: 'User not authenticated',
            })
        })

        it('should return 404 when utility is not found or does not belong to user', async () => {
            mockValidateSessionWithVerification.mockResolvedValue({
                success: true,
                userId: 'user-id',
                user: {
                    id: 'user-id',
                    emailVerified: true,
                    name: 'Test User',
                    email: 'test@example.com',
                    createdAt: new Date('2024-01-01'),
                    updatedAt: new Date('2024-01-01'),
                    password: 'hashed-password',
                    emailVerifiedAt: new Date('2024-01-01'),
                    image: null,
                },
                isEmailVerified: true,
            })

            mockPrisma.utility.findFirst.mockResolvedValue(null)

            const request = new NextRequest('http://localhost:3000/api/utilities?utilityId=invalid-utility')

            const response = await DELETE(request)
            const data = await response.json()

            expect(response.status).toBe(404)
            expect(data).toEqual({
                success: false,
                error: 'Utility not found or access denied',
            })
        })

        it('should delete utility successfully', async () => {
            mockValidateSessionWithVerification.mockResolvedValue({
                success: true,
                userId: 'user-id',
                user: {
                    id: 'user-id',
                    emailVerified: true,
                    name: 'Test User',
                    email: 'test@example.com',
                    createdAt: new Date('2024-01-01'),
                    updatedAt: new Date('2024-01-01'),
                    password: 'hashed-password',
                    emailVerifiedAt: new Date('2024-01-01'),
                    image: null,
                },
                isEmailVerified: true,
            })

            const mockUtility = {
                id: 'utility-1',
                createdBy: 'user-id',
            }

            mockPrisma.utility.findFirst.mockResolvedValue(mockUtility as MockUtility)
            mockPrisma.utility.delete.mockResolvedValue(mockUtility as MockUtility)

            const request = new NextRequest('http://localhost:3000/api/utilities?utilityId=utility-1')

            const response = await DELETE(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data).toEqual({
                success: true,
                message: 'Utility deleted successfully',
            })

            expect(mockPrisma.utility.delete).toHaveBeenCalledWith({
                where: { id: 'utility-1' },
            })
        })
    })
})
