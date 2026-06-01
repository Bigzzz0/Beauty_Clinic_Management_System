import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET;

type VerifiedPayload = Awaited<ReturnType<typeof jwtVerify>>['payload'];

type AuthorizeResult =
    | { authorized: true; user: VerifiedPayload }
    | { authorized: false; error: string; status: number };

export type AuthenticatedRequest = NextRequest & { user?: VerifiedPayload };

export async function authorizeUser(request: NextRequest, allowedRoles: string[]): Promise<AuthorizeResult> {
    try {
        if (!JWT_SECRET) {
            console.error('FATAL ERROR: JWT_SECRET environment variable is not set.');
            return { authorized: false, error: 'Internal Server Error', status: 500 };
        }

        const authHeader = request.headers.get('authorization');
        let token = null;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else {
            token = request.cookies.get('auth_token')?.value;
        }

        if (!token) {
            return { authorized: false, error: 'No token provided', status: 401 };
        }

        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);

        if (!payload || !payload.position) {
            return { authorized: false, error: 'Invalid token payload', status: 401 };
        }

        const userRole = payload.position as string;
        const staffId = Number(payload.staff_id);
        const tokenVersion = Number(payload.token_version);

        if (!Number.isInteger(staffId) || staffId <= 0 || !Number.isInteger(tokenVersion) || tokenVersion < 0) {
            return { authorized: false, error: 'Invalid token payload', status: 401 };
        }

        const staff = await prisma.staff.findUnique({
            where: { staff_id: staffId },
            select: { is_active: true, token_version: true },
        });

        if (!staff || !staff.is_active) {
            return { authorized: false, error: 'Unauthorized', status: 401 };
        }

        if (staff.token_version !== tokenVersion) {
            return { authorized: false, error: 'Session expired. Please login again.', status: 401 };
        }

        if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
            return { authorized: false, error: 'Forbidden: Insufficient permissions', status: 403 };
        }

        return { authorized: true, user: payload };
    } catch (error) {
        console.error('Authorization error:', error);
        return { authorized: false, error: 'Invalid or expired token', status: 401 };
    }
}

// Helper to easily wrap API route handlers
export function withAuth<TContext = unknown>(
    handler: (request: AuthenticatedRequest, context: TContext) => Promise<NextResponse> | NextResponse,
    allowedRoles: string[] = []
) {
    return async (request: NextRequest, context: TContext) => {
        const authResult = await authorizeUser(request, allowedRoles);
        
        if (!authResult.authorized) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status }
            );
        }

        // Attach user to request for the handler to use
        const requestWithUser = request as AuthenticatedRequest;
        requestWithUser.user = authResult.user;
        
        return handler(requestWithUser, context);
    };
}
