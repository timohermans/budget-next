// types/next-auth.d.ts
import { JWT } from "next-auth/jwt"
import { DefaultSession, DefaultUser } from "next-auth"

declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken?: string
    error?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    expiresAt?: number
    accessToken?: string
    error?: string
  }
}