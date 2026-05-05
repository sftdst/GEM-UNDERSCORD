import { Head, useForm, router, usePage } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Building, Search } from 'lucide-react';
import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Departement, Utilisateur } from '@/types/models';

interface Props {
    departements: Departement[];
    utilisateurs: Pick<Utilisateur, 'id' | 'nom' | 'prenom'>[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Administration', href: '/admin' },
    { title: 'Departements', href: '/admin/departements' },
];

function actifBadge(actif: boolean) {
    return actif
        ? <Badge className="bg-green-100 text-green-800 border-green-200">Actif</Badge>
        : <Badge className="bg-gray-100 text-gray-800 border-gray-200">Inactif</Badge>;
}

export default function DepartementsIndex({ departements, utilisateurs }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [editDept, setEditDept] = useState<Departement | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props as { flash: { success?: string; error?: string } };

    const filteredDepartements = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return departements;
        return departements.filter((dept) =>
            dept.nom.toLowerCase().includes(q) ||
            (dept.code ?? '').toLowerCase().includes(q)
        );
    }, [departements, searchQuery]);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const createForm = useForm({
        nom: '',
        description: '',
        code: '',
        responsable_id: '',
    });

    const editForm = useForm({
        nom: '',
        description: '',
        code: '',
        responsable_id: '',
    });

    function submitCreate(e: FormEvent) {
        e.preventDefault();
        createForm.post('/admin/departements', {
            onSuccess: () => {
                setShowCreate(false);
                createForm.reset();
            },
        });
    }

    function openEdit(dept: Departement) {
        setEditDept(dept);
        editForm.setData({
            nom: dept.nom,
            description: dept.description ?? '',
            code: dept.code ?? '',
            responsable_id: dept.responsable_id ?? '',
        });
    }

    function submitEdit(e: FormEvent) {
        e.preventDefault();
        if (!editDept) return;
        editForm.put(`/admin/departements/${editDept.id}`, {
            onSuccess: () => {
                setEditDept(null);
                editForm.reset();
            },
        });
    }

    function deleteDept(dept: Departement) {
        if (!confirm(`Supprimer le departement "${dept.nom}" ?`)) return;
        router.delete(`/admin/departements/${dept.id}`);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Departements" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Departements</h1>
                    <Dialog open={showCreate} onOpenChange={setShowCreate}>
                        <DialogTrigger asChild>
                            <Button><Plus className="mr-2 h-4 w-4" />Nouveau departement</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader><DialogTitle>Creer un departement</DialogTitle></DialogHeader>
                            <form onSubmit={submitCreate} className="space-y-4">
                                <div>
                                    <Label>Nom</Label>
                                    <Input
                                        value={createForm.data.nom}
                                        onChange={(e) => createForm.setData('nom', e.target.value)}
                                        className="mt-1"
                                    />
                                    {createForm.errors.nom && <p className="mt-1 text-sm text-red-600">{createForm.errors.nom}</p>}
                                </div>
                                <div>
                                    <Label>Description</Label>
                                    <Textarea
                                        value={createForm.data.description}
                                        onChange={(e) => createForm.setData('description', e.target.value)}
                                        className="mt-1"
                                        rows={3}
                                    />
                                    {createForm.errors.description && <p className="mt-1 text-sm text-red-600">{createForm.errors.description}</p>}
                                </div>
                                <div>
                                    <Label>Code</Label>
                                    <Input
                                        value={createForm.data.code}
                                        onChange={(e) => createForm.setData('code', e.target.value)}
                                        className="mt-1"
                                        maxLength={20}
                                        placeholder="Ex: DEV, RH, FIN"
                                    />
                                    {createForm.errors.code && <p className="mt-1 text-sm text-red-600">{createForm.errors.code}</p>}
                                </div>
                                <div>
                                    <Label>Responsable</Label>
                                    <select
                                        value={createForm.data.responsable_id}
                                        onChange={(e) => createForm.setData('responsable_id', e.target.value)}
                                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="">Aucun</option>
                                        {utilisateurs.map((u) => (
                                            <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>
                                        ))}
                                    </select>
                                    {createForm.errors.responsable_id && <p className="mt-1 text-sm text-red-600">{createForm.errors.responsable_id}</p>}
                                </div>
                                <Button type="submit" disabled={createForm.processing} className="w-full">
                                    Creer
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher par nom ou code..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                {filteredDepartements.length > 0 ? (
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="px-4 py-3 text-left font-medium">Nom</th>
                                    <th className="px-4 py-3 text-left font-medium">Code</th>
                                    <th className="px-4 py-3 text-left font-medium">Responsable</th>
                                    <th className="px-4 py-3 text-left font-medium">Services</th>
                                    <th className="px-4 py-3 text-left font-medium">Statut</th>
                                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDepartements.map((dept) => (
                                    <tr key={dept.id} className="border-b last:border-0 hover:bg-muted/30">
                                        <td className="px-4 py-3 font-medium">{dept.nom}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{dept.code ?? '—'}</td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {dept.responsable ? `${dept.responsable.prenom} ${dept.responsable.nom}` : '—'}
                                        </td>
                                        <td className="px-4 py-3">{dept.services_count ?? 0}</td>
                                        <td className="px-4 py-3">{actifBadge(dept.actif)}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(dept)} title="Modifier">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => deleteDept(dept)} title="Supprimer" className="text-red-600 hover:text-red-700">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-1 items-center justify-center">
                        <div className="text-center">
                            <Building className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
                            <h3 className="text-lg font-medium">Aucun departement</h3>
                            <p className="mt-1 text-muted-foreground">Creez votre premier departement.</p>
                            <Button className="mt-4" onClick={() => setShowCreate(true)}>
                                <Plus className="mr-2 h-4 w-4" />Nouveau departement
                            </Button>
                        </div>
                    </div>
                )}

                {/* Edit Dialog */}
                <Dialog open={!!editDept} onOpenChange={(open) => { if (!open) setEditDept(null); }}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader><DialogTitle>Modifier le departement</DialogTitle></DialogHeader>
                        <form onSubmit={submitEdit} className="space-y-4">
                            <div>
                                <Label>Nom</Label>
                                <Input
                                    value={editForm.data.nom}
                                    onChange={(e) => editForm.setData('nom', e.target.value)}
                                    className="mt-1"
                                />
                                {editForm.errors.nom && <p className="mt-1 text-sm text-red-600">{editForm.errors.nom}</p>}
                            </div>
                            <div>
                                <Label>Description</Label>
                                <Textarea
                                    value={editForm.data.description}
                                    onChange={(e) => editForm.setData('description', e.target.value)}
                                    className="mt-1"
                                    rows={3}
                                />
                                {editForm.errors.description && <p className="mt-1 text-sm text-red-600">{editForm.errors.description}</p>}
                            </div>
                            <div>
                                <Label>Code</Label>
                                <Input
                                    value={editForm.data.code}
                                    onChange={(e) => editForm.setData('code', e.target.value)}
                                    className="mt-1"
                                    maxLength={20}
                                    placeholder="Ex: DEV, RH, FIN"
                                />
                                {editForm.errors.code && <p className="mt-1 text-sm text-red-600">{editForm.errors.code}</p>}
                            </div>
                            <div>
                                <Label>Responsable</Label>
                                <select
                                    value={editForm.data.responsable_id}
                                    onChange={(e) => editForm.setData('responsable_id', e.target.value)}
                                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                >
                                    <option value="">Aucun</option>
                                    {utilisateurs.map((u) => (
                                        <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>
                                    ))}
                                </select>
                                {editForm.errors.responsable_id && <p className="mt-1 text-sm text-red-600">{editForm.errors.responsable_id}</p>}
                            </div>
                            <Button type="submit" disabled={editForm.processing} className="w-full">
                                Enregistrer
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
