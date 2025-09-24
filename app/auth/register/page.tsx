'use client'

import { useRouter } from 'next/navigation'
import RegisterForm from '@/app/components/RegisterForm'

export default function Register() {
    const router = useRouter()

    // Handle successful registration
    const onRegisterSuccess = () => {
        // Redirect to login page with success message
        router.push('/auth/login?registered=true')
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
            <div className="max-w-md w-full p-6">
                <RegisterForm onRegisterSuccess={onRegisterSuccess} />
            </div>
        </div>
    )
}
