import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET_KEY = process.env.JWT_SECRET || 'super-secret-key-change-this-in-production';
const encodedKey = new TextEncoder().encode(SECRET_KEY);

export type SessionPayload = {
    userId: string;
    username: string;
    role: string;
    expiresAt: Date;
};

export async function createSession(userId: string, username: string) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create token
    const token = await new SignJWT({ userId, username, role: 'user' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(encodedKey);

    const cookieStore = await cookies();
    cookieStore.set('session', token, {
        httpOnly: true,
        // Allow disabling secure cookies for self-hosted HTTP environments
        secure: process.env.NODE_ENV === 'production' && process.env.DISABLE_SECURE_COOKIES !== 'true',
        expires: expiresAt,
        sameSite: 'lax',
        path: '/',
    });
}

export async function deleteSession() {
    const cookieStore = await cookies();
    cookieStore.delete('session');
}

export async function verifySession(token: string) {
    try {
        const { payload } = await jwtVerify(token, encodedKey, {
            algorithms: ['HS256'],
        });
        return payload as unknown as SessionPayload;
    } catch (error) {
        return null;
    }
}

export async function getSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    if (!session) return null;
    return await verifySession(session);
}
