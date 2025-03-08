import { supabase } from "./supabase"
import { checkTableColumnsFallback } from "./schema-utils-fallback"

// Interface para armazenar informações sobre colunas disponíveis
export interface ColumnAvailability {
  current_project: boolean
  project_id: boolean
  load_volume: boolean
  loadVolume: boolean
  plate_number: boolean
  plateNumber: boolean
}

// Função para verificar quais colunas existem na tabela
export async function checkTableColumns(tableName: string): Promise<ColumnAvailability> {
  try {
    // Tentar usar a função RPC para acessar information_schema
    const { data, error } = await supabase.rpc("execute_sql", {
      sql_query: `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '${tableName}'
        AND table_schema = 'public'
      `,
    })

    if (error) {
      console.error(`Erro ao verificar colunas da tabela ${tableName} usando RPC:`, error)
      console.log("Tentando abordagem alternativa...")

      // Se a função RPC falhar, usar a abordagem alternativa
      return await checkTableColumnsFallback(tableName)
    }

    // Se a consulta RPC for bem-sucedida, processamos os resultados
    const columnNames =
      data?.map((col: string | { column_name?: string }) =>
        typeof col === "string" ? col.toLowerCase() : col.column_name ? col.column_name.toLowerCase() : "",
      ) || []

    return {
      current_project: columnNames.includes("current_project"),
      project_id: columnNames.includes("project_id"),
      load_volume: columnNames.includes("load_volume"),
      loadVolume: columnNames.includes("loadvolume"),
      plate_number: columnNames.includes("plate_number"),
      plateNumber: columnNames.includes("platenumber"),
    }
  } catch (e) {
    console.error(`Erro ao verificar colunas da tabela ${tableName}:`, e)
    console.log("Tentando abordagem alternativa após exceção...")

    // Em caso de exceção, tentar a abordagem alternativa
    return await checkTableColumnsFallback(tableName)
  }
}

// Função para executar o script SQL de correção do esquema
export async function fixDatabaseSchema() {
  try {
    // Verificar a estrutura atual da tabela trucks usando a abordagem alternativa
    const columns = await checkTableColumnsFallback("trucks")

    // Usar consultas diretas para adicionar colunas ausentes
    if (!columns.current_project) {
      const { error } = await supabase.from("trucks").update({ current_project: null }).eq("id", -1)
      if (error && error.message.includes('column "current_project" of relation "trucks" does not exist')) {
        // A coluna não existe, tentar criá-la com uma consulta SQL
        await executeSqlSafely(`ALTER TABLE trucks ADD COLUMN current_project TEXT;`)
      }
    }

    if (!columns.project_id) {
      const { error } = await supabase.from("trucks").update({ project_id: null }).eq("id", -1)
      if (error && error.message.includes('column "project_id" of relation "trucks" does not exist')) {
        // A coluna não existe, tentar criá-la com uma consulta SQL
        await executeSqlSafely(`ALTER TABLE trucks ADD COLUMN project_id INTEGER;`)
      }
    }

    if (!columns.load_volume && !columns.loadVolume) {
      const { error } = await supabase.from("trucks").update({ load_volume: null }).eq("id", -1)
      if (error && error.message.includes('column "load_volume" of relation "trucks" does not exist')) {
        // A coluna não existe, tentar criá-la com uma consulta SQL
        await executeSqlSafely(`ALTER TABLE trucks ADD COLUMN load_volume INTEGER;`)
      }
    } else if (!columns.load_volume && columns.loadVolume) {
      // Tentar renomear a coluna loadVolume para load_volume
      await executeSqlSafely(`ALTER TABLE trucks RENAME COLUMN loadvolume TO load_volume;`)
    }

    return true
  } catch (e) {
    console.error("Erro ao corrigir esquema do banco de dados:", e)
    return false
  }
}

// Função auxiliar para executar SQL com segurança
async function executeSqlSafely(sqlQuery: string): Promise<boolean> {
  try {
    // Tentar usar a função RPC
    const { error } = await supabase.rpc("execute_sql", { sql_query: sqlQuery })

    if (error) {
      console.error(`Erro ao executar SQL via RPC: ${sqlQuery}`, error)
      return false
    }

    return true
  } catch (e) {
    console.error(`Erro ao executar SQL: ${sqlQuery}`, e)
    return false
  }
}

