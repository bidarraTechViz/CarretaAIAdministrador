"use client"

import { UpdatePasswordForm } from "@/components/auth/update-password-form"
import { TruckIcon } from "lucide-react"

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen w-full bg-[#F2BE13] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] bg-black rounded-lg p-8 space-y-6">
        <div className="flex flex-col items-center gap-2 mb-6">
          <TruckIcon className="h-12 w-12 text-[#F2BE13]" />
          <h1 className="text-2xl font-semibold text-[#F2BE13]">Carreta.AI</h1>
        </div>

        <UpdatePasswordForm />
      </div>
    </div>
  )
}

