"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getActiveProjects, getCompletedProjects, getClients } from "@/lib/db-service"
import { supabase, type Project, type Client } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

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
      await supabase.from("projects").update({ status: "completed" }).eq("id", id).single()
      await loadData()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao concluir projeto")
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
    loadData()
  }, [])

  const renderProjectDetails = (project: Project) => (
    <div>
      <p>Cliente: {project.client}</p>
      <p>Endereço: {project.address}</p>
      <p>Volume Estimado: {project.estimated_volume} m³</p>
      <p>Volume Transportado: {project.transported_volume} m³</p>
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

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markProjectAsCompleted(project.id)}
                >
                  Concluir
                </Button>

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
      <h1 className="text-xl font-bold">Projetos</h1>
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
    updateProject({
      id: selectedProject.id,
      name: formData.get("projectName") as string,
      client: formData.get("clientName") as string,
      address: formData.get("address") as string,
      estimated_volume: Number(formData.get("estimatedVolume")),
      transported_volume: Number(formData.get("transportedVolume")),
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

  <Button type="submit">Atualizar Projeto</Button>
</form>

          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Page
