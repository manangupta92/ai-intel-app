import { useState } from 'react';
import { useAuth } from '@/lib/contexts/auth';

interface LoginFormProps {
  onLoginSuccess: (token: string) => void;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const requestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsRequesting(true);

    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        throw new Error('Failed to send OTP');
      }

      setMessage('OTP has been sent to your email');
      setIsVerifying(true);
    } catch (error) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setIsRequesting(false);
    }
  };

  const verifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsRequesting(true);

    try {
      const success = await login(email, code);
      if (!success) {
        throw new Error('Invalid OTP');
      }
      setMessage('Successfully logged in!');
      if (success && onLoginSuccess) {
        const token = localStorage.getItem('authToken');
        if (token) {
          onLoginSuccess(token);
        }
      }
    } catch (error) {
      setError('Invalid OTP. Please try again.');
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="card p-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Login</h2>
      
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
        <form onSubmit={requestOTP} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 rounded bg-gray-800"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isRequesting}
            className="btn w-full"
          >
            {isRequesting ? 'Sending...' : 'Get OTP'}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <form onSubmit={verifyOTP} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium">Enter OTP</label>
                <span className="text-sm text-gray-400">Sent to: {email}</span>
              </div>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full p-2 rounded bg-gray-800"
                required
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="Enter 6-digit code"
              />
            </div>
            <button
              type="submit"
              disabled={isRequesting}
              className="btn w-full"
            >
              {isRequesting ? 'Verifying...' : 'Verify OTP'}
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
              onClick={async () => {
                setMessage('');
                setError('');
                await requestOTP({ preventDefault: () => {} } as React.FormEvent);
              }}
              disabled={isRequesting}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Resend OTP
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
