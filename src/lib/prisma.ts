import { PrismaClient } from "@/generated/prisma";
import { withAccelerate } from "@prisma/extension-accelerate";

declare global {
    var prisma: ReturnType<typeof createPrismaClient> | undefined;
}

function createPrismaClient() {
    return new PrismaClient().$extends(withAccelerate());
}

const prisma = globalThis.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

export default prisma;