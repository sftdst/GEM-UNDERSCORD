import { Head, useForm, router, usePage } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Briefcase, Search } from 'lucide-react';
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
import type { Service, Departement, Utilisateur } from '@/types/models';

interface Props {
    services: Service[];
    departements: Departement[];
    utilisateurs: Pick<Utilisateur, 'id' | 'nom' | 'prenom'>[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Administration', href: '/admin' },
    { title: 'Services', href: '/admin/services' },
];

function actifBadge(actif: boolean) {
    return actif
        ? <Badge className="bg-green-100 text-green-800 border-green-200">Actif</Badge>
        : <Badge className="bg-gray-100 text-gray-800 border-gray-200">Inactif</Badge>;
}

export default function ServicesIndex({ services, departements, utilisateurs }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [editService, setEditService] = useState<Service | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDepartement, setFilterDepartement] = useState('');
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props as { flash: { success?: string; error?: string } };

    const filteredServices = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        return services.filter((service) => {
            const matchesSearch = !q ||
                service.nom.toLowerCase().includes(q) ||
                (service.code ?? '').toLowerCase().includes(q);
            const matchesDepartement = !filterDepartement || service.departement_id === filterDepartement;
            return matchesSearch && matchesDepartement;
        });
    }, [services, searchQuery, filterDepartement]);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const createForm = useForm({
        departement_id: '',
        nom: '',
        description: '',
        code: '',
        responsable_id: '',
    });

    const editForm = useForm({
        departement_id: '',
        nom: '',
        description: '',
        code: '',
        responsable_id: '',
    });

    function submitCreate(e: FormEvent) {
        e.preventDefault();
        createForm.post('/admin/services', {
            onSuccess: () => {
                setShowCreate(false);
                createForm.reset();
            },
        });
    }

    function openEdit(service: Service) {
        setEditService(service);
        editForm.setData({
            departement_id: service.departement_id,
            nom: service.nom,
            description: service.description ?? '',
            code: service.code ?? '',
            responsable_id: service.responsable_id ?? '',
        });
    }

    function submitEdit(e: FormEvent) {
        e.preventDefault();
        if (!editService) return;
        editForm.put(`/admin/services/${editService.id}`, {
            onSuccess: () => {
                setEditService(null);
                editForm.reset();
            },
        });
    }

    function deleteService(service: Service) {
        if (!confirm(`Supprimer le service "${service.nom}" ?`)) return;
        router.delete(`/admin/services/${service.id}`);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Services" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Services</h1>
                    <Dialog open={showCreate} onOpenChange={setShowCreate}>
                        <DialogTrigger asChild>
                            <Button><Plus className="mr-2 h-4 w-4" />Nouveau service</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader><DialogTitle>Creer un service</DialogTitle></DialogHeader>
                            <form onSubmit={submitCreate} className="space-y-4">
                                <div>
                                    <Label>Departement</Label>
                                    <select
                                        value={createForm.data.departement_id}
                                        onChange={(e) => createForm.setData('departement_id', e.target.value)}
                                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="">Selectionner un departement</option>
                                        {departements.map((d) => (
                                            <option key={d.id} value={d.id}>{d.nom}</option>
                                        ))}
                                    </select>
                                    {createForm.errors.departement_id && <p className="mt-1 text-sm text-red-600">{createForm.errors.departement_id}</p>}
                                </div>
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
                                        placeholder="Ex: DEV, COMPTA"
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
                    <select
                        value={filterDepartement}
                        onChange={(e) => setFilterDepartement(e.target.value)}
                        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="">Tous les departements</option>
                        {departements.map((d) => (
                            <option key={d.id} value={d.id}>{d.nom}</option>
                        ))}
                    </select>
                </div>

                {filteredServices.length > 0 ? (
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="px-4 py-3 text-left font-medium">Nom</th>
                                    <th className="px-4 py-3 text-left font-medium">Code</th>
                                    <th className="px-4 py-3 text-left font-medium">Departement</th>
                                    <th className="px-4 py-3 text-left font-medium">Responsable</th>
                                    <th className="px-4 py-3 text-left font-medium">Utilisateurs</th>
                                    <th className="px-4 py-3 text-left font-medium">Documents</th>
                                    <th className="px-4 py-3 text-left font-medium">Statut</th>
                                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredServices.map((service) => (
                                    <tr key={service.id} className="border-b last:border-0 hover:bg-muted/30">
                                        <td className="px-4 py-3 font-medium">{service.nom}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{service.code ?? '—'}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{service.departement?.nom ?? '—'}</td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {service.responsable ? `${service.responsable.prenom} ${service.responsable.nom}` : '—'}
                                        </td>
                                        <td className="px-4 py-3">{service.utilisateurs_count ?? 0}</td>
                                        <td className="px-4 py-3">{service.documents_count ?? 0}</td>
                                        <td className="px-4 py-3">{actifBadge(service.actif)}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(service)} title="Modifier">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => deleteService(service)} title="Supprimer" className="text-red-600 hover:text-red-700">
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
                            <Briefcase className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
                            <h3 className="text-lg font-medium">Aucun service</h3>
                            <p className="mt-1 text-muted-foreground">Creez votre premier service.</p>
                            <Button className="mt-4" onClick={() => setShowCreate(true)}>
                                <Plus className="mr-2 h-4 w-4" />Nouveau service
                            </Button>
                        </div>
                    </div>
                )}

                {/* Edit Dialog */}
                <Dialog open={!!editService} onOpenChange={(open) => { if (!open) setEditService(null); }}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader><DialogTitle>Modifier le service</DialogTitle></DialogHeader>
                        <form onSubmit={submitEdit} className="space-y-4">
                            <div>
                                <Label>Departement</Label>
                                <select
                                    value={editForm.data.departement_id}
                                    onChange={(e) => editForm.setData('departement_id', e.target.value)}
                                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                >
                                    <option value="">Selectionner un departement</option>
                                    {departements.map((d) => (
                                        <option key={d.id} value={d.id}>{d.nom}</option>
                                    ))}
                                </select>
                                {editForm.errors.departement_id && <p className="mt-1 text-sm text-red-600">{editForm.errors.departement_id}</p>}
                            </div>
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
                                    placeholder="Ex: DEV, COMPTA"
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
