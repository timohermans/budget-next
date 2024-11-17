import NextAuth from "next-auth";
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
  },
})
