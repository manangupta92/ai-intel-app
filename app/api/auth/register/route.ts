import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongo';
import { User } from '@/models/User';
import { generateOTP } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
        }

        await connectToDatabase();

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({
                error: 'User already exists. Please use the login page instead.'
            }, { status: 409 });
        }

        // Create new user (unverified initially)
        const newUser = await User.create({
            email,
            verified: false
        });

        // Generate OTP for verification
        await generateOTP(email);

        return NextResponse.json({
            message: 'Registration successful. Please check your email for OTP verification.',
            userId: newUser._id
        });
    } catch (error: any) {
        console.error('Registration failed:', error);
        return NextResponse.json({
            error: 'Registration failed',
            details: error.message || 'Unknown error'
        }, { status: 500 });
    }
}
