import { auth } from "@/auth"

export default auth((req) => {
  const { pathname } = req.nextUrl

  // Protect admin routes
  if (pathname.startsWith("/admin") && !req.auth) {
    return Response.redirect(new URL("/login", req.url))
  }
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
