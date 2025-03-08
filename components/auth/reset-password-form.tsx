"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export function ResetPasswordForm({ onToggleForm }: { onToggleForm: () => void }) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const { resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const { success, error, message } = await resetPassword(email)

      if (!success && error) {
        setErrorMessage(error)
      } else if (success && message) {
        setSuccessMessage(message)
        // Clear form
        setEmail("")
      }
    } catch (error) {
      setErrorMessage("Falha ao enviar o email de redefinição. Por favor, tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#F2BE13]">Redefinir Senha</h2>
        <p className="text-[#F2BE13]/70 mt-1">Enviaremos um link para redefinir sua senha</p>
      </div>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-black/40 border-[#F2BE13]/20 text-[#F2BE13]"
          />
        </div>
        <Button type="submit" disabled={isLoading} className="w-full bg-[#F2BE13] text-black hover:bg-[#F2BE13]/90">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
            </>
          ) : (
            "Enviar Link de Redefinição"
          )}
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm text-[#F2BE13]/70">
          <button type="button" onClick={() => onToggleForm("login")} className="text-[#F2BE13] hover:underline">
            Voltar para o login
          </button>
        </p>
      </div>
    </div>
  )
}

