"use client"

import { useState, useEffect } from "react"
import { TruckIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

type AuthFormType = "login" | "register" | "reset"

export default function StartPage() {
  const [authForm, setAuthForm] = useState<AuthFormType>("login")
  const { user, loading } = useAuth()
  const router = useRouter()

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (user && !loading) {
      router.push("/dashboard")
    }
  }, [user, loading, router])

  const toggleForm = (form: AuthFormType) => {
    setAuthForm(form)
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#F2BE13] flex items-center justify-center p-4">
        <div className="w-full max-w-[400px] bg-black rounded-lg p-8 space-y-6 flex flex-col items-center">
          <TruckIcon className="h-12 w-12 text-[#F2BE13] animate-pulse" />
          <p className="text-[#F2BE13]">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-[#F2BE13] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] bg-black rounded-lg p-8 space-y-6">
        <div className="flex flex-col items-center gap-2 mb-6">
          <TruckIcon className="h-12 w-12 text-[#F2BE13]" />
          <h1 className="text-2xl font-semibold text-[#F2BE13]">Carreta.AI</h1>
        </div>

        {authForm === "login" && <LoginForm onToggleForm={() => toggleForm("register")} />}
        {authForm === "register" && <RegisterForm onToggleForm={() => toggleForm("login")} />}
        {authForm === "reset" && <ResetPasswordForm onToggleForm={() => toggleForm("login")} />}
      </div>
    </div>
  )
}

