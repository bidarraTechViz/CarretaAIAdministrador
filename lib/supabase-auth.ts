import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export const supabaseAuthClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: {
      getItem: (key) => {
        if (typeof window !== "undefined") {
          return Promise.resolve(document.cookie.split('; ').find(row => row.startsWith(key))?.split('=')[1] || null)
        }
        return Promise.resolve(null)
      },
      setItem: (key, value) => {
        if (typeof window !== "undefined") {
          document.cookie = `${key}=${value}; path=/;`
        }
        return Promise.resolve()
      },
      removeItem: (key) => {
        if (typeof window !== "undefined") {
          document.cookie = `${key}=; Max-Age=0; path=/;`
        }
        return Promise.resolve()
      }
    }
  }
})

// Helper functions for authentication
export async function signUp(email: string, password: string) {
  const { data, error } = await supabaseAuthClient.auth.signUp({
    email,
    password,
  })
  return { data, error }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabaseAuthClient.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabaseAuthClient.auth.signOut()
  return { error }
}

export async function resetPassword(email: string) {
  const { data, error } = await supabaseAuthClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  return { data, error }
}

export async function updatePassword(password: string) {
  const { data, error } = await supabaseAuthClient.auth.updateUser({
    password,
  })
  return { data, error }
}

export async function getCurrentUser() {
  const {
    data: { session },
  } = await supabaseAuthClient.auth.getSession()
  if (!session) return null

  const {
    data: { user },
  } = await supabaseAuthClient.auth.getUser()
  return user
}

