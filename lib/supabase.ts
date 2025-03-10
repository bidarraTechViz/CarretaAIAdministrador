import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ojjpgeavxxwkilnkobbp.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qanBnZWF2eHh3a2lsbmtvYmJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExMDgzNDgsImV4cCI6MjA1NjY4NDM0OH0.5gI0PHAPBVLsKtCA8-Mq9XeK2IxGxOt-I3XKV8TdPEs"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para as tabelas do banco de dados
export type Truck = {
  id: number
  name: string
  plate_number?: string // Opcional para compatibilidade
  plateNumber?: string // Opcional para compatibilidade
  operator: string
  current_project?: string | null // Opcional para compatibilidade
  project_id?: number | null // Opcional para compatibilidade
  load_volume?: number // Opcional para compatibilidade
  loadVolume?: number // Opcional para compatibilidade
  created_at?: string
  [key: string]: any // Permite propriedades adicionais para flexibilidade
}

export type Project = {
  id: number
  name: string
  client: string
  client_id?: number // Novo campo para relação com a tabela clients
  address: string
  estimated_volume?: number
  estimatedVolume?: number
  transported_volume?: number
  transportedVolume?: number
  status: "active" | "completed"
  created_at?: string
  start_time?: string // Data de início do projeto
  estimated_end_time?: string // Prazo estimado para conclusão
  end_time?: string // Data efetiva de conclusão
  [key: string]: any // Permite propriedades adicionais para flexibilidade
}

export type Trip = {
  id: number
  truck_id: number
  project_id: number
  material: string
  volume: number
  start_time: string
  end_time: string | null
  status: "ongoing" | "completed"
  photo_url?: string
  coordinates?: string
  created_at?: string
  [key: string]: any // Permite propriedades adicionais para flexibilidade
}

export type Client = {
  id: number
  name: string
  username: string
  created_at?: string
  [key: string]: any // Permite propriedades adicionais para flexibilidade
}

export interface Operator {
  id: number;
  name: string;
  login: string;
  password?: string;
  phone?: string;
  project_id?: number | null; // Será removido posteriormente quando implementarmos a relação muitos-para-muitos
  created_at: string;
  trucks?: { // Agora é um array de caminhões
    id: number;
    name: string;
  }[];
  projects?: { // Agora é um array de projetos
    id: number;
    name: string;
  }[];
}


export const getTrucks = async () => {
  return await supabase
      .from('trucks')
      .select('id, name');
};

export const getProjects = async () => {
  return await supabase
      .from('projects')
      .select('id, name');
};



