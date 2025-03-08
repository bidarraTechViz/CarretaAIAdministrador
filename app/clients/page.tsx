"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getClientsWithProjects } from "@/lib/db-service"
import { supabase, type Client } from "@/lib/supabase"
import { Loader2, Pencil, Trash2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    try {
      setLoading(true)
      setError(null)
      const clientsData = await getClientsWithProjects()
      setClients(clientsData)
    } catch (e) {
      console.error("Erro ao carregar clientes:", e)
      setError("Erro ao carregar clientes. Por favor, tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleAddClient = async (formData: FormData) => {
    try {
      setSubmitting(true)
      setError(null)

      const newClient = {
        name: formData.get("clientName") as string,
        username: formData.get("username") as string,
      }

      const { data, error } = await supabase.from("clients").insert(newClient)

      if (error) {
        throw error
      }

      await loadClients()
      setIsAddDialogOpen(false)
      toast({
        title: "Cliente adicionado",
        description: "O cliente foi adicionado com sucesso.",
      })
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Erro ao adicionar cliente"
      setError(errorMessage)
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateClient = async (formData: FormData) => {
    try {
      if (!selectedClient) return

      setSubmitting(true)
      setError(null)

      const updatedClient = {
        name: formData.get("clientName") as string,
        username: formData.get("username") as string,
      }

      const { data, error } = await supabase.from("clients").update(updatedClient).eq("id", selectedClient.id)

      if (error) {
        throw error
      }

      await loadClients()
      setIsEditDialogOpen(false)
      setSelectedClient(null)
      toast({
        title: "Cliente atualizado",
        description: "O cliente foi atualizado com sucesso.",
      })
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Erro ao atualizar cliente"
      setError(errorMessage)
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteClient = async () => {
    try {
      if (!selectedClient) return

      setSubmitting(true)
      setError(null)

      const { data, error } = await supabase.from("clients").delete().eq("id", selectedClient.id)

      if (error) {
        throw error
      }

      await loadClients()
      setIsDeleteDialogOpen(false)
      setSelectedClient(null)
      toast({
        title: "Cliente excluído",
        description: "O cliente foi excluído com sucesso.",
      })
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Erro ao excluir cliente"
      setError(errorMessage)
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-black">Clientes</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-black text-[#F2BE13] hover:bg-black/80">Adicionar Cliente</Button>
          </DialogTrigger>
          <DialogContent className="bg-black text-[#F2BE13]">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Cliente</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleAddClient(new FormData(e.currentTarget))
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="clientName">Nome do Cliente</Label>
                <Input
                  id="clientName"
                  name="clientName"
                  required
                  className="bg-black/40 border-[#F2BE13]/20 text-[#F2BE13]"
                />
              </div>
              <div>
                <Label htmlFor="username">Nome de Usuário</Label>
                <Input
                  id="username"
                  name="username"
                  required
                  className="bg-black/40 border-[#F2BE13]/20 text-[#F2BE13]"
                />
              </div>
              <Button type="submit" className="bg-[#F2BE13] text-black hover:bg-[#F2BE13]/80" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  "Adicionar Cliente"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && <div className="bg-red-500 text-white p-4 rounded-md">{error}</div>}

      {loading ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-black" />
        </div>
      ) : clients.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.id} className="bg-black text-[#F2BE13]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>{client.name}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedClient(client)
                      setIsEditDialogOpen(true)
                    }}
                    className="h-8 w-8 text-[#F2BE13] hover:bg-[#F2BE13]/10"
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Editar</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedClient(client)
                      setIsDeleteDialogOpen(true)
                    }}
                    className="h-8 w-8 text-red-400 hover:bg-red-500/10 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Excluir</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-[#F2BE13]/70">Username: {client.username}</p>
                  {client.projects && Array.isArray(client.projects) && (
                    <div>
                      <p className="font-medium mb-2">Projetos Ativos:</p>
                      <ul className="space-y-1">
                        {client.projects
                          .filter((project: any) => project.status === "active")
                          .map((project: any) => (
                            <li key={project.id} className="text-sm">
                              {project.name} - {project.transported_volume}/{project.estimated_volume} m³
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center">Nenhum cliente encontrado.</div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-black text-[#F2BE13]">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleUpdateClient(new FormData(e.currentTarget))
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="editClientName">Nome do Cliente</Label>
                <Input
                  id="editClientName"
                  name="clientName"
                  defaultValue={selectedClient.name}
                  required
                  className="bg-black/40 border-[#F2BE13]/20 text-[#F2BE13]"
                />
              </div>
              <div>
                <Label htmlFor="editUsername">Nome de Usuário</Label>
                <Input
                  id="editUsername"
                  name="username"
                  defaultValue={selectedClient.username}
                  required
                  className="bg-black/40 border-[#F2BE13]/20 text-[#F2BE13]"
                />
              </div>
              <Button type="submit" className="bg-[#F2BE13] text-black hover:bg-[#F2BE13]/80" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  "Atualizar Cliente"
                )}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-black text-[#F2BE13]">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-[#F2BE13]/70">
              Tem certeza que deseja excluir o cliente {selectedClient?.name}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent text-[#F2BE13] hover:bg-[#F2BE13]/10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={handleDeleteClient}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

