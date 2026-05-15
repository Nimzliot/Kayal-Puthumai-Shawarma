import { NextResponse, type NextRequest } from "next/server";
import { buildSecurityHeaders } from "@/lib/security";
import { updateSupabaseSession } from "@/lib/supabase/middleware";

const protectedRoutes = ["/admin"];

export function middleware(request: NextRequest) {
  const response = updateSupabaseSession(request);
  const pathname = request.nextUrl.pathname;

  Object.entries(buildSecurityHeaders()).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    response.cookies.set("kps_admin_guard", "check", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
