'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getOperators, deleteOperator } from '@/lib/supabase-operators';
import { Operator } from '@/lib/supabase';
import { OperatorForm } from '@/components/operators/operator-form';
import { toast } from 'sonner';
import { Truck, Folder } from 'lucide-react';

export default function OperatorsPage() {
    const [operators, setOperators] = useState<Operator[]>([]);
    const [editingOperator, setEditingOperator] = useState<Operator | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [selectedTrucks, setSelectedTrucks] = useState<{ id: number; name: string }[] | null>(null);
    const [selectedProjects, setSelectedProjects] = useState<{ id: number; name: string }[] | null>(null);

    useEffect(() => {
        loadOperators();
    }, []);

    const loadOperators = async () => {
        try {
            const { data, error } = await getOperators();
            if (error) throw error;
            setOperators(data || []);
        } catch (e) {
            console.error('Erro ao carregar operadores:', e);
            toast.error('Erro ao carregar operadores');
        }
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
            project_id: null,
            created_at: '',
            trucks: [],
            projects: []
        });
    };

    const openEditForm = (operator: Operator) => {
        setIsCreating(false);
        setEditingOperator(operator);
        closeModals(); // Fechar outros modais abertos
    };

    const handleCloseForm = () => {
        setEditingOperator(null);
        loadOperators();
    };

    const openTrucksModal = (trucks: { id: number; name: string }[]) => {
        setSelectedTrucks(trucks);
    };

    const openProjectsModal = (projects: { id: number; name: string }[]) => {
        setSelectedProjects(projects);
    };

    const closeModals = () => {
        setSelectedTrucks(null);
        setSelectedProjects(null);
    };

    return (
        <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold">Gerenciar Operadores</h1>
                <Button onClick={openCreateForm}>+ Novo Operador</Button>
            </div>

            <Table>
                <TableHeader>
                    <TableRow className='bg-gray-100 border-b'>
                        <TableHead>Nome</TableHead>
                        <TableHead>Login</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Caminhões</TableHead>
                        <TableHead>Projetos</TableHead>
                        <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {operators.map((op) => (
                        <TableRow key={op.id}>
                            <TableCell className='border-r border-gray-200 border-l'>{op.name}</TableCell>
                            <TableCell className='border-r border-gray-200'>{op.login}</TableCell>
                            <TableCell className='border-r border-gray-200'>{op.phone || '-'}</TableCell>
                            <TableCell className='border-r border-gray-200'>
                                <Dialog open={selectedTrucks === op.trucks} onOpenChange={(open) => !open && closeModals()}>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="sm" onClick={() => openTrucksModal(op.trucks || [])}>
                                            <Truck className="h-4 w-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px]">
                                        <DialogHeader>
                                            <DialogTitle>Caminhões</DialogTitle>
                                        </DialogHeader>
                                        <ul className="space-y-2">
                                            {(op.trucks && op.trucks.length > 0) ? (
                                                op.trucks.map(truck => (
                                                    <li key={truck.id}>{truck.name}</li>
                                                ))
                                            ) : (
                                                <li>Nenhum caminhão associado</li>
                                            )}
                                        </ul>
                                        <DialogFooter>
                                            <Button onClick={() => openEditForm(op)}>
                                                Editar
                                            </Button>
                                            <Button variant="outline" onClick={closeModals}>
                                                Fechar
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </TableCell>
                            <TableCell className='border-r border-gray-200 border-l'>
                                <Dialog open={selectedProjects === op.projects} onOpenChange={(open) => !open && closeModals()}>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="sm" onClick={() => openProjectsModal(op.projects || [])}>
                                            <Folder className="h-4 w-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px]">
                                        <DialogHeader>
                                            <DialogTitle>Projetos</DialogTitle>
                                        </DialogHeader>
                                        <ul className="space-y-2">
                                            {(op.projects && op.projects.length > 0) ? (
                                                op.projects.map(project => (
                                                    <li key={project.id}>{project.name}</li>
                                                ))
                                            ) : (
                                                <li>Nenhum projeto associado</li>
                                            )}
                                        </ul>
                                        <DialogFooter>
                                            <Button onClick={() => openEditForm(op)}>
                                                Editar
                                            </Button>
                                            <Button variant="outline" onClick={closeModals}>
                                                Fechar
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </TableCell>
                            <TableCell className="space-x-2 flex justify-center border-r border-gray-200 border-l">
                                <Button size="sm" variant="outline" onClick={() => openEditForm(op)}>
                                    Editar
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDelete(op.id)}>
                                    Excluir
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* Modal de Edição/Criação */}
            {editingOperator !== null && (
                <Dialog open={editingOperator !== null} onOpenChange={(open) => !open && handleCloseForm()}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{isCreating ? 'Criar Operador' : 'Editar Operador'}</DialogTitle>
                        </DialogHeader>
                        <OperatorForm
                            operator={editingOperator}
                            isCreating={isCreating}
                            onClose={handleCloseForm}
                        />
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}