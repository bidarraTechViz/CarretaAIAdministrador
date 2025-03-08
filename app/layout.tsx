"use client"

import type React from "react"

import "./globals.css"
import { Inter } from "next/font/google"
import { Sidebar } from "@/components/sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { usePathname } from "next/navigation"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isStartPage = pathname === "/" || pathname === "/startPage" || pathname === "/reset-password"

  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          <div className="flex flex-col h-screen md:flex-row">
            {!isStartPage && <Sidebar className="hidden md:block" />}
            <main className={`flex-1 overflow-y-auto ${isStartPage ? "" : "bg-[#F2BE13]"} p-4 pb-24 md:p-8 md:pb-8`}>
              {children}
            </main>
            {!isStartPage && <MobileNav />}
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}