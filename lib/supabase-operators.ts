import { supabase } from './supabase';  
import { Operator } from './supabase';
import { cacheManager } from './cache';

// Constante para configuração do cache
const CACHE_DURATION = 60 * 1000; // 1 minuto

export const getOperators = async (): Promise<{ data: Operator[] | null; error: any }> => {
  // Verificar cache primeiro
  const cacheKey = 'operators_list';
  const cachedData = cacheManager.get<Operator[]>(cacheKey, CACHE_DURATION);
  
  if (cachedData) {
    console.log('Usando dados de operadores do cache');
    return { data: cachedData, error: null };
  }
  
  try {
    console.log('Buscando operadores do banco de dados');
    
    // Primeiro, buscar todos os operadores
    const { data: operatorsData, error: operatorsError } = await supabase
      .from('operators')
      .select('*');
    
    if (operatorsError) throw operatorsError;
    
    // Agora, para cada operador, buscar seus caminhões e projetos
    const operatorsWithRelations = await Promise.all(operatorsData.map(async (operator) => {
      // Definir interfaces para os tipos de retorno do Supabase
      interface TruckJoin {
        trucks: {
          id: number;
          name: string;
        };
      }
      
      interface ProjectJoin {
        projects: {
          id: number;
          name: string;
        };
      }

      // Buscar caminhões vinculados ao operador
      const { data: trucksData } = await supabase
        .from('operator_trucks')
        .select('truck_id, trucks(id, name)')
        .eq('operator_id', operator.id);
      
      // Buscar projetos vinculados ao operador
      const { data: projectsData } = await supabase
        .from('operator_projects')
        .select('project_id, projects(id, name)')
        .eq('operator_id', operator.id);
      
      // Formatar os dados com tipagem explícita
      const trucks = trucksData 
        ? (trucksData as unknown as TruckJoin[])
            .filter(item => item.trucks)
            .map(item => ({
              id: item.trucks.id,
              name: item.trucks.name
            }))
        : [];
      
      const projects = projectsData 
        ? (projectsData as unknown as ProjectJoin[])
            .filter(item => item.projects)
            .map(item => ({
              id: item.projects.id,
              name: item.projects.name
            }))
        : [];
      
      return {
        ...operator,
        trucks,
        projects
      };
    }));
    
    // Armazenar no cache
    cacheManager.set(cacheKey, operatorsWithRelations);
    
    return { data: operatorsWithRelations, error: null };
  } catch (error) {
    console.error("Erro ao buscar operadores:", error);
    return { data: null, error };
  }
};

export const checkLoginExists = async (login: string) => {
  const { data } = await supabase
    .from('operators')
    .select('id')
    .eq('login', login)
    .maybeSingle();

  return !!data;
};

export const createOperator = async (operator: any) => {
  try {
    // Recebe só o objeto e faz insert
    const { data, error } = await supabase
      .from('operators')
      .insert([operator])
      .select(); // Adicionar select para retornar os dados inseridos
    
    // Invalidar o cache após criar um operador
    cacheManager.invalidate('operators_list');
    
    console.log('Operador criado:', data);
    return { data, error };
  } catch (e) {
    console.error('Erro ao criar operador:', e);
    return { data: null, error: e };
  }
};

export const updateOperator = async (id: number, operator: any) => {
  try {
    // Recebe id e objeto
    const { data, error } = await supabase
      .from('operators')
      .update(operator)
      .eq('id', id)
      .select(); // Adicionar select para retornar os dados atualizados
    
    // Invalidar o cache após atualizar um operador
    cacheManager.invalidate('operators_list');
    
    console.log('Operador atualizado:', data);
    return { data, error };
  } catch (e) {
    console.error('Erro ao atualizar operador:', e);
    return { data: null, error: e };
  }
};

export const deleteOperator = async (id: number) => {
  try {
    const { data, error } = await supabase
      .from('operators')
      .delete()
      .eq('id', id)
      .select();
    
    // Invalidar o cache após excluir um operador
    cacheManager.invalidate('operators_list');
    
    return { data, error };
  } catch (e) {
    console.error('Erro ao excluir operador:', e);
    return { data: null, error: e };
  }
};

// Função para atualizar os caminhões vinculados a um operador
export const updateOperatorTrucks = async (operatorId: number, truckIds: number[]) => {
  try {
    // Primeiro, remover todas as vinculações existentes
    const { error: deleteError } = await supabase
      .from('operator_trucks')
      .delete()
      .eq('operator_id', operatorId);
    
    if (deleteError) throw deleteError;
    
    // Se não houver caminhões para vincular, retornar
    if (!truckIds.length) {
      return { data: [], error: null };
    }
    
    // Criar as novas vinculações
    const truckRelations = truckIds.map(truckId => ({
      operator_id: operatorId,
      truck_id: truckId
    }));
    
    const { data, error } = await supabase
      .from('operator_trucks')
      .insert(truckRelations)
      .select();
    
    // Invalidar o cache após atualizar as relações
    cacheManager.invalidate('operators_list');
    
    return { data, error };
  } catch (error) {
    console.error('Erro ao atualizar caminhões do operador:', error);
    return { data: null, error };
  }
};

// Função para atualizar os projetos vinculados a um operador
export const updateOperatorProjects = async (operatorId: number, projectIds: number[]) => {
  try {
    // Primeiro, remover todas as vinculações existentes
    const { error: deleteError } = await supabase
      .from('operator_projects')
      .delete()
      .eq('operator_id', operatorId);
    
    if (deleteError) throw deleteError;
    
    // Se não houver projetos para vincular, retornar
    if (!projectIds.length) {
      return { data: [], error: null };
    }
    
    // Criar as novas vinculações
    const projectRelations = projectIds.map(projectId => ({
      operator_id: operatorId,
      project_id: projectId
    }));
    
    const { data, error } = await supabase
      .from('operator_projects')
      .insert(projectRelations)
      .select();
    
    // Invalidar o cache após atualizar as relações
    cacheManager.invalidate('operators_list');
    
    return { data, error };
  } catch (error) {
    console.error('Erro ao atualizar projetos do operador:', error);
    return { data: null, error };
  }
};
