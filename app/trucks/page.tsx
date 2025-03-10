"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createTruck, getActiveTrucks, getInactiveTrucks, updateTruckById } from "@/lib/db-service"
import type { Truck, Project } from "@/lib/supabase"
import { getProjects } from "@/lib/supabase"
import { checkTableColumns, type ColumnAvailability } from "@/lib/schema-utils"
import { AlertTriangle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const operators = [
  { value: "joao.silva", label: "João Silva" },
  { value: "maria.santos", label: "Maria Santos" },
  { value: "pedro.oliveira", label: "Pedro Oliveira" },
  { value: "ana.rodrigues", label: "Ana Rodrigues" },
  { value: "carlos.ferreira", label: "Carlos Ferreira" },
]

export default function Trucks() {
  const [activeTrucks, setActiveTrucks] = useState<Truck[]>([])
  const [inactiveTrucks, setInactiveTrucks] = useState<Truck[]>([])
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [schemaChecked, setSchemaChecked] = useState(false)
  const [schemaError, setSchemaError] = useState<string | null>(null)
  const [availableColumns, setAvailableColumns] = useState<ColumnAvailability>({
    current_project: false,
    project_id: false,
    load_volume: false,
    loadVolume: false,
    plate_number: false,
    plateNumber: false,
  })
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    // Verificar o esquema do banco de dados uma vez ao carregar o componente
    checkDatabaseSchema()
      .then(() => {
        loadTrucks()
        loadProjects()
      })
      .catch((err) => {
        console.error("Erro ao verificar esquema:", err)
        setSchemaError(
          "Não foi possível verificar o esquema do banco de dados. Algumas funcionalidades podem não funcionar corretamente.",
        )
        setSchemaChecked(true)
        // Tentar carregar os caminhões mesmo assim
        loadTrucks()
        loadProjects()
      })
  }, [])

  // Função para verificar o esquema do banco de dados
  async function checkDatabaseSchema() {
    try {
      // Mostrar toast de carregamento
      toast({
        title: "Verificando esquema do banco de dados",
        description: "Aguarde enquanto verificamos a estrutura do banco de dados...",
      })

      // Tentar verificar as colunas com tratamento de erro aprimorado
      let retryCount = 0
      let columns: ColumnAvailability | null = null

      while (retryCount < 3 && !columns) {
        try {
          columns = await checkTableColumns("trucks")
          break
        } catch (e) {
          console.error(`Tentativa ${retryCount + 1} falhou:`, e)
          retryCount++

          if (retryCount < 3) {
            // Esperar um pouco antes de tentar novamente
            await new Promise((resolve) => setTimeout(resolve, 1000))
          }
        }
      }

      if (!columns) {
        throw new Error("Não foi possível verificar as colunas após várias tentativas")
      }

      setAvailableColumns(columns)
      setSchemaChecked(true)

      console.log("Colunas disponíveis:", columns)

      // Verificar se há colunas críticas ausentes
      const missingColumns = []

      if (!columns.load_volume && !columns.loadVolume) {
        missingColumns.push("load_volume/loadVolume")
      }

      if (!columns.current_project && !columns.project_id) {
        missingColumns.push("current_project/project_id")
      }

      if (!columns.plate_number && !columns.plateNumber) {
        missingColumns.push("plate_number/plateNumber")
      }

      if (missingColumns.length > 0) {
        const message = `Colunas ausentes: ${missingColumns.join(", ")}. Algumas funcionalidades podem não funcionar corretamente.`
        setSchemaError(message)

        toast({
          title: "Aviso de esquema",
          description: message,
          variant: "destructive",
        })
      } else {
        // Esquema verificado com sucesso
        toast({
          title: "Esquema verificado",
          description: "A estrutura do banco de dados foi verificada com sucesso.",
        })
      }
    } catch (e) {
      console.error("Erro ao verificar esquema do banco de dados:", e)

      const errorMessage = e instanceof Error ? e.message : "Erro desconhecido"
      setSchemaError(`Erro ao verificar esquema: ${errorMessage}`)

      toast({
        title: "Erro de esquema",
        description: `Não foi possível verificar o esquema do banco de dados: ${errorMessage}`,
        variant: "destructive",
      })

      // Em caso de erro, assumimos valores padrão para evitar problemas
      setAvailableColumns({
        current_project: true,
        project_id: true,
        load_volume: true,
        loadVolume: false,
        plate_number: true,
        plateNumber: false,
      })
      setSchemaChecked(true)

      throw e
    }
  }

  async function loadTrucks() {
    try {
      setLoading(true)
      setError(null)

      // Carregar caminhões ativos e inativos
      const active = await getActiveTrucks()
      const inactive = await getInactiveTrucks()

      setActiveTrucks(active)
      setInactiveTrucks(inactive)
    } catch (e) {
      console.error("Erro ao carregar caminhões:", e)
      setError("Erro ao carregar caminhões. Verifique o console para mais detalhes.")

      toast({
        title: "Erro",
        description: "Não foi possível carregar os caminhões. Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Função para carregar projetos
  async function loadProjects() {
    try {
      const { data } = await getProjects()
      if (data) {
        // Converter para o tipo Project com as propriedades necessárias
        const projectsData = data.map(p => ({
          id: p.id,
          name: p.name,
          client: '',  // Valores padrão para as propriedades obrigatórias
          address: '',
          status: 'active' as 'active' | 'completed',
          // Outras propriedades podem ser adicionadas conforme necessário
        }));
        setProjects(projectsData)
      }
    } catch (e) {
      console.error("Erro ao carregar projetos:", e)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os projetos. Tente novamente mais tarde.",
        variant: "destructive",
      })
    }
  }

  async function handleAddTruck(newTruck: Partial<Truck>) {
    try {
      setSubmitting(true)
      const { error } = await createTruck(newTruck)
      if (error) throw error
      toast({
        title: "Sucesso",
        description: "Caminhão adicionado com sucesso!",
      })
      loadTrucks() // Recarregar a lista de caminhões
      setIsAddDialogOpen(false) // Fechar o diálogo
    } catch (e) {
      console.error("Erro ao adicionar caminhão:", e)
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o caminhão. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEditTruck(id: number, updatedTruck: Partial<Truck>) {
    try {
      setSubmitting(true)
      await updateTruckById(id, updatedTruck)
      toast({
        title: "Sucesso",
        description: "Caminhão atualizado com sucesso!",
      })
      loadTrucks() // Recarregar a lista de caminhões
      setIsEditDialogOpen(false) // Fechar o diálogo
      setSelectedTruck(null) // Limpar o caminhão selecionado
    } catch (e) {
      console.error("Erro ao atualizar caminhão:", e)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o caminhão. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-black">Caminhões</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-black text-[#F2BE13] hover:bg-black/80">Adicionar Caminhão</Button>
          </DialogTrigger>
          <DialogContent className="bg-black text-[#F2BE13]">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Caminhão</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const projectId = formData.get('projectId') ? String(formData.get('projectId')) : null;
                
                // Encontrar o projeto selecionado para obter o nome
                let currentProject = null;
                if (projectId && projectId !== "none") {
                  const selectedProject = projects.find(p => p.id.toString() === projectId);
                  currentProject = selectedProject ? selectedProject.name : null;
                }
                
                const newTruck = {
                  name: String(formData.get('truckName') || ''),
                  plate_number: String(formData.get('plateNumber') || ''),
                  load_volume: parseFloat(String(formData.get('loadVolume') || '0')),
                  project_id: projectId && projectId !== "none" ? parseInt(projectId, 10) : null,
                  current_project: currentProject,
                  truck_entry_status: 0, // Valor padrão para caminhões novos
                }
                await handleAddTruck(newTruck)
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="truckName">Nome do Caminhão</Label>
                <Input
                  id="truckName"
                  name="truckName"
                  required
                  className="bg-black/40 border-[#F2BE13]/20 text-[#F2BE13]"
                />
              </div>
              <div>
                <Label htmlFor="plateNumber">Placa</Label>
                <Input
                  id="plateNumber"
                  name="plateNumber"
                  required
                  className="bg-black/40 border-[#F2BE13]/20 text-[#F2BE13]"
                />
              </div>
              <div>
                <Label htmlFor="loadVolume">Volume de Carga (m³)</Label>
                <Input
                  id="loadVolume"
                  name="loadVolume"
                  type="number"
                  step="0.01"
                  required
                  className="bg-black/40 border-[#F2BE13]/20 text-[#F2BE13]"
                />
              </div>
              <div>
                <Label htmlFor="projectId">Projeto</Label>
                <Select name="projectId">
                  <SelectTrigger className="bg-black/40 border-[#F2BE13]/20 text-[#F2BE13]">
                    <SelectValue placeholder="Selecione um projeto" />
                  </SelectTrigger>
                  <SelectContent className="bg-black text-[#F2BE13]">
                    <SelectItem value="none">Nenhum projeto</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="bg-[#F2BE13] text-black hover:bg-[#F2BE13]/80">
                Criar Caminhão
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {schemaError && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
          <div>
            <p className="font-bold">Aviso de Esquema</p>
            <p>{schemaError}</p>
          </div>
        </div>
      )}

<h2 className="text-2xl font-semibold mt-6">Caminhões Ativos</h2>
<div className="overflow-x-auto">
  <table className="w-full table-fixed border-collapse border border-gray-300">
          <thead className="bg-gray-100">
      <tr>
        <th className="border border-gray-300 p-2 text-left">Nome</th>
        <th className="border border-gray-300 p-2 text-left">Placa</th>
        <th className="border border-gray-300 p-2 text-left">Volume Transportado</th>
        <th className="border border-gray-300 p-2 text-left">Projeto Atual</th>
              <th className="border border-gray-300 p-2 text-center">Ações</th>
      </tr>
    </thead>
    <tbody>
      {activeTrucks.map((truck) => (
        <tr key={truck.id} className="hover:bg-gray-50">
          <td className="border border-gray-300 p-2">{truck.name}</td>
          <td className="border border-gray-300 p-2">{truck.plate_number}</td>
          <td className="border border-gray-300 p-2">{truck.load_volume} m³</td>
          <td className="border border-gray-300 p-2">{truck.current_project || '-'}</td>
                <td className="border border-gray-300 p-2 space-x-2 flex justify-center">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">Ver Detalhes</Button>
                    </DialogTrigger>
                    <DialogContent className="bg-black text-[#F2BE13]">
                      <DialogHeader>
                        <DialogTitle>{truck.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-2">
                        <p><strong>Nome:</strong> {truck.name}</p>
                        <p><strong>Placa:</strong> {truck.plate_number}</p>
                        <p><strong>Volume Transportado:</strong> {truck.load_volume} m³</p>
                        <p><strong>Projeto Atual:</strong> {truck.current_project || 'Nenhum'}</p>
                        <p><strong>Status:</strong> Ativo</p>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedTruck(truck)
                      setIsEditDialogOpen(true)
                    }}
                  >
                    Editar
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setSelectedTruck(truck)
                      setIsDeleteDialogOpen(true)
                    }}
                  >
                    Excluir
                  </Button>
                </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

<h2 className="text-2xl font-semibold mt-6">Caminhões Inativos</h2>
<div className="overflow-x-auto">
  <table className="w-full table-fixed border-collapse border border-gray-300">
          <thead className="bg-gray-100">
      <tr>
        <th className="border border-gray-300 p-2 text-left">Nome</th>
        <th className="border border-gray-300 p-2 text-left">Placa</th>
        <th className="border border-gray-300 p-2 text-left">Volume Transportado</th>
        <th className="border border-gray-300 p-2 text-left">Projeto Atual</th>
              <th className="border border-gray-300 p-2 text-center">Ações</th>
      </tr>
    </thead>
    <tbody>
      {inactiveTrucks.map((truck) => (
        <tr key={truck.id} className="hover:bg-gray-50">
          <td className="border border-gray-300 p-2">{truck.name}</td>
          <td className="border border-gray-300 p-2">{truck.plate_number}</td>
          <td className="border border-gray-300 p-2">{truck.load_volume} m³</td>
          <td className="border border-gray-300 p-2">{truck.current_project || '-'}</td>
                <td className="border border-gray-300 p-2 space-x-2 flex justify-center">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">Ver Detalhes</Button>
                    </DialogTrigger>
                    <DialogContent className="bg-black text-[#F2BE13]">
                      <DialogHeader>
                        <DialogTitle>{truck.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-2">
                        <p><strong>Nome:</strong> {truck.name}</p>
                        <p><strong>Placa:</strong> {truck.plate_number}</p>
                        <p><strong>Volume Transportado:</strong> {truck.load_volume} m³</p>
                        <p><strong>Projeto Atual:</strong> {truck.current_project || 'Nenhum'}</p>
                        <p><strong>Status:</strong> Inativo</p>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedTruck(truck)
                      setIsEditDialogOpen(true)
                    }}
                  >
                    Editar
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setSelectedTruck(truck)
                      setIsDeleteDialogOpen(true)
                    }}
                  >
                    Excluir
                  </Button>
                </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

      {error && (
        <div className="bg-red-500 text-white p-4 rounded-md flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Diálogo de edição de caminhão */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-black text-[#F2BE13]">
          <DialogHeader>
            <DialogTitle>Editar Caminhão</DialogTitle>
          </DialogHeader>
          {selectedTruck && (
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const projectId = formData.get('projectId') ? String(formData.get('projectId')) : null;
                
                // Encontrar o projeto selecionado para obter o nome
                let currentProject = null;
                if (projectId && projectId !== "none") {
                  const selectedProject = projects.find(p => p.id.toString() === projectId);
                  currentProject = selectedProject ? selectedProject.name : null;
                }
                
                const updatedTruck = {
                  name: String(formData.get('truckName') || ''),
                  plate_number: String(formData.get('plateNumber') || ''),
                  load_volume: parseFloat(String(formData.get('loadVolume') || '0')),
                  project_id: projectId && projectId !== "none" ? parseInt(projectId, 10) : null,
                  current_project: currentProject,
                }
                
                await handleEditTruck(selectedTruck.id, updatedTruck)
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="truckName">Nome do Caminhão</Label>
                <Input
                  id="truckName"
                  name="truckName"
                  defaultValue={selectedTruck.name}
                  required
                  className="bg-black/40 border-[#F2BE13]/20 text-[#F2BE13]"
                />
              </div>
              <div>
                <Label htmlFor="plateNumber">Placa</Label>
                <Input
                  id="plateNumber"
                  name="plateNumber"
                  defaultValue={selectedTruck.plate_number}
                  required
                  className="bg-black/40 border-[#F2BE13]/20 text-[#F2BE13]"
                />
              </div>
              <div>
                <Label htmlFor="loadVolume">Volume de Carga (m³)</Label>
                <Input
                  id="loadVolume"
                  name="loadVolume"
                  type="number"
                  step="0.01"
                  defaultValue={selectedTruck.load_volume}
                  required
                  className="bg-black/40 border-[#F2BE13]/20 text-[#F2BE13]"
                />
              </div>
              <div>
                <Label htmlFor="projectId">Projeto</Label>
                <Select 
                  name="projectId" 
                  defaultValue={selectedTruck.project_id ? selectedTruck.project_id.toString() : "none"}
                >
                  <SelectTrigger className="bg-black/40 border-[#F2BE13]/20 text-[#F2BE13]">
                    <SelectValue placeholder="Selecione um projeto" />
                  </SelectTrigger>
                  <SelectContent className="bg-black text-[#F2BE13]">
                    <SelectItem value="none">Nenhum projeto</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  className="border-[#F2BE13]/20 text-[#F2BE13] hover:bg-black/40"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-[#F2BE13] text-black hover:bg-[#F2BE13]/80">
                  Salvar Alterações
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

