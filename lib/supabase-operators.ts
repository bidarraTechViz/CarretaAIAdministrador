import { supabase } from './supabase';  
import { Operator } from './supabase';

export const getOperators = async (): Promise<{ data: Operator[] | null; error: any }> => {
    const { data, error } = await supabase.rpc('get_operators_joined');
    return { data, error };
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
  // Recebe só o objeto e faz insert
  return await supabase
    .from('operators')
    .insert([operator]);
};

export const updateOperator = async (id: number, operator: any) => {
  // Recebe id e objeto
  return await supabase
    .from('operators')
    .update(operator)
    .eq('id', id);
};

export const deleteOperator = async (id: number) => {
  return await supabase
    .from('operators')
    .delete()
    .eq('id', id);
};
