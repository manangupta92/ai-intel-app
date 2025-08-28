import { PrismaClient } from '@prisma/client'
import sgMail from '@sendgrid/mail'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export async function generateOTP(email: string) {
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  // Cleanup expired OTPs for this user
  await prisma.oTP.deleteMany({
    where: {
      email,
      expiresAt: {
        lt: new Date()
      }
    }
  })

  // Store new OTP
  await prisma.oTP.create({
    data: {
      email,
      code,
      expiresAt
    }
  })

  // Send OTP email
  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL!, // must be verified in SendGrid
    subject: 'Your Login Code',
    text: `Your verification code is: ${code}. It expires in 10 minutes.`,
    html: `<h1>Your verification code is: ${code}</h1><p>It expires in 10 minutes.</p>`
  }

  try {
    await sgMail.send(msg)
    console.log(`✅ OTP sent to ${email}`)
  } catch (error: any) {
    console.error("❌ SendGrid error:", error.response?.body || error.message)
    throw error
  }
}

export async function verifyOTP(email: string, code: string) {
  // Cleanup expired OTPs before checking
  await prisma.oTP.deleteMany({
    where: {
      email,
      expiresAt: {
        lt: new Date()
      }
    }
  })

  // Check valid OTP
  const otp = await prisma.oTP.findFirst({
    where: {
      email,
      code,
      expiresAt: {
        gt: new Date()
      }
    }
  })

  if (!otp) return false

  // Delete used OTP
  await prisma.oTP.delete({
    where: { id: otp.id }
  })

  // Get or create user
  const user = await prisma.user.upsert({
    where: { email },
    create: { email, verified: true },
    update: { verified: true }
  })

  return generateToken(user.id)
}

export function generateToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '7d' })
}

export function verifyToken(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET!)
}