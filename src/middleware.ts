import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/lib/session';

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // 1. Define Public Paths
    // We allow login page, static files, and explicit public api
    if (
        path.startsWith('/login') ||
        path.startsWith('/_next') ||
        path.startsWith('/static') ||
        path.includes('.') // images, favicon, etc
    ) {
        return NextResponse.next();
    }

    // 2. Get Session Token
    const token = request.cookies.get('session')?.value;

    // 3. Verify Session
    const session = token ? await verifySession(token) : null;

    // 4. Protect Private Routes
    // If not authenticated, redirect to login
    if (!session) {
        const loginUrl = new URL('/login', request.url);
        // Optional: Preserve redirect URL
        // loginUrl.searchParams.set('from', path);
        return NextResponse.redirect(loginUrl);
    }

    // 5. Redirect Authenticated User away from Login
    if (path === '/login' && session) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes) -> We protect Actions manually, but API routes might need check logic too if any
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
