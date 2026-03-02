import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This middleware automatically injects the HTTP-Only cookie 'auth_token' 
// into the Authorization header for all internal API requests.
// This allows a seamless migration from localStorage tokens to Cookies.
export function middleware(request: NextRequest) {
    const requestHeaders = new Headers(request.headers)

    // If the client sent an empty or null bearer token, but we have a cookie, override it.
    const authHeader = requestHeaders.get('authorization')
    const hasValidAuthHeader = authHeader?.startsWith('Bearer ') &&
        authHeader !== 'Bearer null' &&
        authHeader !== 'Bearer undefined'

    const tokenCookie = request.cookies.get('auth_token')?.value

    if (!hasValidAuthHeader && tokenCookie) {
        requestHeaders.set('authorization', `Bearer ${tokenCookie}`)
    }

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    })
}

// Only run middleware on api routes
export const config = {
    matcher: '/api/:path*',
}
