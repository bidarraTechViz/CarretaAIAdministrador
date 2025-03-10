"use client"

import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { supabaseAuthClient, signIn, signUp, signOut, resetPassword, updatePassword, getCurrentUser } from "@/lib/supabase-auth"

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
    // Verificar autenticação apenas uma vez na montagem
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
    
    // Configurar listener para mudanças de autenticação
    const { data: authListener } = supabaseAuthClient.auth.onAuthStateChange(
      async (event, session) => {
        // Só atualizar o estado quando realmente houver mudanças
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          const currentUser = session?.user || null
          setUser(currentUser)
        }
      }
    )
    
    // Limpar o listener ao desmontar
    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, []) // Executar apenas na montagem inicial

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

