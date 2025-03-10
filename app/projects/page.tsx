"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getActiveProjects, getCompletedProjects, getClients, updateProjectsSchema } from "@/lib/db-service"
import { supabase, type Project, type Client } from "@/lib/supabase"
import { Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

const Page = () => {
  const [activeProjects, setActiveProjects] = useState<Project[]>([])
  const [completedProjects, setCompletedProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const updateProject = async (updatedProject: Partial<Project> & { id: number }) => {
    try {
      setError(null)
      await supabase.from("projects").update(updatedProject).eq("id", updatedProject.id).single()
      await loadData()
      setIsEditDialogOpen(false)
      setSelectedProject(null)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao atualizar projeto")
    }
  }

  const markProjectAsCompleted = async (id: number) => {
    try {
      setError(null)
      if (!confirm("Tem certeza que deseja marcar este projeto como concluído?")) {
        return
      }
      await supabase.from("projects").update({ 
        status: "completed",
        end_time: new Date().toISOString()
      }).eq("id", id).single()
      await loadData()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao concluir projeto")
    }
  }

  const revertProjectCompletion = async (id: number) => {
    try {
      setError(null)
      if (!confirm("Tem certeza que deseja reverter a conclusão deste projeto?")) {
        return
      }
      await supabase.from("projects").update({ 
        status: "active",
        end_time: null // Limpar o campo de conclusão
      }).eq("id", id).single()
      await loadData()
      toast({
        title: "Sucesso",
        description: "A conclusão do projeto foi revertida com sucesso.",
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao reverter conclusão do projeto")
      toast({
        title: "Erro",
        description: "Não foi possível reverter a conclusão do projeto.",
        variant: "destructive",
      })
    }
  }

  const deleteProject = async (id: number) => {
    try {
      setError(null)
      if (!confirm("Tem certeza que deseja excluir este projeto?")) {
        return
      }
      await supabase.from("projects").delete().eq("id", id).single()
      await loadData()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao excluir projeto")
    }
  }

  const addProject = async (newProject: Partial<Project>) => {
    try {
      if (newProject.client) {
        const { data: clientData } = await supabase
          .from("clients")
          .select("id")
          .eq("name", newProject.client)
          .single()

        if (clientData) {
          newProject.client_id = clientData.id
        }
      }

      await supabase.from("projects").insert([newProject])
      await loadData()
      setIsAddDialogOpen(false)
    } catch (error) {
      setError("Erro ao adicionar projeto. Por favor, tente novamente.")
    }
  }

  const loadData = async () => {
    setIsLoading(true)
    const active = await getActiveProjects()
    const completed = await getCompletedProjects()
    const clientList = await getClients()
    setActiveProjects(active)
    setCompletedProjects(completed)
    setClients(clientList)
    setIsLoading(false)
  }

  useEffect(() => {
    // Atualizar o esquema do banco de dados e carregar os dados
    const initPage = async () => {
      try {
        // Tentar atualizar o esquema do banco de dados
        const schemaResult = await updateProjectsSchema();
        if (schemaResult.success) {
          console.log("Esquema atualizado:", schemaResult.message);
        } else {
          console.error("Erro ao atualizar esquema:", schemaResult.error);
        }
      } catch (error) {
        console.error("Erro ao inicializar página:", error);
      } finally {
        // Carregar os dados independentemente do resultado da atualização do esquema
        loadData();
      }
    };

    initPage();
  }, [])

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Não definido";
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderProjectDetails = (project: Project) => (
    <div className="space-y-2">
      <p><strong>Cliente:</strong> {project.client}</p>
      <p><strong>Endereço:</strong> {project.address}</p>
      <p><strong>Volume Estimado:</strong> {project.estimated_volume} m³</p>
      <p><strong>Volume Transportado:</strong> {project.transported_volume} m³</p>
      <p><strong>Status:</strong> {project.status === "active" ? "Ativo" : "Concluído"}</p>
      <p><strong>Data de Início:</strong> {formatDate(project.start_time)}</p>
      <p><strong>Prazo Estimado:</strong> {formatDate(project.estimated_end_time)}</p>
      {project.status === "completed" && (
        <p><strong>Data de Conclusão:</strong> {formatDate(project.end_time)}</p>
      )}
    </div>
  )

  const renderProjectsTable = (projects: Project[]) => (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border border-gray-300 p-2 text-left">Projeto</th>
            <th className="border border-gray-300 p-2 text-center">Ações</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id} className="hover:bg-gray-50">
              <td className="border border-gray-300 p-2">{project.name}</td>
              <td className="border border-gray-300 p-2 space-x-2 flex justify-center">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">Ver Detalhes</Button>
                  </DialogTrigger>
                  <DialogContent className="bg-black text-[#F2BE13]">
                    <DialogHeader>
                      <DialogTitle>{project.name}</DialogTitle>
                    </DialogHeader>
                    {renderProjectDetails(project)}
                  </DialogContent>
                </Dialog>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedProject(project)
                    setIsEditDialogOpen(true)
                  }}
                >
                  Editar
                </Button>

                {/* Mostrar botão "Concluir" apenas para projetos ativos */}
                {project.status === "active" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => markProjectAsCompleted(project.id)}
                  >
                    Concluir
                  </Button>
                )}

                {/* Mostrar botão "Reverter Conclusão" apenas para projetos concluídos */}
                {project.status === "completed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => revertProjectCompletion(project.id)}
                  >
                    Reverter Conclusão
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteProject(project.id)}
                >
                  Excluir
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Projetos</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-black text-[#F2BE13] hover:bg-black/80">Adicionar Projeto</Button>
          </DialogTrigger>
          <DialogContent className="bg-black text-[#F2BE13]">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Projeto</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                
                // Obter e formatar as datas
                const startTimeValue = formData.get("startTime") as string;
                const estimatedEndTimeValue = formData.get("estimatedEndTime") as string;
                
                // Criar objeto do projeto com os novos campos
                addProject({
                  name: formData.get("projectName") as string,
                  client: formData.get("clientName") as string,
                  address: formData.get("address") as string,
                  estimated_volume: Number(formData.get("estimatedVolume")),
                  transported_volume: 0, // Inicialmente zero
                  status: "active", // Novo projeto sempre começa como ativo
                  start_time: startTimeValue ? new Date(startTimeValue).toISOString() : new Date().toISOString(), // Data atual se não for fornecida
                  estimated_end_time: estimatedEndTimeValue ? new Date(estimatedEndTimeValue).toISOString() : undefined,
                })
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="projectName">Nome do Projeto</Label>
                <Input 
                  id="projectName" 
                  name="projectName" 
                  required 
                  className="bg-black/40 border-[#F2BE13]/20 text-[#F2BE13]"
                />
              </div>

              <div>
                <Label htmlFor="clientName">Cliente</Label>
                <Select name="clientName" required>
                  <SelectTrigger className="bg-black/40 border-[#F2BE13]/20 text-[#F2BE13]">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent className="bg-black text-[#F2BE13]">
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.name}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="address">Endereço</Label>
                <Input 
                  id="address" 
                  name="address" 
                  required 
                  className="bg-black/40 border-[#F2BE13]/20 text-[#F2BE13]"
                />
              </div>

              <div>
                <Label htmlFor="estimatedVolume">Volume Estimado (m³)</Label>
                <Input 
                  id="estimatedVolume" 
                  name="estimatedVolume" 
                  type="number" 
                  step="0.01"
                  required 
                  className="bg-black/40 border-[#F2BE13]/20 text-[#F2BE13]"
                />
              </div>
              
              <div>
                <Label htmlFor="startTime">Data de Início</Label>
                <Input 
                  id="startTime" 
                  name="startTime" 
                  type="datetime-local" 
                  defaultValue={new Date().toISOString().slice(0, 16)}
                  className="bg-black/40 border-[#F2BE13]/20 text-[#F2BE13]"
                />
              </div>
              
              <div>
                <Label htmlFor="estimatedEndTime">Prazo Estimado</Label>
                <Input 
                  id="estimatedEndTime" 
                  name="estimatedEndTime" 
                  type="datetime-local"
                  className="bg-black/40 border-[#F2BE13]/20 text-[#F2BE13]"
                />
              </div>

              <Button type="submit" className="bg-[#F2BE13] text-black hover:bg-[#F2BE13]/80">
                Criar Projeto
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="animate-spin h-12 w-12 text-gray-500" />
        </div>
      ) : (
        <>
          <h2 className="font-semibold">Projetos Ativos</h2>
          {renderProjectsTable(activeProjects)}

          <h2 className="font-semibold mt-6">Projetos Concluídos</h2>
          {renderProjectsTable(completedProjects)}
        </>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-black text-[#F2BE13]">
          <DialogHeader>
            <DialogTitle>Editar Projeto</DialogTitle>
          </DialogHeader>
          {selectedProject && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                
                // Obter e formatar as datas
                const startTimeValue = formData.get("startTime") as string;
                const estimatedEndTimeValue = formData.get("estimatedEndTime") as string;
                const endTimeValue = formData.get("endTime") as string;
                
                updateProject({
                  id: selectedProject.id,
                  name: formData.get("projectName") as string,
                  client: formData.get("clientName") as string,
                  address: formData.get("address") as string,
                  estimated_volume: Number(formData.get("estimatedVolume")),
                  transported_volume: Number(formData.get("transportedVolume")),
                  start_time: startTimeValue ? new Date(startTimeValue).toISOString() : selectedProject.start_time,
                  estimated_end_time: estimatedEndTimeValue ? new Date(estimatedEndTimeValue).toISOString() : selectedProject.estimated_end_time,
                  end_time: endTimeValue ? new Date(endTimeValue).toISOString() : selectedProject.end_time,
                })
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="projectName">Nome do Projeto</Label>
                <Input id="projectName" name="projectName" defaultValue={selectedProject.name} required />
              </div>

              <div>
                <Label htmlFor="clientName">Cliente</Label>
                <Select name="clientName" defaultValue={selectedProject.client}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.name}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="address">Endereço</Label>
                <Input id="address" name="address" defaultValue={selectedProject.address} required />
              </div>

              <div>
                <Label htmlFor="estimatedVolume">Volume Estimado (m³)</Label>
                <Input id="estimatedVolume" name="estimatedVolume" type="number" defaultValue={selectedProject.estimated_volume} required />
              </div>

              <div>
                <Label htmlFor="transportedVolume">Volume Transportado (m³)</Label>
                <Input id="transportedVolume" name="transportedVolume" type="number" defaultValue={selectedProject.transported_volume} required />
              </div>
              
              <div>
                <Label htmlFor="startTime">Data de Início</Label>
                <Input 
                  id="startTime" 
                  name="startTime" 
                  type="datetime-local" 
                  defaultValue={selectedProject.start_time ? new Date(selectedProject.start_time).toISOString().slice(0, 16) : ''}
                />
              </div>
              
              <div>
                <Label htmlFor="estimatedEndTime">Prazo Estimado</Label>
                <Input 
                  id="estimatedEndTime" 
                  name="estimatedEndTime" 
                  type="datetime-local"
                  defaultValue={selectedProject.estimated_end_time ? new Date(selectedProject.estimated_end_time).toISOString().slice(0, 16) : ''}
                />
              </div>
              
              {selectedProject.status === "completed" && (
                <div>
                  <Label htmlFor="endTime">Data de Conclusão</Label>
                  <Input 
                    id="endTime" 
                    name="endTime" 
                    type="datetime-local"
                    defaultValue={selectedProject.end_time ? new Date(selectedProject.end_time).toISOString().slice(0, 16) : ''}
                  />
                </div>
              )}

              <Button type="submit">Atualizar Projeto</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Page
