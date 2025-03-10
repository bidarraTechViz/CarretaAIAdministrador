'use client';

import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getTrucks, getProjects } from '@/lib/supabase';
import { checkLoginExists, createOperator, updateOperator, updateOperatorTrucks, updateOperatorProjects } from '@/lib/supabase-operators';
import { Operator } from '@/lib/supabase';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface OperatorFormProps {
  operator: Operator;
  isCreating: boolean;
  onClose: () => void;
}

export const OperatorForm = ({ operator, isCreating, onClose }: OperatorFormProps) => {
  const [form, setForm] = useState({
    ...operator,
    password: '',
    project_id: operator.project_id ? String(operator.project_id) : '',
  });

  // Estado para armazenar os caminhões e projetos selecionados
  const [selectedTrucks, setSelectedTrucks] = useState<number[]>(
    operator.trucks?.map(truck => truck.id) || []
  );
  const [selectedProjects, setSelectedProjects] = useState<number[]>(
    operator.projects?.map(project => project.id) || []
  );

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

  const handleTruckToggle = (truckId: number) => {
    setSelectedTrucks(prev => 
      prev.includes(truckId)
        ? prev.filter(id => id !== truckId)
        : [...prev, truckId]
    );
  };

  const handleProjectToggle = (projectId: number) => {
    setSelectedProjects(prev => 
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
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
      project_id: number | null; // Mantido temporariamente
      password?: string;
    };

    const payload: OperatorPayload = {
      name: form.name,
      login: form.login,
      phone: form.phone || null,
      project_id: form.project_id ? Number(form.project_id) : null,
    };

    if (isCreating) {
      payload.password = form.password;
    }

    console.log('Enviando para Supabase:', payload);
    console.log('Caminhões selecionados:', selectedTrucks);
    console.log('Projetos selecionados:', selectedProjects);

    try {
      let error;
      let operatorId: number;
      
      if (isCreating) {
        // Criar operador
        const result = await createOperator(payload);
        error = result.error;
        operatorId = result.data?.[0]?.id;
      } else {
        // Atualizar operador
        const result = await updateOperator(form.id, payload);
        error = result.error;
        operatorId = form.id;
      }

      if (error) {
        console.error('Erro Supabase:', error);
        const errorMessage = typeof error === 'object' && error !== null && 'message' in error 
          ? error.message 
          : JSON.stringify(error);
        toast.error(`Erro ao salvar operador: ${errorMessage}`);
      } else {
        // Atualizar relações muitos-para-muitos
        if (operatorId) {
          // Atualizar caminhões vinculados
          const trucksResult = await updateOperatorTrucks(operatorId, selectedTrucks);
          if (trucksResult.error) {
            console.error('Erro ao atualizar caminhões:', trucksResult.error);
            toast.error('Erro ao vincular caminhões. Verifique o console para mais detalhes.');
          }
          
          // Atualizar projetos vinculados
          const projectsResult = await updateOperatorProjects(operatorId, selectedProjects);
          if (projectsResult.error) {
            console.error('Erro ao atualizar projetos:', projectsResult.error);
            toast.error('Erro ao vincular projetos. Verifique o console para mais detalhes.');
          }
        }
        
        toast.success('Operador salvo com sucesso');
        // Garantir que o modal seja fechado
        onClose();
      }
    } catch (e) {
      console.error('Erro ao salvar operador:', e);
      toast.error('Erro ao salvar operador. Tente novamente.');
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

      <div className="space-y-2">
        <Label className="text-base">Caminhões Vinculados</Label>
        <div className="grid grid-cols-2 gap-2">
          {trucks.map((truck) => (
            <div key={truck.id} className="flex items-center space-x-2">
              <Checkbox 
                id={`truck-${truck.id}`} 
                checked={selectedTrucks.includes(truck.id)}
                onCheckedChange={() => handleTruckToggle(truck.id)}
              />
              <Label htmlFor={`truck-${truck.id}`}>{truck.name}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-base">Projetos Vinculados</Label>
        <div className="grid grid-cols-2 gap-2">
          {projects.map((project) => (
            <div key={project.id} className="flex items-center space-x-2">
              <Checkbox 
                id={`project-${project.id}`} 
                checked={selectedProjects.includes(project.id)}
                onCheckedChange={() => handleProjectToggle(project.id)}
              />
              <Label htmlFor={`project-${project.id}`}>{project.name}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit}>Salvar</Button>
      </div>
    </div>
  );
};
