import { NextResponse } from 'next/server'
import { generateOTP } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }
    
    await generateOTP(email)
    return NextResponse.json({ message: 'OTP sent successfully' })
  } catch (error: any) {
    console.error('OTP request failed:', error)
    return NextResponse.json({ 
      error: 'Failed to send OTP',
      details: error.message || 'Unknown error'
    }, { status: 500 })
  }
}