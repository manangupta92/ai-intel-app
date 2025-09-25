'use client'

import { useAuth } from '@/lib/contexts/auth'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
    const { logout } = useAuth()
    const router = useRouter()

    const handleLogout = async () => {
        try {
            // Call the logout API to clear server-side cookies
            await fetch('/api/auth/logout', {
                method: 'POST',
            })

            // Clear client-side auth state
            logout()

            // Redirect to login page
            router.push('/auth/login')
        } catch (error) {
            console.error('Logout failed:', error)
            // Still clear client-side state even if API call fails
            logout()
            router.push('/auth/login')
        }
    }

    return (
        <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
        >
            Logout
        </button>
    )
}
