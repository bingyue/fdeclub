import { NextResponse } from "next/server";
import { userDb } from "@/lib/supabase";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = process.env.NEXT_PUBLIC_SITE_URL || url.origin;
  const code = url.searchParams.get("code");
  const db = await userDb();
  if (code && db) {
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/events", origin));
  }
  return NextResponse.redirect(new URL("/login?error=callback", origin));
}
