import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function middleware(request: NextRequest) {
  const url = new URL(request.url)
  const path = url.pathname

  // Public paths that don't require authentication
  const publicPaths = ["/", "/startPage", "/reset-password"]

  if (publicPaths.includes(path)) {
    return NextResponse.next()
  }

  // Check if user is authenticated
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  
  // Create client with cookie configuration
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: {
        getItem: async (key) => {
          const cookies = request.cookies.get(key)
          return cookies?.value || null
        },
        setItem: async (key, value) => {
          // Middleware is read-only, so we don't need to implement this
        },
        removeItem: async (key) => {
          // Middleware is read-only, so we don't need to implement this
        },
      },
    },
  })

  try {
    // Get session from cookie
    const { data: { session } } = await supabase.auth.getSession()

    // If no session, redirect to login
    if (!session) {
      return NextResponse.redirect(new URL("/", request.url))
      console.log("Não há sessão")
    }

    return NextResponse.next()
  } catch (error) {
    console.error('Error in middleware:', error)
    return NextResponse.redirect(new URL("/", request.url))
  }
}

export const config = {
  matcher: [
    // Match all paths except static files, api routes, and public paths
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
}

