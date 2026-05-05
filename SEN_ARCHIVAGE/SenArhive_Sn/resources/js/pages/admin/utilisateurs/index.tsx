import { Head, router } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Users, Search, Camera, X } from 'lucide-react';
import { useState, useMemo, useRef, type FormEvent, type ChangeEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Utilisateur, Role, Service } from '@/types/models';

interface Props {
    utilisateurs: (Utilisateur & { role?: Role; service?: Service })[];
    roles: Role[];
    services: (Service & { departement?: { id: string; nom: string } })[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Administration', href: '/admin' },
    { title: 'Utilisateurs', href: '/admin/utilisateurs' },
];

function statutBadge(statut: string) {
    switch (statut) {
        case 'actif':     return <Badge className="bg-green-100 text-green-800 border-green-200">Actif</Badge>;
        case 'inactif':   return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Inactif</Badge>;
        case 'suspendu':  return <Badge className="bg-red-100 text-red-800 border-red-200">Suspendu</Badge>;
        case 'invite':    return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Invité</Badge>;
        default:          return <Badge variant="secondary">{statut}</Badge>;
    }
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function initiales(prenom: string, nom: string) {
    return `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase();
}

// ─── Composant avatar upload ──────────────────────────────────────────────────

function AvatarUpload({
    currentUrl,
    onChange,
    onClear,
    preview,
}: {
    currentUrl?: string | null;
    preview: string | null;
    onChange: (file: File) => void;
    onClear: () => void;
}) {
    const ref = useRef<HTMLInputElement>(null);
    const displayed = preview ?? currentUrl ?? null;

    function handleChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        onChange(file);
    }

    return (
        <div className="flex flex-col items-center gap-2">
            <div
                className="relative h-20 w-20 cursor-pointer rounded-full border-2 border-dashed border-muted-foreground/30 hover:border-primary transition-colors group"
                onClick={() => ref.current?.click()}
            >
                {displayed ? (
                    <img src={displayed} alt="avatar" className="h-full w-full rounded-full object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-muted">
                        <Camera className="h-7 w-7 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                    </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-5 w-5 text-white" />
                </div>
            </div>
            <input ref={ref} type="file" accept="image/jpeg,image/png,image/jpg,image/webp" className="hidden" onChange={handleChange} />
            <div className="flex items-center gap-2">
                <button type="button" onClick={() => ref.current?.click()} className="text-xs text-primary hover:underline">
                    {displayed ? 'Changer la photo' : 'Ajouter une photo'}
                </button>
                {displayed && (
                    <button type="button" onClick={onClear} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-0.5">
                        <X className="h-3 w-3" />Retirer
                    </button>
                )}
            </div>
            <p className="text-xs text-muted-foreground">JPG, PNG ou WEBP — max 2 Mo</p>
        </div>
    );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function UtilisateursIndex({ utilisateurs, roles, services }: Props) {
    const [showInvite, setShowInvite]   = useState(false);
    const [editUser, setEditUser]       = useState<(Utilisateur & { role?: Role; service?: Service }) | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterService, setFilterService] = useState('');
    const [filterStatut, setFilterStatut]   = useState('');
    const [processing, setProcessing]   = useState(false);

    // ── Formulaire création ──────────────────────────────────────────────────
    const [inviteData, setInviteData] = useState({ nom: '', prenom: '', email: '', role_id: '', service_id: '' });
    const [invitePhoto, setInvitePhoto]     = useState<File | null>(null);
    const [invitePreview, setInvitePreview] = useState<string | null>(null);
    const [inviteErrors, setInviteErrors]   = useState<Record<string, string>>({});

    // ── Formulaire édition ───────────────────────────────────────────────────
    const [editData, setEditData] = useState({ nom: '', prenom: '', email: '', role_id: '', service_id: '' });
    const [editPhoto, setEditPhoto]     = useState<File | null>(null);
    const [editPreview, setEditPreview] = useState<string | null>(null);
    const [editErrors, setEditErrors]   = useState<Record<string, string>>({});

    const filteredUtilisateurs = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        return utilisateurs.filter((user) => {
            const matchesSearch  = !q || user.nom.toLowerCase().includes(q) || user.prenom.toLowerCase().includes(q) || user.email.toLowerCase().includes(q);
            const matchesService = !filterService || user.service_id === filterService;
            const matchesStatut  = !filterStatut  || user.statut === filterStatut;
            return matchesSearch && matchesService && matchesStatut;
        });
    }, [utilisateurs, searchQuery, filterService, filterStatut]);

    function setPhotoPreview(file: File, setter: (v: string | null) => void) {
        const reader = new FileReader();
        reader.onload = (e) => setter(e.target?.result as string);
        reader.readAsDataURL(file);
    }

    // ── Submit création ──────────────────────────────────────────────────────
    function submitInvite(e: FormEvent) {
        e.preventDefault();
        setProcessing(true);
        setInviteErrors({});
        const data = new FormData();
        Object.entries(inviteData).forEach(([k, v]) => { if (v) data.append(k, v); });
        if (invitePhoto) data.append('photo', invitePhoto);

        router.post('/admin/utilisateurs', data, {
            forceFormData: true,
            onSuccess: () => {
                setShowInvite(false);
                setInviteData({ nom: '', prenom: '', email: '', role_id: '', service_id: '' });
                setInvitePhoto(null);
                setInvitePreview(null);
            },
            onError: (errors) => setInviteErrors(errors as Record<string, string>),
            onFinish: () => setProcessing(false),
        });
    }

    // ── Ouvrir édition ───────────────────────────────────────────────────────
    function openEdit(user: Utilisateur & { role?: Role; service?: Service }) {
        setEditUser(user);
        setEditData({ nom: user.nom, prenom: user.prenom, email: user.email ?? '', role_id: user.role_id ?? '', service_id: user.service_id ?? '' });
        setEditPhoto(null);
        setEditPreview(null);
        setEditErrors({});
    }

    // ── Submit édition ───────────────────────────────────────────────────────
    function submitEdit(e: FormEvent) {
        e.preventDefault();
        if (!editUser) return;
        setProcessing(true);
        setEditErrors({});
        const data = new FormData();
        data.append('_method', 'PUT');
        Object.entries(editData).forEach(([k, v]) => data.append(k, v));
        if (editPhoto) data.append('photo', editPhoto);

        router.post(`/admin/utilisateurs/${editUser.id}`, data, {
            forceFormData: true,
            onSuccess: () => { setEditUser(null); setEditPhoto(null); setEditPreview(null); },
            onError: (errors) => setEditErrors(errors as Record<string, string>),
            onFinish: () => setProcessing(false),
        });
    }

    function deleteUser(user: Utilisateur) {
        if (!confirm(`Désactiver l'utilisateur ${user.prenom} ${user.nom} ?`)) return;
        router.delete(`/admin/utilisateurs/${user.id}`);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Utilisateurs" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Utilisateurs</h1>

                    {/* Dialog création */}
                    <Dialog open={showInvite} onOpenChange={setShowInvite}>
                        <DialogTrigger asChild>
                            <Button><Plus className="mr-2 h-4 w-4" />Inviter un utilisateur</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader><DialogTitle>Inviter un utilisateur</DialogTitle></DialogHeader>
                            <form onSubmit={submitInvite} className="space-y-4">
                                <AvatarUpload
                                    preview={invitePreview}
                                    onChange={(f) => { setInvitePhoto(f); setPhotoPreview(f, setInvitePreview); }}
                                    onClear={() => { setInvitePhoto(null); setInvitePreview(null); }}
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label>Prénom</Label>
                                        <Input value={inviteData.prenom} onChange={(e) => setInviteData(d => ({ ...d, prenom: e.target.value }))} className="mt-1" />
                                        {inviteErrors.prenom && <p className="mt-1 text-xs text-red-600">{inviteErrors.prenom}</p>}
                                    </div>
                                    <div>
                                        <Label>Nom</Label>
                                        <Input value={inviteData.nom} onChange={(e) => setInviteData(d => ({ ...d, nom: e.target.value }))} className="mt-1" />
                                        {inviteErrors.nom && <p className="mt-1 text-xs text-red-600">{inviteErrors.nom}</p>}
                                    </div>
                                </div>
                                <div>
                                    <Label>Email</Label>
                                    <Input type="email" value={inviteData.email} onChange={(e) => setInviteData(d => ({ ...d, email: e.target.value }))} className="mt-1" />
                                    {inviteErrors.email && <p className="mt-1 text-xs text-red-600">{inviteErrors.email}</p>}
                                </div>
                                <div>
                                    <Label>Rôle *</Label>
                                    <Select value={inviteData.role_id} onValueChange={(val) => setInviteData(d => ({ ...d, role_id: val }))}>
                                        <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner un rôle" /></SelectTrigger>
                                        <SelectContent>
                                            {roles.map((role) => <SelectItem key={role.id} value={role.id}>{role.nom}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    {inviteErrors.role_id && <p className="mt-1 text-xs text-red-600">{inviteErrors.role_id}</p>}
                                </div>
                                <div>
                                    <Label>Service</Label>
                                    <select
                                        value={inviteData.service_id}
                                        onChange={(e) => setInviteData(d => ({ ...d, service_id: e.target.value }))}
                                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="">Aucun</option>
                                        {services.map((s) => <option key={s.id} value={s.id}>{s.nom}{s.departement ? ` (${s.departement.nom})` : ''}</option>)}
                                    </select>
                                </div>
                                {inviteErrors.photo && <p className="text-xs text-red-600">{inviteErrors.photo}</p>}
                                <Button type="submit" disabled={processing} className="w-full">
                                    {processing ? 'Envoi...' : 'Inviter'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Filtres */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher par nom, prénom ou email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <select value={filterService} onChange={(e) => setFilterService(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="">Tous les services</option>
                        {services.map((s) => <option key={s.id} value={s.id}>{s.nom}{s.departement ? ` (${s.departement.nom})` : ''}</option>)}
                    </select>
                    <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="">Tous les statuts</option>
                        <option value="actif">Actif</option>
                        <option value="inactif">Inactif</option>
                        <option value="suspendu">Suspendu</option>
                        <option value="invite">Invité</option>
                    </select>
                </div>

                {/* Tableau */}
                {filteredUtilisateurs.length > 0 ? (
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="px-4 py-3 text-left font-medium">Utilisateur</th>
                                    <th className="px-4 py-3 text-left font-medium">Email</th>
                                    <th className="px-4 py-3 text-left font-medium">Rôle</th>
                                    <th className="px-4 py-3 text-left font-medium">Service</th>
                                    <th className="px-4 py-3 text-left font-medium">Statut</th>
                                    <th className="px-4 py-3 text-left font-medium">Date création</th>
                                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUtilisateurs.map((user) => (
                                    <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {user.avatar_url ? (
                                                    <img src={user.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" />
                                                ) : (
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                                        {initiales(user.prenom, user.nom)}
                                                    </div>
                                                )}
                                                <span className="font-medium">{user.prenom} {user.nom}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                                        <td className="px-4 py-3">{user.role?.nom ?? '—'}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{user.service?.nom ?? '—'}</td>
                                        <td className="px-4 py-3">{statutBadge(user.statut)}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{formatDate(user.created_at)}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(user)} title="Modifier">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => deleteUser(user)} title="Désactiver" className="text-red-600 hover:text-red-700">
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
                            <Users className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
                            <h3 className="text-lg font-medium">Aucun utilisateur</h3>
                            <p className="mt-1 text-muted-foreground">Invitez votre premier utilisateur.</p>
                            <Button className="mt-4" onClick={() => setShowInvite(true)}>
                                <Plus className="mr-2 h-4 w-4" />Inviter un utilisateur
                            </Button>
                        </div>
                    </div>
                )}

                {/* Dialog édition */}
                <Dialog open={!!editUser} onOpenChange={(open) => { if (!open) { setEditUser(null); setEditPhoto(null); setEditPreview(null); } }}>
                    <DialogContent className="max-w-md">
                        <DialogHeader><DialogTitle>Modifier l'utilisateur</DialogTitle></DialogHeader>
                        <form onSubmit={submitEdit} className="space-y-4">
                            <AvatarUpload
                                currentUrl={editUser?.avatar_url}
                                preview={editPreview}
                                onChange={(f) => { setEditPhoto(f); setPhotoPreview(f, setEditPreview); }}
                                onClear={() => { setEditPhoto(null); setEditPreview(null); }}
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label>Prénom</Label>
                                    <Input value={editData.prenom} onChange={(e) => setEditData(d => ({ ...d, prenom: e.target.value }))} className="mt-1" />
                                    {editErrors.prenom && <p className="mt-1 text-xs text-red-600">{editErrors.prenom}</p>}
                                </div>
                                <div>
                                    <Label>Nom</Label>
                                    <Input value={editData.nom} onChange={(e) => setEditData(d => ({ ...d, nom: e.target.value }))} className="mt-1" />
                                    {editErrors.nom && <p className="mt-1 text-xs text-red-600">{editErrors.nom}</p>}
                                </div>
                            </div>
                            <div>
                                <Label>Email</Label>
                                <Input type="email" value={editData.email} onChange={(e) => setEditData(d => ({ ...d, email: e.target.value }))} className="mt-1" />
                                {editErrors.email && <p className="mt-1 text-xs text-red-600">{editErrors.email}</p>}
                            </div>
                            <div>
                                <Label>Rôle</Label>
                                <Select value={editData.role_id} onValueChange={(val) => setEditData(d => ({ ...d, role_id: val }))}>
                                    <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner un rôle" /></SelectTrigger>
                                    <SelectContent>
                                        {roles.map((role) => <SelectItem key={role.id} value={role.id}>{role.nom}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                {editErrors.role_id && <p className="mt-1 text-xs text-red-600">{editErrors.role_id}</p>}
                            </div>
                            <div>
                                <Label>Service</Label>
                                <select
                                    value={editData.service_id}
                                    onChange={(e) => setEditData(d => ({ ...d, service_id: e.target.value }))}
                                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                >
                                    <option value="">Aucun</option>
                                    {services.map((s) => <option key={s.id} value={s.id}>{s.nom}{s.departement ? ` (${s.departement.nom})` : ''}</option>)}
                                </select>
                            </div>
                            {editErrors.photo && <p className="text-xs text-red-600">{editErrors.photo}</p>}
                            <Button type="submit" disabled={processing} className="w-full">
                                {processing ? 'Enregistrement...' : 'Enregistrer'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
