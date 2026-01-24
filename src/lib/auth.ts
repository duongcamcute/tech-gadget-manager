import { hash, compare } from 'bcryptjs';
import { getSession } from './session';

// Re-export session logic for convenience in Server Actions
export * from './session';

// --- Password Logic (Node.js only due to bcryptjs) ---

export async function hashPassword(password: string): Promise<string> {
    return await hash(password, 12);
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
    return await compare(plain, hashed);
}

// --- Server Action Guard ---
export async function requireAuth() {
    const session = await getSession();
    if (!session) {
        throw new Error("Unauthorized: Bạn cần đăng nhập để thực hiện thao tác này.");
    }
    return session;
}
