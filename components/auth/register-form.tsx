"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export function RegisterForm({ onToggleForm }: { onToggleForm: () => void }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const { signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    // Validate passwords match
    if (password !== confirmPassword) {
      setErrorMessage("As senhas não coincidem")
      setIsLoading(false)
      return
    }

    // Validate password strength
    if (password.length < 8) {
      setErrorMessage("A senha deve ter pelo menos 8 caracteres")
      setIsLoading(false)
      return
    }

    try {
      const { success, error, message } = await signUp(email, password)

      if (!success && error) {
        setErrorMessage(error)
      } else if (success && message) {
        setSuccessMessage(message)
        // Clear form
        setEmail("")
        setPassword("")
        setConfirmPassword("")
      }
    } catch (error) {
      setErrorMessage("Falha no registro. Por favor, tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#F2BE13]">Registrar</h2>
        <p className="text-[#F2BE13]/70 mt-1">Crie uma nova conta para acessar o sistema</p>
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
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-black/40 border-[#F2BE13]/20 text-[#F2BE13]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar Senha</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="bg-black/40 border-[#F2BE13]/20 text-[#F2BE13]"
          />
        </div>
        <Button type="submit" disabled={isLoading} className="w-full bg-[#F2BE13] text-black hover:bg-[#F2BE13]/90">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registrando...
            </>
          ) : (
            "Registrar"
          )}
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm text-[#F2BE13]/70">
          Já tem uma conta?{" "}
          <button type="button" onClick={() => onToggleForm("login")} className="text-[#F2BE13] hover:underline">
            Faça login
          </button>
        </p>
      </div>
    </div>
  )
}

