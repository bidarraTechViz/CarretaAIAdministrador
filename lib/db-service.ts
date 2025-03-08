import { supabase, type Truck, type Project, type Client } from "./supabase"
import { checkTableColumns } from "./schema-utils"

// Cache para armazenar informações sobre colunas disponíveis
let columnsCache: any = null

// Função para obter informações sobre colunas disponíveis
async function getAvailableColumns() {
  if (!columnsCache) {
    columnsCache = await checkTableColumns("trucks")
  }
  return columnsCache
}

// Função para adaptar o objeto de caminhão ao esquema disponível
async function adaptTruckToSchema(truck: Partial<Truck>): Promise<Partial<Truck>> {
  const columns = await getAvailableColumns()
  const adaptedTruck: Partial<Truck> = { ...truck }

  // Adaptar load_volume / loadVolume
  if (truck.load_volume !== undefined) {
    if (columns.load_volume) {
      adaptedTruck.load_volume = truck.load_volume
    } else if (columns.loadVolume) {
      adaptedTruck.loadVolume = truck.load_volume
      delete adaptedTruck.load_volume
    } else {
      // Se nenhuma das colunas existir, remover a propriedade
      delete adaptedTruck.load_volume
    }
  }

  // Adaptar current_project / project_id
  if (truck.current_project !== undefined) {
    if (columns.current_project) {
      adaptedTruck.current_project = truck.current_project
    } else {
      delete adaptedTruck.current_project
    }

    // Tentar converter para project_id se possível
    if (columns.project_id && truck.current_project) {
      const projectId = Number.parseInt(truck.current_project as string)
      if (!isNaN(projectId)) {
        adaptedTruck.project_id = projectId
      }
    }
  }

  // Adaptar plate_number / plateNumber
  if (truck.plate_number !== undefined) {
    if (columns.plate_number) {
      adaptedTruck.plate_number = truck.plate_number
    } else if (columns.plateNumber) {
      adaptedTruck.plateNumber = truck.plate_number
      delete adaptedTruck.plate_number
    }
  }

  return adaptedTruck
}

// Funções para caminhões
export async function getTrucks() {
  const { data, error } = await supabase.from("trucks").select("*").order("name")

  if (error) throw error
  return data as Truck[]
}

export async function getActiveTrucks() {
  try {
    const columns = await getAvailableColumns()

    // Primeiro, tentamos com current_project
    if (columns.current_project) {
      try {
        const { data, error } = await supabase
          .from("trucks")
          .select("*")
          .not("current_project", "is", null)
        if (!error && data && data.length > 0) {
          console.warn("Caminhões ativos encontrados:", data)
          return data as Truck[]
        }
      } catch (e) {
        console.warn("Erro ao buscar caminhões ativos usando current_project:", e)
      }
    }

    // Se falhar, tentamos com project_id
    if (columns.project_id) {
      try {
        const { data, error } = await supabase.from("trucks").select("*").not("project_id", "is", null).order("name")

        if (!error && data && data.length > 0) {
          return data as Truck[]
        }
      } catch (e) {
        console.warn("Erro ao buscar caminhões ativos usando project_id:", e)
      }
    }

    // Se ambas as abordagens falharem, retornamos todos os caminhões como fallback
    console.warn("Não foi possível determinar caminhões ativos por coluna. Retornando todos os caminhões.")
    return getTrucks()
  } catch (error) {
    console.error("Erro ao buscar caminhões ativos:", error)
    // Em caso de erro, retornamos uma lista vazia
    return []
  }
}

export async function getInactiveTrucks() {
  try {
    const columns = await getAvailableColumns()

    // Primeiro, tentamos com current_project
    if (columns.current_project) {
      try {
        const { data, error } = await supabase.from("trucks").select("*").is("current_project", null).order("name")

        if (!error && data && data.length > 0) {
          return data as Truck[]
        }
      } catch (e) {
        console.warn("Erro ao buscar caminhões inativos usando current_project:", e)
      }
    }

    // Se falhar, tentamos com project_id
    if (columns.project_id) {
      try {
        const { data, error } = await supabase.from("trucks").select("*").is("project_id", null).order("name")

        if (!error && data && data.length > 0) {
          return data as Truck[]
        }
      } catch (e) {
        console.warn("Erro ao buscar caminhões inativos usando project_id:", e)
      }
    }

    // Se ambas as abordagens falharem, retornamos uma lista vazia
    console.warn("Não foi possível determinar caminhões inativos por coluna. Retornando lista vazia.")
    return []
  } catch (error) {
    console.error("Erro ao buscar caminhões inativos:", error)
    // Em caso de erro, retornamos uma lista vazia
    return []
  }
}

