"use client"

import { Button } from "@/components/ui/button"
import { TruckIcon } from "lucide-react"
import { useRouter } from "next/navigation"

export default function StartPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen w-full bg-[#F2BE13] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] bg-black rounded-lg p-8 space-y-6">
        <div className="flex flex-col items-center gap-2 mb-6">
          <TruckIcon className="h-12 w-12 text-[#F2BE13]" />
          <h1 className="text-2xl font-semibold text-[#F2BE13]">Carreta.AI</h1>
        </div>

        <div className="text-center">
          <p className="text-[#F2BE13] mb-6">Bem-vindo ao sistema de gerenciamento de caminhões e projetos.</p>

          <Button
            className="w-full bg-[#F2BE13] hover:bg-[#F2BE13]/90 text-black font-semibold"
            onClick={() => router.push("/dashboard")}
          >
            Entrar no Sistema
          </Button>
        </div>
      </div>
    </div>
  )
}

