import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";
import Keycloak from "next-auth/providers/keycloak";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Keycloak],
  callbacks: {
    authorized: async ({ request, auth }) => {
      const { pathname } = request.nextUrl;

      if (!pathname.includes('/api/auth')) {
        return !!auth;
      }

      return true;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      return session
    },
    async jwt({ token, account }) {
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at
        }
      }

      if (Date.now() < (token.expiresAt ?? Date.now())) {
        return token
      }

      console.log('token expired');
      return refreshAccessToken(token)
    }
  },
})


export enum AuthError {
  RefreshTokenFailed = 'RefreshTokenFailed',
  RefreshTokenExpired = 'RefreshTokenExpired',
  AccessTokenExpired = 'AccessTokenExpired'
}

async function refreshAccessToken(token: JWT): Promise<JWT> {
  let response;

  try {
    const clientId = process.env.AUTH_KEYCLOAK_ID ?? "";
    const clientSecret = process.env.AUTH_KEYCLOAK_SECRET ?? "";
    const refreshToken = token.refreshToken as string;

    response = await fetch(`${process.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });

    const newTokens = await response.json();

    return {
      ...token,
      accessToken: newTokens.access_token,
      refreshToken: newTokens.refresh_token ?? token.refreshToken,
      expiresAt: Date.now() + newTokens.expires_in * 1000,
      error: undefined
    };
  } catch (error) {
    try {
      if (!response) throw error;

      if (!response?.ok) {
        if (response.status === 401) {
          console.log(AuthError.RefreshTokenExpired)
          throw new Error(AuthError.RefreshTokenExpired);
        }
        console.log(AuthError.RefreshTokenFailed)
        throw new Error(AuthError.RefreshTokenFailed);
      }

      throw error;
    } catch (tokenError) {
      console.log(tokenError);
      return {
        ...token,
        error: tokenError instanceof Error ? tokenError.message : AuthError.RefreshTokenFailed,
        accessToken: undefined,
        refreshToken: undefined
      };
    }
  }
}