import { NextResponse, type NextRequest } from "next/server";

const publicPaths = new Set(["/login"]);
const adminOnlyPaths = ["/users"];
const managerPaths = ["/settings"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const isPublic = publicPaths.has(pathname);
  const isAuthenticated = request.cookies.get("ims-auth")?.value === "1";
  const role = request.cookies.get("ims-role")?.value;
  const isActive = request.cookies.get("ims-active")?.value !== "0";

  if (!isAuthenticated || !isActive) {
    if (!isPublic) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
  }

  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (adminOnlyPaths.some((path) => pathname.startsWith(path)) && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (managerPaths.some((path) => pathname.startsWith(path)) && !["ADMIN", "MANAGER"].includes(role ?? "")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
