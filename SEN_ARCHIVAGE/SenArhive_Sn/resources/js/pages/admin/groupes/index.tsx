import { Head, useForm, router } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Users, UserPlus, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Groupe, Utilisateur } from '@/types/models';

interface Props {
    groupes: (Groupe & { utilisateurs: Utilisateur[] })[];
    utilisateurs: Utilisateur[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Administration', href: '/admin' },
    { title: 'Groupes', href: '/admin/groupes' },
];

export default function GroupesIndex({ groupes, utilisateurs }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [editGroupe, setEditGroupe] = useState<(Groupe & { utilisateurs: Utilisateur[] }) | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [addMemberGroupeId, setAddMemberGroupeId] = useState<string | null>(null);
    const [selectedUserId, setSelectedUserId] = useState('');

    const createForm = useForm({ nom: '', description: '' });
    const editForm = useForm({ nom: '', description: '' });

    function submitCreate(e: FormEvent) {
        e.preventDefault();
        createForm.post('/admin/groupes', {
            onSuccess: () => {
                setShowCreate(false);
                createForm.reset();
            },
        });
    }

    function openEdit(groupe: Groupe & { utilisateurs: Utilisateur[] }) {
        setEditGroupe(groupe);
        editForm.setData({ nom: groupe.nom, description: groupe.description ?? '' });
    }

    function submitEdit(e: FormEvent) {
        e.preventDefault();
        if (!editGroupe) return;
        editForm.put(`/admin/groupes/${editGroupe.id}`, {
            onSuccess: () => {
                setEditGroupe(null);
                editForm.reset();
            },
        });
    }

    function deleteGroupe(groupe: Groupe) {
        if (!confirm(`Supprimer le groupe "${groupe.nom}" ?`)) return;
        router.delete(`/admin/groupes/${groupe.id}`);
    }

    function addMember(groupeId: string) {
        if (!selectedUserId) return;
        router.post(`/admin/groupes/${groupeId}/utilisateurs`, { utilisateur_id: selectedUserId }, {
            onSuccess: () => {
                setAddMemberGroupeId(null);
                setSelectedUserId('');
            },
        });
    }

    function removeMember(groupeId: string, userId: string) {
        if (!confirm('Retirer ce membre du groupe ?')) return;
        router.delete(`/admin/groupes/${groupeId}/utilisateurs/${userId}`);
    }

    function toggleExpand(id: string) {
        setExpandedId(expandedId === id ? null : id);
    }

    function availableUsers(groupe: Groupe & { utilisateurs: Utilisateur[] }) {
        const memberIds = new Set(groupe.utilisateurs.map((u) => u.id));
        return utilisateurs.filter((u) => !memberIds.has(u.id));
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Groupes" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Groupes</h1>
                    <Dialog open={showCreate} onOpenChange={setShowCreate}>
                        <DialogTrigger asChild>
                            <Button><Plus className="mr-2 h-4 w-4" />Nouveau groupe</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Creer un groupe</DialogTitle></DialogHeader>
                            <form onSubmit={submitCreate} className="space-y-4">
                                <div>
                                    <Label>Nom</Label>
                                    <Input value={createForm.data.nom} onChange={(e) => createForm.setData('nom', e.target.value)} className="mt-1" />
                                    {createForm.errors.nom && <p className="mt-1 text-sm text-red-600">{createForm.errors.nom}</p>}
                                </div>
                                <div>
                                    <Label>Description</Label>
                                    <Input value={createForm.data.description} onChange={(e) => createForm.setData('description', e.target.value)} className="mt-1" />
                                    {createForm.errors.description && <p className="mt-1 text-sm text-red-600">{createForm.errors.description}</p>}
                                </div>
                                <Button type="submit" disabled={createForm.processing} className="w-full">Creer</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {groupes.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {groupes.map((groupe) => (
                            <Card key={groupe.id} className="overflow-hidden">
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between">
                                        <div
                                            className="flex cursor-pointer items-start gap-3"
                                            onClick={() => toggleExpand(groupe.id)}
                                        >
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                                <Users className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">{groupe.nom}</h3>
                                                {groupe.description && (
                                                    <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">{groupe.description}</p>
                                                )}
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {groupe.utilisateurs.length} membre{groupe.utilisateurs.length > 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(groupe)} title="Modifier">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => deleteGroupe(groupe)} title="Supprimer" className="text-red-600 hover:text-red-700">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {expandedId === groupe.id && (
                                        <div className="mt-4 border-t pt-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium">Membres</span>
                                                <Button variant="outline" size="sm" onClick={() => setAddMemberGroupeId(groupe.id)}>
                                                    <UserPlus className="mr-1 h-3 w-3" />Ajouter
                                                </Button>
                                            </div>
                                            {groupe.utilisateurs.length > 0 ? (
                                                <ul className="space-y-2">
                                                    {groupe.utilisateurs.map((user) => (
                                                        <li key={user.id} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
                                                            <span>{user.prenom} {user.nom}</span>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-600 hover:text-red-700" onClick={() => removeMember(groupe.id, user.id)} title="Retirer">
                                                                <X className="h-3 w-3" />
                                                            </Button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">Aucun membre dans ce groupe.</p>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-1 items-center justify-center">
                        <div className="text-center">
                            <Users className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
                            <h3 className="text-lg font-medium">Aucun groupe</h3>
                            <p className="mt-1 text-muted-foreground">Creez votre premier groupe.</p>
                            <Button className="mt-4" onClick={() => setShowCreate(true)}>
                                <Plus className="mr-2 h-4 w-4" />Nouveau groupe
                            </Button>
                        </div>
                    </div>
                )}

                {/* Edit Dialog */}
                <Dialog open={!!editGroupe} onOpenChange={(open) => { if (!open) setEditGroupe(null); }}>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Modifier le groupe</DialogTitle></DialogHeader>
                        <form onSubmit={submitEdit} className="space-y-4">
                            <div>
                                <Label>Nom</Label>
                                <Input value={editForm.data.nom} onChange={(e) => editForm.setData('nom', e.target.value)} className="mt-1" />
                                {editForm.errors.nom && <p className="mt-1 text-sm text-red-600">{editForm.errors.nom}</p>}
                            </div>
                            <div>
                                <Label>Description</Label>
                                <Input value={editForm.data.description} onChange={(e) => editForm.setData('description', e.target.value)} className="mt-1" />
                                {editForm.errors.description && <p className="mt-1 text-sm text-red-600">{editForm.errors.description}</p>}
                            </div>
                            <Button type="submit" disabled={editForm.processing} className="w-full">Enregistrer</Button>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Add Member Dialog */}
                <Dialog open={!!addMemberGroupeId} onOpenChange={(open) => { if (!open) { setAddMemberGroupeId(null); setSelectedUserId(''); } }}>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Ajouter un membre</DialogTitle></DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label>Utilisateur</Label>
                                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Selectionner un utilisateur" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {addMemberGroupeId && availableUsers(groupes.find((g) => g.id === addMemberGroupeId)!).map((user) => (
                                            <SelectItem key={user.id} value={user.id}>{user.prenom} {user.nom}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                className="w-full"
                                disabled={!selectedUserId}
                                onClick={() => addMemberGroupeId && addMember(addMemberGroupeId)}
                            >
                                Ajouter
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
