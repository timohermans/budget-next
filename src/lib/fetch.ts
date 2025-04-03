import { auth, signOut } from "@/auth";
import createClient from "openapi-fetch";
import { paths } from "@/lib/budget-api/v1";

export function createBudgetApiClient() {
    return createClient<paths>({ baseUrl: process.env.API_URL });
}

export async function getTokenHeader() {
    return {
        Authorization: `Bearer ${(await auth())?.accessToken}`,
    }
}