import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const isSignedIn = request.cookies.get("shirt_admin_signed_in")?.value === "1";
  if (isSignedIn) return NextResponse.next();

  const loginUrl = new URL("/admin", request.url);
  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path+"]
};
