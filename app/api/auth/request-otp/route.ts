import { NextResponse } from 'next/server'
import { generateOTP } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db/mongo'
import { User } from '@/models/User'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    await connectToDatabase()

    // Check if user exists and is verified
    const existingUser = await User.findOne({ email })
    if (!existingUser) {
      return NextResponse.json({
        error: 'No account found with this email. Please register first.'
      }, { status: 404 })
    }

    if (!existingUser.verified) {
      return NextResponse.json({
        error: 'Account not verified. Please complete the registration process first.'
      }, { status: 400 })
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