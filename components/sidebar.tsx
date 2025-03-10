"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { TruckIcon, LayoutDashboard, Clock, Users, FolderOpen, Menu, LogOut, UsersIcon } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

const menuItems = [
  { icon: LayoutDashboard, label: "Painel", href: "/dashboard" },
  /*{ icon: Clock, label: "Tempo Real", href: "/real-time" },*/
  { icon: Users, label: "Clientes", href: "/clients" },
  { icon: FolderOpen, label: "Projetos", href: "/projects" },
  { icon: TruckIcon, label: "Caminhões", href: "/trucks" },
  { icon: UsersIcon, label: 'Operadores', href: '/operator'}
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const { signOut } = useAuth()

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const handleLogout = async () => {
    await signOut()
  }

  return (
    <>
      <Button variant="ghost" className="hidden md:fixed md:top-4 md:left-4 md:z-50" onClick={toggleSidebar}>
        <Menu className="h-6 w-6" />
      </Button>
      <div
        className={`fixed inset-y-0 left-0 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0 transition duration-200 ease-in-out z-30 md:z-auto ${className}`}
      >
        <div className="h-full w-64 bg-black text-[#F2BE13] p-4 flex flex-col">
          <div className="flex items-center justify-center mb-8">
            <TruckIcon className="h-8 w-8 mr-2" />
            <span className="text-xl font-semibold">Carreta.AI</span>
          </div>
          <nav className="flex-1">
            {menuItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start mb-2 ${
                    pathname === item.href ? "bg-[#F2BE13] text-black" : "hover:bg-[#F2BE13]/10"
                  }`}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
          <Button
            variant="ghost"
            className="w-full justify-start mt-auto mb-4 hover:bg-[#F2BE13]/10 text-red-400 hover:text-red-500"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    </>
  )
}

