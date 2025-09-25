import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import * as jose from 'jose'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value

  // Public paths that don't require authentication
  const publicPaths = [
    '/auth/login',
    '/auth/register',
  ]

  const isPublicPath = publicPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  // Allow access to public paths and API auth routes
  if (isPublicPath || request.nextUrl.pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }

  // Check if we have a token for protected routes
  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  try {
    // Verify the JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    await jose.jwtVerify(token, secret)
    return NextResponse.next()
  } catch (err) {
    // If token is invalid, clear it and redirect to login
    const response = NextResponse.redirect(new URL('/auth/login', request.url))
    response.cookies.delete('token')
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth/** (auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}