import { authClient } from "@/app/lib/auth-client";
import { UserRole } from "@/app/types/auth";
import type { Session } from "@/app/types/auth";

/**
 * Fetches the current session from the backend using Better Auth.
 * Returns null on any error or when no session exists.
 */
export async function getSession(): Promise<Session | null> {
    try {
        const { data } = await authClient.getSession();
        if (!data?.user) return null;

        const rawUser = data.user as {
            id: string;
            email: string;
            name: string;
            image?: string | null;
            role?: string;
        };

        return {
            user: {
                id: rawUser.id,
                name: rawUser.name,
                email: rawUser.email,
                image: rawUser.image || undefined,
                role: rawUser.role === "ADMIN" ? UserRole.ADMIN : UserRole.USER,
            },
            expiresAt: data.session.expiresAt.toString(),
        };
    } catch {
        return null;
    }
}
