'use client'

import { useRouter } from 'next/navigation'
import LoginForm from '@/app/components/LoginForm'

export default function Login() {
  const router = useRouter()

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
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full p-6">
        <LoginForm onLoginSuccess={onLoginSuccess} />
      </div>
    </div>
  )
}