export async function createTruck(newTruck: Partial<Truck>) {
  try {
    // Adaptar o objeto de caminhão ao esquema disponível
    const adaptedTruck = await adaptTruckToSchema(newTruck)

    const { data, error } = await supabase.from("trucks").insert([adaptedTruck]).select()

    if (error) throw error
    return data[0] as Truck
  } catch (error) {
    console.error("Erro ao criar caminhão:", error)
    throw error
  }
}

export async function updateTruckById(id: number, updatedTruck: Partial<Truck>) {
  try {
    // Adaptar o objeto de caminhão ao esquema disponível
    const adaptedTruck = await adaptTruckToSchema(updatedTruck)

    const { data, error } = await supabase.from("trucks").update(adaptedTruck).eq("id", id).select()

    if (error) throw error
    return data[0] as Truck
  } catch (error) {
    console.error("Erro ao atualizar caminhão:", error)
    throw error
  }
}

export async function deleteTruckById(id: number) {
  const { data, error } = await supabase.from("trucks").delete().eq("id", id).select()

  if (error) throw error
  return data[0] as Truck
}

// Funções para projetos
export async function getActiveProjects() {
  const { data, error } = await supabase.from("projects").select("*").eq("status", "active")
  if (error) throw error
  return data as Project[]
}

export async function getCompletedProjects() {
  const { data, error } = await supabase.from("projects").select("*").eq("status", "completed")
  if (error) throw error
  return data as Project[]
}

// Funções para clientes
export async function getClients() {
  const { data, error } = await supabase.from("clients").select("*")
  if (error) throw error
  return data as Client[]
}

export async function getClientsWithProjects() {
  const { data, error } = await supabase.from("clients").select(`*, projects(*)`).order("name")

  if (error) throw error
  return data as Client[]
}

// Funções para viagens (inferidas a partir do uso em app/dashboard/page.tsx)
export async function getDailyVolume(days = 7) {
  try {
    // Primeiro, tente usar a função RPC
    const { data, error } = await supabase.rpc("get_daily_volume", { days_count: days })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Erro ao chamar get_daily_volume RPC:", error)

    // Fallback: buscar dados diretamente se a função RPC falhar
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - (days - 1))

      // Gerar array de datas
      const dateArray = []
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate)
        date.setDate(startDate.getDate() + i)
        dateArray.push(date.toISOString().split("T")[0])
      }

      // Buscar viagens completadas
      const { data: tripsData, error: tripsError } = await supabase
        .from("trips")
        .select("volume, end_time")
        .eq("status", "completed")
        .gte("end_time", startDate.toISOString())
        .lte("end_time", endDate.toISOString())

      if (tripsError) throw tripsError

      // Agrupar por data e somar volumes
      const volumeByDate = {}
      dateArray.forEach((date) => {
        volumeByDate[date] = 0
      })

      if (tripsData) {
        tripsData.forEach((trip) => {
          if (trip.end_time) {
            const tripDate = new Date(trip.end_time).toISOString().split("T")[0]
            if (volumeByDate[tripDate] !== undefined) {
              volumeByDate[tripDate] += trip.volume
            }
          }
        })
      }

      // Formatar resultado
      return Object.entries(volumeByDate).map(([date, total_volume]) => ({
        date,
        total_volume,
      }))
    } catch (fallbackError) {
      console.error("Erro no fallback para getDailyVolume:", fallbackError)
      // Retornar dados fictícios em caso de erro
      const result = []
      const today = new Date()
      for (let i = 0; i < days; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() - i)
        result.push({
          date: date.toISOString().split("T")[0],
          total_volume: 0,
        })
      }
      return result.reverse()
    }
  }
}

export async function getOngoingTrips() {
  try {
    const { data, error } = await supabase
      .from("trips")
      .select(`
        *,
        trucks(name),
        projects(name)
      `)
      .eq("status", "ongoing")
      .order("start_time", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Erro ao buscar viagens em andamento:", error)
    return []
  }
}

export async function getTripHistory(limit = 10) {
  try {
    // Calcular a data de início (dias atrás) em JavaScript
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - limit)

    // Formatar a data no formato ISO que o Supabase aceita
    const startDateISO = startDate.toISOString()

    const { data, error } = await supabase
      .from("trips")
      .select(`
        *,
        trucks(name),
        projects(name)
      `)
      .eq("status", "completed")
      .gte("end_time", startDateISO) // Usar a data calculada em JavaScript
      .order("end_time", { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Erro ao buscar histórico de viagens:", error)
    return []
  }
}

