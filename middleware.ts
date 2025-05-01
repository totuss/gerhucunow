import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Check if user is logged in
  const isLoggedIn = request.cookies.has("currentUser")

  // Define public paths that don't require authentication
  const isPublicPath = path === "/login"

  // If user is not logged in and trying to access a protected route, redirect to login
  if (!isLoggedIn && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If user is logged in and trying to access login page, redirect to panel
  if (isLoggedIn && isPublicPath) {
    return NextResponse.redirect(new URL("/panel", request.url))
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
