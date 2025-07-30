import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const sessionToken = req.cookies.get("session")?.value;

    console.log('Middleware check:', {
        pathname,
        hasSession: !!sessionToken,
        sessionToken: sessionToken ? 'present' : 'missing'
    });

    // If no session token and not on login page, redirect to login
    if (!sessionToken && pathname !== "/login") {
        console.log('Redirecting to login - no session');
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // If user has session token and is on login page, redirect to home
    if (sessionToken && pathname === "/login") {
        console.log('Redirecting to home - has session');
        return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|api).*)",
    ],
};