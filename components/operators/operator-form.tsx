'use client';

import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getTrucks, getProjects } from '@/lib/supabase';
import { checkLoginExists, createOperator, updateOperator } from '@/lib/supabase-operators';
import { Operator } from '@/lib/supabase';
import { toast } from 'sonner';

interface OperatorFormProps {
  operator: Operator;
  isCreating: boolean;
  onClose: () => void;
}

export const OperatorForm = ({ operator, isCreating, onClose }: OperatorFormProps) => {
  const [form, setForm] = useState({
    ...operator,
    password: '',
    truck_id: operator.truck_id ? String(operator.truck_id) : '',
    project_id: operator.project_id ? String(operator.project_id) : '',
  });

  const [trucks, setTrucks] = useState<{ id: number; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: trucks } = await getTrucks();
    const { data: projects } = await getProjects();
    setTrucks(trucks || []);
    setProjects(projects || []);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.login) {
      toast.error('Nome e Login são obrigatórios');
      return;
    }

    if (isCreating && (await checkLoginExists(form.login))) {
      toast.error('Esse login já existe');
      return;
    }

    if (isCreating && !form.password) {
      toast.error('Senha é obrigatória para novo operador');
      return;
    }

    type OperatorPayload = {
      name: string;
      login: string;
      phone: string | null;
      truck_id: number | null;
      project_id: number | null;
      password?: string;
    };

    const payload: OperatorPayload = {
      name: form.name,
      login: form.login,
      phone: form.phone || null,
      truck_id: form.truck_id ? Number(form.truck_id) : null,
      project_id: form.project_id ? Number(form.project_id) : null,
    };

    if (isCreating) {
      payload.password = form.password;
    }

    console.log('Enviando para Supabase:', payload);

    let error;
    if (isCreating) {
      // createOperator espera só o objeto
      const result = await createOperator(payload);
      error = result.error;
    } else {
      // updateOperator espera (id, objeto)
      const result = await updateOperator(form.id, payload);
      error = result.error;
    }

    if (error) {
      console.error('Erro Supabase:', error);
      toast.error(`Erro ao salvar operador: ${error.message}`);
    } else {
      toast.success('Operador salvo com sucesso');
      onClose();
    }
  };

  return (
    <div className="space-y-4">
      <Input label="Nome" name="name" value={form.name} onChange={handleChange} />
      <Input label="Login" name="login" value={form.login} onChange={handleChange} disabled={!isCreating} />
      {isCreating && (
        <Input label="Senha" type="password" name="password" value={form.password} onChange={handleChange} />
      )}
      <Input label="Telefone" name="phone" value={form.phone || ''} onChange={handleChange} />

      <div>
        <label className="block text-sm font-medium">Caminhão Vinculado</label>
        <select
          name="truck_id"
          value={form.truck_id || ''}
          onChange={handleChange}
          className="border rounded w-full p-2"
        >
          <option value="">Sem caminhão vinculado</option>
          {trucks.map((truck) => (
            <option key={truck.id} value={truck.id}>
              {truck.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Projeto Vinculado</label>
        <select
          name="project_id"
          value={form.project_id || ''}
          onChange={handleChange}
          className="border rounded w-full p-2"
        >
          <option value="">Sem projeto vinculado</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end space-x-2">
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit}>Salvar</Button>
      </div>
    </div>
  );
};
