import { auth, signOut } from "@/auth";

export async function fetchWithToken(url: string, options: RequestInit = {}) {
    const session = await auth();

    if (!session?.accessToken) {
        await signOut({ redirect: true });
        throw new Error('No access token available')
    }

    try {
        let response;

        try {
            response = await fetch(url, {
                ...options,
                headers: {
                    ...options.headers,
                    Authorization: `Bearer ${session.accessToken}`,
                },
            })
        } catch (error) {
            if (!response) throw error;

            // Handle different error scenarios
            if (response.status === 401) {
                // Try to get a new session with refreshed tokens
                const newSession = await auth();

                if (!newSession?.accessToken || newSession?.error) {
                    // Refresh failed or token expired, force sign out
                    await signOut({ redirect: true });
                    throw new Error(newSession?.error || 'Session expired');
                }

                // Retry the request with new token
                return fetch(url, {
                    ...options,
                    headers: {
                        ...options.headers,
                        Authorization: `Bearer ${newSession.accessToken}`,
                    },
                });
            }

            throw error;
        }

        return response
    } catch (error) {
        // Handle network errors or other failures
        console.error('API call failed:', error)
        throw error
    }
}