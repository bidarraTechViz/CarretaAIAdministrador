import { supabase } from "./supabase"

// Interface para armazenar informações sobre colunas disponíveis
export interface ColumnAvailability {
  current_project: boolean
  project_id: boolean
  load_volume: boolean
  loadVolume: boolean
  plate_number: boolean
  plateNumber: boolean
}

// Função alternativa para verificar colunas sem usar information_schema
export async function checkTableColumnsFallback(tableName: string): Promise<ColumnAvailability> {
  try {
    // Buscar um registro da tabela para examinar suas propriedades
    const { data, error } = await supabase.from(tableName).select("*").limit(1)

    if (error) {
      console.error(`Erro ao buscar registro de ${tableName}:`, error)
      throw error
    }

    // Se não houver registros, tentar inserir um temporário
    if (!data || data.length === 0) {
      // Para trucks, tentar inserir um registro temporário
      if (tableName === "trucks") {
        const tempTruck = {
          name: "TEMP_CHECK_COLUMNS",
          operator: "TEMP_OPERATOR",
        }

        const { data: insertData, error: insertError } = await supabase.from("trucks").insert([tempTruck]).select()

        if (insertError) {
          console.error("Erro ao inserir registro temporário:", insertError)
          // Assumir valores padrão em caso de erro
          return getDefaultColumnAvailability()
        }

        // Se inseriu com sucesso, usar esse registro para verificar colunas
        if (insertData && insertData.length > 0) {
          const columnNames = Object.keys(insertData[0]).map((key) => key.toLowerCase())

          // Excluir o registro temporário
          await supabase.from("trucks").delete().eq("name", "TEMP_CHECK_COLUMNS")

          return {
            current_project: columnNames.includes("current_project"),
            project_id: columnNames.includes("project_id"),
            load_volume: columnNames.includes("load_volume"),
            loadVolume: columnNames.includes("loadvolume"),
            plate_number: columnNames.includes("plate_number"),
            plateNumber: columnNames.includes("platenumber"),
          }
        }
      }

      // Se não conseguiu inserir ou não é a tabela trucks, usar valores padrão
      return getDefaultColumnAvailability()
    }

    // Usar o primeiro registro para verificar as colunas
    const columnNames = Object.keys(data[0]).map((key) => key.toLowerCase())

    return {
      current_project: columnNames.includes("current_project"),
      project_id: columnNames.includes("project_id"),
      load_volume: columnNames.includes("load_volume"),
      loadVolume: columnNames.includes("loadvolume"),
      plate_number: columnNames.includes("plate_number"),
      plateNumber: columnNames.includes("platenumber"),
    }
  } catch (e) {
    console.error(`Erro ao verificar colunas da tabela ${tableName} (fallback):`, e)
    return getDefaultColumnAvailability()
  }
}

// Função para obter valores padrão de disponibilidade de colunas
function getDefaultColumnAvailability(): ColumnAvailability {
  return {
    current_project: true,
    project_id: true,
    load_volume: true,
    loadVolume: false,
    plate_number: true,
    plateNumber: false,
  }
}

