'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')

  async function requestOTP(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      if (res.ok) {
        setStep(2)
        setError('')
      } else {
        setError('Failed to send OTP')
      }
    } catch (err) {
      setError('Something went wrong')
    }
  }

  async function verifyOTP(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        localStorage.setItem('token', data.token)
        // Set token as cookie
        document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`
        // Redirect to /api/run
        router.push('/')
      } else {
        setError(data.error || 'Verification failed')
      }
    } catch (err) {
      setError('Something went wrong')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-6 card">
        <h2 className="text-2xl font-bold text-center">Login</h2>
        
        {error && <div className="text-red-500 text-center">{error}</div>}
        
        {step === 1 ? (
          <form onSubmit={requestOTP} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn w-full">
              Send OTP
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOTP} className="space-y-4">
            <div>
              <label className="label">Enter OTP</label>
              <input
                type="text"
                className="input"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn w-full">
              Verify OTP
            </button>
          </form>
        )}
      </div>
    </div>
  )
}