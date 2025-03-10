"use client"

import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, FolderOpen, Users, TruckIcon, LogOut, UsersIcon } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export function MobileNav() {
  const router = useRouter()
  const pathname = usePathname()
  const { signOut } = useAuth()

  if (pathname === "/" || pathname === "/startPage" || pathname === "/reset-password") {
    return null
  }

  const handleLogout = async () => {
    await signOut()
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black p-4 flex justify-center items-center gap-6 md:hidden">
      <Button
        variant="ghost"
        className={`flex flex-col items-center ${
          pathname === "/dashboard" ? "text-[#F2BE13]" : "text-[#F2BE13]/70"
        } hover:text-[#F2BE13]`}
        onClick={() => router.push("/dashboard")}
      >
        <LayoutDashboard className="h-6 w-6" />
        <span className="text-xs mt-1">Painel</span>
      </Button>
      <Button
        variant="ghost"
        className={`flex flex-col items-center ${
          pathname === "/projects" ? "text-[#F2BE13]" : "text-[#F2BE13]/70"
        } hover:text-[#F2BE13]`}
        onClick={() => router.push("/projects")}
      >
        <FolderOpen className="h-6 w-6" />
        <span className="text-xs mt-1">Projetos</span>
      </Button>
      <Button
        variant="ghost"
        className={`flex flex-col items-center ${
          pathname === "/trucks" ? "text-[#F2BE13]" : "text-[#F2BE13]/70"
        } hover:text-[#F2BE13]`}
        onClick={() => router.push("/trucks")}
      >
        <TruckIcon className="h-6 w-6" />
        <span className="text-xs mt-1">Caminhões</span>
      </Button>
      <Button
        variant="ghost"
        className={`flex flex-col items-center ${
          pathname === "/clients" ? "text-[#F2BE13]" : "text-[#F2BE13]/70"
        } hover:text-[#F2BE13]`}
        onClick={() => router.push("/clients")}
      >
        <UsersIcon className="h-6 w-6" />
        <span className="text-xs mt-1">Clientes</span>
      </Button>
      <Button
        variant="ghost"
        className="flex flex-col items-center text-red-400 hover:text-red-500"
        onClick={handleLogout}
      >
        <LogOut className="h-6 w-6" />
        <span className="text-xs mt-1">Sair</span>
      </Button>
    </div>
  )
}

