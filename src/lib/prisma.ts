import { PrismaClient } from "@/generated/prisma";
import { withAccelerate } from "@prisma/extension-accelerate";

declare global {
    var prisma: ReturnType<typeof createPrismaClient> | undefined;
}

function isAccelerateUrl(url: string): boolean {
    return url.startsWith("prisma://") || url.startsWith("prisma+postgres://");
}

/**
 * Resolve a DB URL and make sure `DATABASE_URL` is set before PrismaClient
 * reads `env("DATABASE_URL")` from the schema (avoids "Environment variable not found").
 */
function resolveDatabaseUrl(): string {
    const accelerateUrl = process.env.PRISMA_DATABASE_URL;
    const directUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

    // Prefer Accelerate when configured (Vercel/Prisma often put it in PRISMA_DATABASE_URL).
    const url =
        (accelerateUrl && isAccelerateUrl(accelerateUrl) ? accelerateUrl : undefined) ||
        directUrl ||
        accelerateUrl;

    if (!url) {
        throw new Error(
            "Missing database connection string. Set DATABASE_URL, PRISMA_DATABASE_URL, or POSTGRES_URL."
        );
    }

    // Schema datasource uses env("DATABASE_URL") — keep it populated for PrismaClient init.
    if (!process.env.DATABASE_URL) {
        process.env.DATABASE_URL = url;
    }

    return url;
}

function createPrismaClient() {
    const url = resolveDatabaseUrl();
    const client = new PrismaClient({ datasourceUrl: url });

    if (isAccelerateUrl(url)) {
        return client.$extends(withAccelerate());
    }

    return client;
}

const prisma = globalThis.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalThis.prisma = prisma;
}

export default prisma;
