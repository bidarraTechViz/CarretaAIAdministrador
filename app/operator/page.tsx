'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table } from '@/components/ui/table';
import { getOperators, deleteOperator } from '@/lib/supabase-operators';
import { Operator } from '@/lib/supabase';
import { OperatorForm } from '@/components/operators/operator-form';
import { toast } from 'sonner';

export default function OperatorsPage() {
    const [operators, setOperators] = useState<Operator[]>([]);
    const [editingOperator, setEditingOperator] = useState<Operator | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        loadOperators();
    }, []);

    const loadOperators = async () => {
        const { data } = await getOperators();
        setOperators(data || []);
        console.log('Operators:', data);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Tem certeza que deseja excluir?')) {
            const { error } = await deleteOperator(id);
            if (error) {
                toast.error('Erro ao excluir operador');
            } else {
                toast.success('Operador excluído');
                loadOperators();
            }
        }
    };

    const openCreateForm = () => {
        setIsCreating(true);
        setEditingOperator({
            id: 0,
            name: '',
            login: '',
            phone: '',
            truck_id: null,
            project_id: null,
            created_at: '',
        });
    };

    const openEditForm = (operator: Operator) => {
        setIsCreating(false);
        setEditingOperator(operator);
    };

    return (
        <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold">Gerenciar Operadores</h1>
                <Button onClick={openCreateForm}>+ Novo Operador</Button>
            </div>

            <table className="w-full table-fixed border-collapse border border-gray-300">
  <thead className="bg-gray-100">
    <tr>
      <th className="border border-gray-300 p-2 text-left">Nome</th>
      <th className="border border-gray-300 p-2 text-left">Login</th>
      <th className="border border-gray-300 p-2 text-left">Telefone</th>
      <th className="border border-gray-300 p-2 text-left">Caminhão</th>
      <th className="border border-gray-300 p-2 text-left">Projeto</th>
      <th className="border border-gray-300 p-2 text-center">Ações</th>
    </tr>
  </thead>
  <tbody>
    {operators.map((op) => (
      <tr key={op.id} className="hover:bg-gray-50">
        <td className="border border-gray-300 p-2">{op.name}</td>
        <td className="border border-gray-300 p-2">{op.login}</td>
        <td className="border border-gray-300 p-2">{op.phone || '-'}</td>
        <td className="border border-gray-300 p-2">{op.truck?.name || '-'}</td>
        <td className="border border-gray-300 p-2">{op.project?.name || '-'}</td>
        <td className="border border-gray-300 p-2 space-x-2 flex justify-center">
          <Button size="sm" variant="outline" onClick={() => setEditingOperator(op)}>
            Editar
          </Button>
          <Button size="sm" variant="destructive" onClick={() => handleDelete(op.id)}>
            Excluir
          </Button>
        </td>
      </tr>
    ))}
  </tbody>
</table>


            {editingOperator !== null && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <OperatorForm
                            operator={editingOperator}
                            isCreating={isCreating}
                            onClose={() => {
                                setEditingOperator(null);
                                loadOperators();
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
