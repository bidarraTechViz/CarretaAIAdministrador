import { supabase, type Truck, type Project, type Client } from "./supabase"
import { checkTableColumns } from "./schema-utils"
import { cacheManager } from "@/lib/cache"

// Cache para armazenar informações sobre colunas disponíveis
let columnsCache: any = null
export interface DailyVolume {
  date: string;
  total_volume: number;
}


export const CACHE_CONFIG = {
  DAILY: 5 * 60 * 1000, // 5 minutos
  HOURLY: 60 * 60 * 1000, // 1 hora
  REALTIME: 30 * 1000, // 30 segundos
  ONGOING_TRIPS: 240 * 1000, // 4 minutos
  HISTORY: 2 * 60 * 1000,   // 2 minutos
  AVERAGE: 10 * 60 * 1000,   // 10 minutos
  COMPLETED_TRIPS: 10 * 60 * 1000, // 10 minutos
};


async function withCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  expirationMs: number = CACHE_CONFIG.DAILY // Valor padrão se não for informado
): Promise<T> {
  const cachedData = cacheManager.get<T>(key, expirationMs);
  if (cachedData) {
    return cachedData;
  }

  const data = await fetchFn();
  cacheManager.set(key, data);
  return data;
}

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
export async function getDailyVolume(days: number = 7): Promise<DailyVolume[]> {
  return withCache(
    `daily_volume_${days}`,
    async () => {
      try {
        // Primeiro, tente usar a função RPC
        const { data, error } = await supabase.rpc("get_daily_volumes", { days_count: days });

        if (error) throw error;
        return (data || []) as DailyVolume[];
      } catch (error) {
        console.error("Erro ao chamar get_daily_volume RPC:", error);

        // Fallback: buscar dados diretamente se a função RPC falhar
        try {
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - (days - 1));

          // Gerar array de datas
          const dateArray: string[] = [];
          for (let i = 0; i < days; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            dateArray.push(date.toISOString().split("T")[0]);
          }

          // Buscar viagens completadas
          const { data: tripsData, error: tripsError } = await supabase
            .from("trips")
            .select("volume, end_time")
            .eq("status", "completed")
            .gte("end_time", startDate.toISOString())
            .lte("end_time", endDate.toISOString());

          if (tripsError) throw tripsError;

          // Agrupar por data e somar volumes
          const volumeByDate: { [key: string]: number } = {};
          dateArray.forEach((date) => {
            volumeByDate[date] = 0;
          });

          if (tripsData) {
            tripsData.forEach((trip: { volume: number; end_time: string }) => {
              if (trip.end_time) {
                const tripDate = new Date(trip.end_time).toISOString().split("T")[0];
                if (volumeByDate[tripDate] !== undefined) {
                  volumeByDate[tripDate] += trip.volume;
                }
              }
            });
          }

          // Formatar resultado
          return Object.entries(volumeByDate).map(([date, total_volume]) => ({
            date,
            total_volume,
          })) as DailyVolume[];
        } catch (fallbackError) {
          console.error("Erro no fallback para getDailyVolume:", fallbackError);
          // Retornar dados fictícios em caso de erro
          const result: DailyVolume[] = [];
          const today = new Date();
          for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            result.push({
              date: date.toISOString().split("T")[0],
              total_volume: 0,
            });
          }
          return result.reverse();
        }
      }
    },
    CACHE_CONFIG.DAILY // Usa 5 minutos como padrão para dados diários
  );
}


export async function getAverageTripTime(days = 7) {
  return withCache<number>(
    `averageTripTime_${days}`,
    async () => {
      try {
        // Calcular data inicial (7 dias atrás por padrão)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        // Buscar viagens completadas no período
        const { data, error } = await supabase
          .from("trips")
          .select("start_time, end_time")
          .eq("status", "completed")
          .gte("end_time", startDate.toISOString());
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
          return 0; // Sem viagens no período
        }
        
        // Calcular duração de cada viagem em minutos
        const durations = data.map(trip => {
          const start = new Date(trip.start_time);
          const end = new Date(trip.end_time);
          return (end.getTime() - start.getTime()) / (1000 * 60); // Conversão para minutos
        });
        
        // Calcular média
        const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);
        const averageMinutes = Math.round(totalDuration / durations.length);
        
        return averageMinutes;
      } catch (error) {
        console.error("Erro ao calcular tempo médio de viagem:", error);
        return 45; // Valor fallback em caso de erro
      }
    },
    CACHE_CONFIG.AVERAGE
  );
}

export async function getOngoingTrips() {
  return withCache<any[]>(
    'ongoing_trips',
    async () => {
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
    },
    CACHE_CONFIG.ONGOING_TRIPS
  );
}

export async function getCompletedTrips() {
  return withCache<any[]>(
    'completed_trips',
    async () => {
      try {
        const { data, error } = await supabase
          .from("trips")
          .select(`*`)
          .eq("status", "completed")
          .order("end_time", { ascending: false })
        if (error) throw error
        return data || []
      } catch (error) {
        console.error("Erro ao buscar viagens concluídas:", error)
        return []
      }
    },
    CACHE_CONFIG.COMPLETED_TRIPS
  );
}


export async function getTripHistory(limit = 10) {
  return withCache<any[]>(
    `trip_history_${limit}`,
    async () => {
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
    },
    CACHE_CONFIG.HISTORY
  );
}

// Função para atualizar o esquema da tabela projects
export async function updateProjectsSchema() {
  try {
    // Verificar se as colunas já existem antes de tentar criá-las
    const { data, error } = await supabase.rpc("execute_sql", {
      sql_query: `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'projects'
        AND table_schema = 'public'
      `,
    }); 

    if (error) throw error;

    const columnNames = data?.map((col: any) => 
      typeof col === "string" ? col.toLowerCase() : col.column_name ? col.column_name.toLowerCase() : ""
    ) || [];

    const columnsToAdd = [];
    
    if (!columnNames.includes("start_time")) {
      columnsToAdd.push("ADD COLUMN start_time TIMESTAMP WITH TIME ZONE");
    }
    
    if (!columnNames.includes("estimated_end_time")) {
      columnsToAdd.push("ADD COLUMN estimated_end_time TIMESTAMP WITH TIME ZONE");
    }
    
    if (!columnNames.includes("end_time")) {
      columnsToAdd.push("ADD COLUMN end_time TIMESTAMP WITH TIME ZONE");
    }

    if (columnsToAdd.length > 0) {
      // Executar a alteração da tabela
      const alterTableQuery = `ALTER TABLE projects ${columnsToAdd.join(", ")};`;
      
      const { error: alterError } = await supabase.rpc("execute_sql", {
        sql_query: alterTableQuery,
      });

      if (alterError) throw alterError;
      
      console.log("Esquema da tabela projects atualizado com sucesso");
      return { success: true, message: "Esquema atualizado com sucesso" };
    } else {
      console.log("Esquema da tabela projects já está atualizado");
      return { success: true, message: "Esquema já está atualizado" };
    }
  } catch (error) {
    console.error("Erro ao atualizar esquema da tabela projects:", error);
    return { success: false, message: "Erro ao atualizar esquema", error };
  }
}

