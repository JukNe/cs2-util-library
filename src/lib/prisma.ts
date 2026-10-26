import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

function isAccelerateUrl(url: string): boolean {
    return url.startsWith("prisma://") || url.startsWith("prisma+postgres://");
}

function resolveAccelerateUrl(): string | undefined {
    const candidates = [process.env.PRISMA_DATABASE_URL, process.env.DATABASE_URL];
    return candidates.find((url): url is string => !!url && isAccelerateUrl(url));
}

function resolveDirectUrl(): string | undefined {
    const candidates = [
        process.env.POSTGRES_URL,
        process.env.DATABASE_URL,
        process.env.POSTGRES_PRISMA_URL,
    ];
    return candidates.find((url): url is string => !!url && !isAccelerateUrl(url));
}

function createPrismaClient(): PrismaClient {
    const accelerateUrl = resolveAccelerateUrl();
    if (accelerateUrl) {
        return new PrismaClient({ accelerateUrl });
    }

    const directUrl = resolveDirectUrl();
    if (directUrl) {
        // Prisma 7 requires a driver adapter for direct Postgres connections.
        const adapter = new PrismaPg({ connectionString: directUrl });
        return new PrismaClient({ adapter });
    }

    throw new Error(
        "Missing database connection string. Set POSTGRES_URL / DATABASE_URL (postgres://) or PRISMA_DATABASE_URL (prisma://)."
    );
}

function getPrismaClient(): PrismaClient {
    if (!globalForPrisma.prisma) {
        globalForPrisma.prisma = createPrismaClient();
    }
    return globalForPrisma.prisma;
}

/**
 * Lazy proxy so importing this module during `next build` does not require
 * env vars until Prisma is actually used.
 */
const prisma = new Proxy({} as PrismaClient, {
    get(_target, prop, receiver) {
        const client = getPrismaClient();
        const value = Reflect.get(client, prop, receiver);
        return typeof value === "function" ? value.bind(client) : value;
    },
});

export default prisma;
