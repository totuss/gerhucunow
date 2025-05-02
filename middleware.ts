import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Check if user is logged in by checking for the currentUser cookie
  const isLoggedIn = request.cookies.has("currentUser")

  // Define public paths that don't require authentication
  const isPublicPath = path === "/login"

  // If user is not logged in and trying to access a protected route, redirect to login
  if (!isLoggedIn && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If user is logged in and trying to access login page, redirect to panel
  if (isLoggedIn && isPublicPath) {
    // Get user data to check if admin
    const userCookie = request.cookies.get("currentUser")
    if (userCookie) {
      try {
        const userData = JSON.parse(userCookie.value)

        // Redirect based on user role and subscription status
        if (userData.is_admin) {
          return NextResponse.redirect(new URL("/admin", request.url))
        } else if (userData.is_frozen) {
          return NextResponse.redirect(new URL("/panel", request.url))
        } else if (userData.days_left <= 0) {
          return NextResponse.redirect(new URL("/expired", request.url))
        } else {
          return NextResponse.redirect(new URL("/panel", request.url))
        }
      } catch (e) {
        // If there's an error parsing the cookie, clear it and continue to login
        const response = NextResponse.redirect(new URL("/login", request.url))
        response.cookies.delete("currentUser")
        return response
      }
    }
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
