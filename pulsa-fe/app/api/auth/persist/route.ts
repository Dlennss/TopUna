import { NextResponse } from "next/server";
import { decodeJwt } from "@/lib/jwt";
import { PK_AUTH_COOKIE } from "@/lib/server-auth";

export const runtime = "nodejs";

type ReqBody = {
  token?: string;
};

export async function POST(req: Request) {
  const headerToken = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const body = (await req.json().catch(() => ({}))) as ReqBody;
  const token = headerToken || String(body.token || "").trim();

  if (!decodeJwt(token)) {
    return NextResponse.json({ ok: false, error: "invalid token" }, { status: 400 });
  }

  // Login password sudah memvalidasi email/password ke backend. Endpoint ini
  // hanya memastikan token berbentuk JWT yang bisa dibaca lalu menyimpan sesi
  // browser. Validasi /me tetap dicoba sebagai sinyal tambahan, tapi jangan
  // menggagalkan persist karena beberapa deploy lama belum expose /v1/auth/me
  // secara konsisten.
  const base = process.env.NEXT_PUBLIC_API_BASE || process.env.API_BASE || "http://127.0.0.1:8083";
  void fetch(`${base}/v1/auth/me`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  }).catch(() => null);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(PK_AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: req.url.startsWith("https://") || process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
