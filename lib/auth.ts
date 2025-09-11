import sgMail from '@sendgrid/mail';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/db/mongo';
import { User } from '@/models/User';
import { OTP } from '@/models/OTP';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY environment variable is not set');
}

if (!process.env.SENDGRID_FROM_EMAIL) {
  throw new Error('SENDGRID_FROM_EMAIL environment variable is not set');
}

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function generateOTP(email: string) {
  await connectToDatabase();
  
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  try {
    // First, create the new OTP
    const newOTP = await OTP.create({
      email,
      code,
      expiresAt
    }).catch(err => {
      console.error('Failed to create OTP in database:', err);
      throw new Error('Database error: Failed to store OTP');
    });

    console.log(`✅ OTP created in database for ${email}`);

    // Then, delete any old OTPs for this email (except the one we just created)
    await OTP.deleteMany({
      email,
      _id: { $ne: newOTP._id }
    }).exec().catch(err => {
      console.error('Failed to cleanup old OTPs:', err);
      // Non-critical error, don't throw
    });

    console.log(`✅ Cleaned up old OTPs for ${email}`);

    // Send OTP email
    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject: 'Your Login Code',
      text: `Your verification code is: ${code}. It expires in 10 minutes.`,
      html: `<h1>Your verification code is: ${code}</h1><p>It expires in 10 minutes.</p>`
    };

    try {
      await sgMail.send(msg);
      console.log(`✅ OTP sent to ${email}`);
    } catch (emailError: any) {
      // If email fails, clean up the OTP we just created
      await OTP.deleteOne({ _id: newOTP._id }).catch(err => 
        console.error('Failed to cleanup OTP after email failure:', err)
      );
      
      console.error('SendGrid error:', emailError);
      if (emailError.response) {
        console.error('SendGrid response:', {
          body: emailError.response.body,
          statusCode: emailError.response.statusCode,
        });
      }
      throw new Error(`Email delivery failed: ${emailError.message}`);
    }
  } catch (error: any) {
    console.error("❌ Error in generateOTP:", error.message);
    throw error;
  }
}

export async function verifyOTP(email: string, code: string): Promise<string | null> {
  await connectToDatabase();

  try {
    // Check valid OTP first before any cleanup
    const otp = await OTP.findOne({
      email,
      code,
      expiresAt: { $gt: new Date() }
    }).exec();

    console.log(`Verifying OTP for ${email}:`, otp ? "Found" : "Not found");

    if (!otp) return null;

    // Delete used OTP
    await OTP.deleteOne({ _id: otp._id }).exec();

    // Find or create user
    const user = await User.findOneAndUpdate(
      { email },
      { 
        email,
        verified: true,
        $setOnInsert: { createdAt: new Date() },
        $set: { updatedAt: new Date() }
      },
      { 
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    ).exec();

    if (!user) return null;

    // Generate JWT
    return jwt.sign(
      { 
        userId: user._id,
        email: user.email
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    return null;
  }
}

export async function verifyToken(token: string): Promise<{ userId: string; email: string; } | null> {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
    };
    
    await connectToDatabase();
    
    const user = await User.findById(decoded.userId).exec();
    if (!user || !user.verified) {
      return null;
    }
    
    return { userId: user._id.toString(), email: user.email };
  } catch (error) {
    return null;
  }
}
