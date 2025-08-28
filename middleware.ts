import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import * as jose from 'jose'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value

  // Paths that don't require authentication
  if (
    request.nextUrl.pathname.startsWith('/auth')
  ) {
    return NextResponse.next()
  }

  // Check if we have a token
  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    await jose.jwtVerify(token, secret)
    return NextResponse.next()
  } catch (err) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
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