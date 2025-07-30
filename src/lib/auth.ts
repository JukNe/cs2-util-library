import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import prisma from './prisma';

export const auth = betterAuth({
    plugins: [nextCookies()],
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: ["http://localhost:3000"],
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
        autoSignIn: true,
        requireEmailVerification: false,
        hashPassword: true,
    },
});