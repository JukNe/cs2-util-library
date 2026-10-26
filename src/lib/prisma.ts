import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

function isAccelerateUrl(url: string): boolean {
    return url.startsWith("prisma://") || url.startsWith("prisma+postgres://");
}

function resolveAccelerateUrl(): string {
    const accelerateUrl = process.env.PRISMA_DATABASE_URL;
    const fallback = process.env.DATABASE_URL;

    const url =
        (accelerateUrl && isAccelerateUrl(accelerateUrl) ? accelerateUrl : undefined) ||
        (fallback && isAccelerateUrl(fallback) ? fallback : undefined) ||
        accelerateUrl ||
        fallback;

    if (!url || !isAccelerateUrl(url)) {
        throw new Error(
            "Missing Prisma Accelerate URL. Set PRISMA_DATABASE_URL (prisma:// or prisma+postgres://)."
        );
    }

    return url;
}

function createPrismaClient() {
    // Prisma 7 + Accelerate: pass accelerateUrl to the constructor (no $extends needed for typing).
    return new PrismaClient({
        accelerateUrl: resolveAccelerateUrl(),
    });
}

const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}

export default prisma;
