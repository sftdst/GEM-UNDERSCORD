import { Head, useForm, router } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Shield } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Role } from '@/types/models';

interface Props {
    roles: Role[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Administration', href: '/admin' },
    { title: 'Roles', href: '/admin/roles' },
];

const ALL_PERMISSIONS = [
    { key: 'documents.lire', label: 'Documents : Lire' },
    { key: 'documents.ecrire', label: 'Documents : Ecrire' },
    { key: 'documents.supprimer', label: 'Documents : Supprimer' },
    { key: 'documents.partager', label: 'Documents : Partager' },
    { key: 'dossiers.creer', label: 'Dossiers : Creer' },
    { key: 'dossiers.supprimer', label: 'Dossiers : Supprimer' },
    { key: 'workflows.gerer', label: 'Workflows : Gerer' },
    { key: 'admin.utilisateurs', label: 'Admin : Utilisateurs' },
    { key: 'admin.roles', label: 'Admin : Roles' },
    { key: 'admin.facturation', label: 'Admin : Facturation' },
];

function buildDefaultPermissions(): Record<string, boolean> {
    const perms: Record<string, boolean> = {};
    ALL_PERMISSIONS.forEach((p) => { perms[p.key] = false; });
    return perms;
}

export default function RolesIndex({ roles }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [editRole, setEditRole] = useState<Role | null>(null);

    const createForm = useForm({ nom: '', permissions: buildDefaultPermissions() });
    const editForm = useForm({ nom: '', permissions: buildDefaultPermissions() });

    function toggleCreatePerm(key: string) {
        createForm.setData('permissions', {
            ...createForm.data.permissions,
            [key]: !createForm.data.permissions[key],
        });
    }

    function toggleEditPerm(key: string) {
        editForm.setData('permissions', {
            ...editForm.data.permissions,
            [key]: !editForm.data.permissions[key],
        });
    }

    function submitCreate(e: FormEvent) {
        e.preventDefault();
        createForm.post('/admin/roles', {
            onSuccess: () => {
                setShowCreate(false);
                createForm.setData({ nom: '', permissions: buildDefaultPermissions() });
            },
        });
    }

    function openEdit(role: Role) {
        setEditRole(role);
        const perms = buildDefaultPermissions();
        if (role.permissions) {
            Object.entries(role.permissions).forEach(([k, v]) => {
                if (k in perms) perms[k] = v;
            });
        }
        editForm.setData({ nom: role.nom, permissions: perms });
    }

    function submitEdit(e: FormEvent) {
        e.preventDefault();
        if (!editRole) return;
        editForm.put(`/admin/roles/${editRole.id}`, {
            onSuccess: () => {
                setEditRole(null);
                editForm.setData({ nom: '', permissions: buildDefaultPermissions() });
            },
        });
    }

    function deleteRole(role: Role) {
        if (!confirm(`Supprimer le role "${role.nom}" ?`)) return;
        router.delete(`/admin/roles/${role.id}`);
    }

    function countPermissions(permissions: Record<string, boolean>): number {
        return Object.values(permissions).filter(Boolean).length;
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Roles" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Roles</h1>
                    <Dialog open={showCreate} onOpenChange={setShowCreate}>
                        <DialogTrigger asChild>
                            <Button><Plus className="mr-2 h-4 w-4" />Nouveau role</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader><DialogTitle>Creer un role</DialogTitle></DialogHeader>
                            <form onSubmit={submitCreate} className="space-y-4">
                                <div>
                                    <Label>Nom</Label>
                                    <Input value={createForm.data.nom} onChange={(e) => createForm.setData('nom', e.target.value)} className="mt-1" />
                                    {createForm.errors.nom && <p className="mt-1 text-sm text-red-600">{createForm.errors.nom}</p>}
                                </div>
                                <div>
                                    <Label>Permissions</Label>
                                    <div className="mt-2 grid grid-cols-1 gap-2">
                                        {ALL_PERMISSIONS.map((perm) => (
                                            <label key={perm.key} className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={createForm.data.permissions[perm.key] ?? false}
                                                    onChange={() => toggleCreatePerm(perm.key)}
                                                    className="rounded border-gray-300"
                                                />
                                                {perm.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <Button type="submit" disabled={createForm.processing} className="w-full">Creer</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {roles.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {roles.map((role) => (
                            <Card key={role.id}>
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                                <Shield className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">{role.nom}</h3>
                                                <div className="mt-1 flex flex-wrap gap-1.5">
                                                    {role.est_systeme && (
                                                        <Badge variant="secondary">Systeme</Badge>
                                                    )}
                                                    <span className="text-xs text-muted-foreground">
                                                        {countPermissions(role.permissions)} permission{countPermissions(role.permissions) > 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(role)} title="Modifier">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            {!role.est_systeme && (
                                                <Button variant="ghost" size="icon" onClick={() => deleteRole(role)} title="Supprimer" className="text-red-600 hover:text-red-700">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-1 items-center justify-center">
                        <div className="text-center">
                            <Shield className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
                            <h3 className="text-lg font-medium">Aucun role</h3>
                            <p className="mt-1 text-muted-foreground">Creez votre premier role.</p>
                            <Button className="mt-4" onClick={() => setShowCreate(true)}>
                                <Plus className="mr-2 h-4 w-4" />Nouveau role
                            </Button>
                        </div>
                    </div>
                )}

                {/* Edit Dialog */}
                <Dialog open={!!editRole} onOpenChange={(open) => { if (!open) setEditRole(null); }}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader><DialogTitle>Modifier le role</DialogTitle></DialogHeader>
                        <form onSubmit={submitEdit} className="space-y-4">
                            <div>
                                <Label>Nom</Label>
                                <Input value={editForm.data.nom} onChange={(e) => editForm.setData('nom', e.target.value)} className="mt-1" />
                                {editForm.errors.nom && <p className="mt-1 text-sm text-red-600">{editForm.errors.nom}</p>}
                            </div>
                            <div>
                                <Label>Permissions</Label>
                                <div className="mt-2 grid grid-cols-1 gap-2">
                                    {ALL_PERMISSIONS.map((perm) => (
                                        <label key={perm.key} className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={editForm.data.permissions[perm.key] ?? false}
                                                onChange={() => toggleEditPerm(perm.key)}
                                                className="rounded border-gray-300"
                                            />
                                            {perm.label}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <Button type="submit" disabled={editForm.processing} className="w-full">Enregistrer</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
