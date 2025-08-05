import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "./lib/session";

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Exclude auth-related API routes and static files from authentication
    const publicPaths = [
        "/login",
        "/api/auth",
        "/api/auth/sign-in",
        "/api/auth/sign-up",
        "/api/auth/check-session",
        "/api/auth/check-user",
        "/api/auth/logout"
    ];

    const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

    // If it's a public path, allow access
    if (isPublicPath) {
        return NextResponse.next();
    }

    // Validate session
    const sessionValidation = await validateSession(req);

    // If no valid session and not on login page, redirect to login
    if (!sessionValidation.success && pathname !== "/login") {
        console.log('Redirecting to login - no valid session');
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // If user has valid session and is on login page, redirect to home
    if (sessionValidation.success && pathname === "/login") {
        console.log('Redirecting to home - has valid session');
        return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};