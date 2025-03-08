"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { supabaseAuthClient, signIn, signUp, signOut, resetPassword, updatePassword } from "@/lib/supabase-auth"

type AuthContextType = {
  user: User | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check for active session on mount
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabaseAuthClient.auth.getSession()
        if (session?.user) {
          setUser(session.user)
        }
      } catch (error) {
        console.error("Error checking session:", error)
        setError("Failed to retrieve authentication status")
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabaseAuthClient.auth.onAuthStateChange(async (event: any, session: any) => {
      if (session?.user) {
        setUser(session.user)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [loading, user])

  const handleSignIn = async (email: string, password: string) => {
    try {
      setError(null)
      const { data, error } = await signIn(email, password)

      if (error) {
        setError(error.message)
        return { success: false, error: error.message }
      }

      if (data?.user) {
        setUser(data.user)
        console.log('Login bem-sucedido, redirecionando...')
        window.location.href = '/dashboard'  // Forçar redirecionamento
        return { success: true }
      }

      return { success: false, error: "Login failed" }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const handleSignUp = async (email: string, password: string) => {
    try {
      setError(null)
      const { data, error } = await signUp(email, password)

      if (error) {
        setError(error.message)
        return { success: false, error: error.message }
      }

      return {
        success: true,
        message: "Registration successful! Please check your email to confirm your account.",
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const handleSignOut = async () => {
    try {
      setError(null)
      const { error } = await signOut()

      if (error) {
        setError(error.message)
      }

      setUser(null)
      router.push("/")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred"
      setError(errorMessage)
    }
  }

  const handleResetPassword = async (email: string) => {
    try {
      setError(null)
      const { error } = await resetPassword(email)

      if (error) {
        setError(error.message)
        return { success: false, error: error.message }
      }

      return {
        success: true,
        message: "Password reset instructions have been sent to your email.",
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const handleUpdatePassword = async (password: string) => {
    try {
      setError(null)
      const { data, error } = await updatePassword(password)

      if (error) {
        setError(error.message)
        return { success: false, error: error.message }
      }

      return { success: true, message: "Password updated successfully." }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const value = {
    user,
    loading,
    error,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
    updatePassword: handleUpdatePassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

