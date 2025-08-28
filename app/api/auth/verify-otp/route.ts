import { NextResponse } from 'next/server'
import { verifyOTP } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json()
    const token = await verifyOTP(email, code)
    
    if (!token) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 })
    }

    return NextResponse.json({ token })
  } catch (error) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}