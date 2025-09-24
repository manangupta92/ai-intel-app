'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, token } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If not authenticated and token check is complete, redirect to login
    if (!isAuthenticated && token === null) {
      router.push('/auth/login')
      return
    }
  }, [isAuthenticated, token, router])

  // Show loading state while authentication is being verified
  if (token === null && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <div className="mt-4">Loading...</div>
        </div>
      </div>
    )
  }

  // Only render children if authenticated
  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
