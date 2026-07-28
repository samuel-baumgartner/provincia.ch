import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "provinica_admin_auth";

/** Set `ADMIN_PASSWORD` in `.env.local` for production. */
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Q7mP2xV9rL4c";

export async function isAdminAuthed(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE_NAME)?.value === "1";
}
