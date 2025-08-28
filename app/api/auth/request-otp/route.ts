import { NextResponse } from 'next/server'
import { generateOTP } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    await generateOTP(email)
    return NextResponse.json({ message: 'OTP sent successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 })
  }
}