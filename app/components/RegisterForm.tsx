import { useState } from 'react';
import Link from 'next/link';

interface RegisterFormProps {
    onRegisterSuccess: () => void;
}

export default function RegisterForm({ onRegisterSuccess }: RegisterFormProps) {
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsRegistering(true);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            setMessage(data.message);
            setIsVerifying(true);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setIsRegistering(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsRegistering(true);

        try {
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'OTP verification failed');
            }

            setMessage('Registration completed successfully!');
            onRegisterSuccess();
        } catch (error: any) {
            setError(error.message);
        } finally {
            setIsRegistering(false);
        }
    };

    const resendOTP = async () => {
        setMessage('');
        setError('');
        setIsRegistering(true);

        try {
            const res = await fetch('/api/auth/request-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (!res.ok) {
                throw new Error('Failed to resend OTP');
            }

            setMessage('OTP resent to your email');
        } catch (error: any) {
            setError('Failed to resend OTP');
        } finally {
            setIsRegistering(false);
        }
    };

    return (
        <div className="card p-6 max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-4">Create Account</h2>

            {error && (
                <div className="bg-red-900/50 text-red-200 p-3 rounded mb-4">
                    {error}
                </div>
            )}

            {message && (
                <div className="bg-green-900/50 text-green-200 p-3 rounded mb-4">
                    {message}
                </div>
            )}

            {!isVerifying ? (
                <>
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 focus:outline-none"
                                required
                                placeholder="Enter your email address"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isRegistering}
                            className="btn w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isRegistering ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-400">
                            Already have an account?{' '}
                            <Link href="/auth/login" className="text-blue-400 hover:text-blue-300">
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </>
            ) : (
                <div className="space-y-4">
                    <form onSubmit={handleVerifyOTP} className="space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium">Verification Code</label>
                                <span className="text-sm text-gray-400">Sent to: {email}</span>
                            </div>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 focus:outline-none"
                                required
                                pattern="[0-9]{6}"
                                maxLength={6}
                                placeholder="Enter 6-digit code"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isRegistering}
                            className="btn w-full bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                            {isRegistering ? 'Verifying...' : 'Verify & Complete Registration'}
                        </button>
                    </form>

                    <div className="flex justify-between items-center pt-2">
                        <button
                            onClick={() => {
                                setIsVerifying(false);
                                setCode('');
                                setMessage('');
                                setError('');
                            }}
                            className="text-sm text-blue-400 hover:text-blue-300"
                        >
                            ← Change Email
                        </button>
                        <button
                            onClick={resendOTP}
                            disabled={isRegistering}
                            className="text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50"
                        >
                            Resend Code
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
