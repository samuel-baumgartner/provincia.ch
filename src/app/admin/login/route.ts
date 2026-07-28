import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, ADMIN_PASSWORD } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const origin = new URL(request.url).origin;

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.redirect(`${origin}/admin?error=invalid-password`);
  }

  const response = NextResponse.redirect(`${origin}/admin`);
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "1",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return response;
}
