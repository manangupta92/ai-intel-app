import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out successfully' });
  
  // Clear the authentication cookie
  response.cookies.set('token', '', {
    expires: new Date(0),
    path: '/',
    sameSite: 'strict'
  });
  
  return response;
}

export async function GET() {
  // Support GET for backward compatibility
  const response = NextResponse.json({ message: 'Logged out successfully' });
  
  // Clear the authentication cookie
  response.cookies.set('token', '', {
    expires: new Date(0),
    path: '/',
    sameSite: 'strict'
  });
  
  return response;
}
