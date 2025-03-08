"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { getActiveTrucks, getInactiveTrucks } from "@/lib/db-service"
import type { Truck } from "@/lib/supabase"
import { checkTableColumns, type ColumnAvailability } from "@/lib/schema-utils"
import { AlertTriangle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

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

  useEffect(() => {
    // Verificar o esquema do banco de dados uma vez ao carregar o componente
    checkDatabaseSchema()
      .then(() => {
        loadTrucks()
      })
      .catch((err) => {
        console.error("Erro ao verificar esquema:", err)
        setSchemaError(
          "Não foi possível verificar o esquema do banco de dados. Algumas funcionalidades podem não funcionar corretamente.",
        )
        setSchemaChecked(true)
        // Tentar carregar os caminhões mesmo assim
        loadTrucks()
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

  // Resto do código permanece o mesmo...

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-black">Caminhões</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-black text-[#F2BE13] hover:bg-black/80">Adicionar Caminhão</Button>
          </DialogTrigger>
          {/* Resto do diálogo permanece o mesmo... */}
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
    <thead className="">
      <tr>
        <th className="border border-gray-300 p-2 text-left">Nome</th>
        <th className="border border-gray-300 p-2 text-left">Placa</th>
        <th className="border border-gray-300 p-2 text-left">Volume Transportado</th>
        <th className="border border-gray-300 p-2 text-left">Projeto Atual</th>
      </tr>
    </thead>
    <tbody>
      {activeTrucks.map((truck) => (
        <tr key={truck.id} className="hover:bg-gray-50">
          <td className="border border-gray-300 p-2">{truck.name}</td>
          <td className="border border-gray-300 p-2">{truck.plate_number}</td>
          <td className="border border-gray-300 p-2">{truck.load_volume} m³</td>
          <td className="border border-gray-300 p-2">{truck.current_project || '-'}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

<h2 className="text-2xl font-semibold mt-6">Caminhões Inativos</h2>
<div className="overflow-x-auto">
  <table className="w-full table-fixed border-collapse border border-gray-300">
    <thead className="bg-black-100">
      <tr>
        <th className="border border-gray-300 p-2 text-left">Nome</th>
        <th className="border border-gray-300 p-2 text-left">Placa</th>
        <th className="border border-gray-300 p-2 text-left">Volume Transportado</th>
        <th className="border border-gray-300 p-2 text-left">Projeto Atual</th>
      </tr>
    </thead>
    <tbody>
      {inactiveTrucks.map((truck) => (
        <tr key={truck.id} className="hover:bg-gray-50">
          <td className="border border-gray-300 p-2">{truck.name}</td>
          <td className="border border-gray-300 p-2">{truck.plate_number}</td>
          <td className="border border-gray-300 p-2">{truck.load_volume} m³</td>
          <td className="border border-gray-300 p-2">{truck.current_project || '-'}</td>
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

      {/* Resto do componente permanece o mesmo... */}
    </div>
  )
}

