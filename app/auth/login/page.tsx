'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import LoginForm from '@/app/components/LoginForm'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showRegistrationSuccess, setShowRegistrationSuccess] = useState(false)

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setShowRegistrationSuccess(true)
    }
  }, [searchParams])

  // Handle successful login
  const onLoginSuccess = (token: string) => {
    // Set token in localStorage
    localStorage.setItem('token', token)
    // Set token as cookie
    document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`
    // Redirect to home page
    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
      <div className="max-w-md w-full p-6">
        {showRegistrationSuccess && (
          <div className="bg-green-900/50 text-green-200 p-3 rounded mb-4 text-center">
            Registration completed successfully! You can now log in.
          </div>
        )}
        <LoginForm onLoginSuccess={onLoginSuccess} />
      </div>
    </div>
  )
}

export default function Login() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <div className="mt-4">Loading...</div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}