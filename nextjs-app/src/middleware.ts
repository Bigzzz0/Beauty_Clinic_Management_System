import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// Define the paths that do not require authentication
const publicPaths = ['/login', '/api/auth/login', '/api/auth/session/validate']
const ALL_ROLES = ['Admin', 'Doctor', 'Therapist', 'Sale', 'Cashier']

const JWT_SECRET = process.env.JWT_SECRET

export async function middleware(request: NextRequest) {
    if (!JWT_SECRET) {
        console.error('FATAL ERROR: JWT_SECRET environment variable is not set.')
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }

    const { pathname } = request.nextUrl
    
    // Allow static assets (images, icons, etc.)
    if (pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp)$/)) {
        return NextResponse.next()
    }

    // Allow public paths
    if (publicPaths.some(path => pathname.startsWith(path))) {
        return NextResponse.next()
    }

    const requestHeaders = new Headers(request.headers)

    const authHeader = requestHeaders.get('authorization')
    const hasValidAuthHeader = authHeader?.startsWith('Bearer ') &&
        authHeader !== 'Bearer null' &&
        authHeader !== 'Bearer undefined'

    const tokenCookie = request.cookies.get('auth_token')?.value
    let tokenToVerify = null

    if (hasValidAuthHeader) {
        tokenToVerify = authHeader?.split(' ')[1]
    } else if (tokenCookie) {
        tokenToVerify = tokenCookie
        requestHeaders.set('authorization', `Bearer ${tokenCookie}`)
    }

    if (!tokenToVerify) {
        return redirectToLogin(request)
    }

    try {
        // Verify token signature first
        const secret = new TextEncoder().encode(JWT_SECRET)
        const { payload } = await jwtVerify(tokenToVerify, secret)

        // Validate that the staff account is active and token_version still matches DB.
        // We use the internal loopback 'http://127.0.0.1:3000' to avoid docker container resolution failures over the public Cloudflare Tunnel.
        const sessionValidationUrl = new URL('/api/auth/session/validate', 'http://127.0.0.1:3000')
        const sessionResponse = await fetch(sessionValidationUrl, {
            method: 'GET',
            headers: {
                authorization: `Bearer ${tokenToVerify}`,
            },
            cache: 'no-store',
        })

        if (!sessionResponse.ok) {
            return redirectToLogin(request)
        }

        const sessionPayload = await sessionResponse.json() as {
            mustChangePassword?: boolean
        }

        const mustChangePassword = Boolean(sessionPayload.mustChangePassword)
        const isPasswordPage = pathname.startsWith('/settings/password')
        const isPasswordApi = /^\/api\/staff\/\d+\/password$/.test(pathname)
        const isLogoutApi = pathname.startsWith('/api/auth/logout')

        if (mustChangePassword && !isPasswordPage && !isPasswordApi && !isLogoutApi) {
            if (pathname.startsWith('/api/')) {
                return NextResponse.json(
                    { error: 'Password change required' },
                    { status: 403 }
                )
            }

            const passwordUrl = new URL('/settings/password', request.url)
            passwordUrl.searchParams.set('forceChange', '1')
            return NextResponse.redirect(passwordUrl)
        }

        // Route permissions mapping
        const position = payload?.position as string | undefined
        const routePermissions: Record<string, string[]> = {
            '/settings/password': ALL_ROLES,
            '/inventory/evidence': ['Admin'],
            '/api/inventory/evidence': ['Admin'],
            '/pos': ['Admin', 'Sale', 'Cashier'],
            '/transactions': ['Admin', 'Sale', 'Cashier'],
            '/debtors': ['Admin', 'Sale', 'Cashier'],
            '/inventory': ['Admin', 'Doctor', 'Therapist'],
            '/service': ['Admin', 'Doctor', 'Therapist'],
            '/reports': ['Admin', 'Sale', 'Cashier'],
            '/settings': ['Admin'],
        }

        // Check if the current path requires specific roles
        let isAuthorized = true
        for (const [routeBase, allowedRoles] of Object.entries(routePermissions)) {
            if (pathname.startsWith(routeBase)) {
                if (!position || !allowedRoles.includes(position)) {
                    isAuthorized = false
                }
                break;
            }
        }

        if (!isAuthorized) {
            if (pathname.startsWith('/api/')) {
                return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 })
            }
            const dashboardUrl = new URL('/dashboard', request.url)
            dashboardUrl.searchParams.set('error', 'unauthorized')
            return NextResponse.redirect(dashboardUrl)
        }

        // Allow request to continue
        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        })
    } catch (error) {
        console.error('Token verification failed:', error)
        return redirectToLogin(request)
    }
}

function redirectToLogin(request: NextRequest) {
    if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
