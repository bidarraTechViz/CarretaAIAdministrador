"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export function LoginForm({ onToggleForm }: { onToggleForm: () => void }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const { success, error } = await signIn(email, password)

      if (!success && error) {
        setErrorMessage(error)
      }
    } catch (error) {
      setErrorMessage("Failed to login. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#F2BE13]">Login</h2>
        <p className="text-[#F2BE13]/70 mt-1">Entre com sua conta para acessar o sistema</p>
      </div>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
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
          <div className="flex justify-between">
            <Label htmlFor="password">Senha</Label>
            <button
              type="button"
              onClick={() => onToggleForm()}
              className="text-xs text-[#F2BE13]/70 hover:text-[#F2BE13]"
            >
              Esqueceu a senha?
            </button>
          </div>
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
        <Button type="submit" disabled={isLoading} className="w-full bg-[#F2BE13] text-black hover:bg-[#F2BE13]/90">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando...
            </>
          ) : (
            "Entrar"
          )}
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm text-[#F2BE13]/70">
          Não tem uma conta?{" "}
          <button type="button" onClick={() => onToggleForm()} className="text-[#F2BE13] hover:underline">
            Registre-se
          </button>
        </p>
      </div>
    </div>
  )
}

