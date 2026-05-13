/* ── Liste des courriers ────────────────────────────────────────────────────── */

import { Head, Link, router } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Send, Search, Filter, Eye, RefreshCw, ChevronDown, AlertTriangle } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Courrier, CourrierType, CourrierStatut, Service, Utilisateur } from '@/types/models';

interface Props {
    courriers: { data: Courrier[]; current_page: number; last_page: number; per_page: number; total: number };
    filters: {
        types: { type: string }[];
        categories: string[];
        urgences: { code: string; label: string }[];
        services: Service[];
        agents: Utilisateur[];
    };
    filterValues: {
        q?: string;
        type?: string;
        statut?: string;
        categorie?: string;
        urgence?: string;
        service_id?: string;
        agent_id?: string;
        date_from?: string;
        date_to?: string;
        en_retard?: string;
    };
    types: CourrierType[];
    statuts: CourrierStatut[];
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const URGENCE_COULEURS: Record<string, string> = {
    Normal: 'bg-green-100 text-green-800',
    Urgent: 'bg-orange-100 text-orange-800',
    TresUrgent: 'bg-red-100 text-red-800',
};

const STATUT_COLORS: Record<string, string> = {
    RECU: '#6366f1',
    AFFECTE: '#f59e0b',
    EN_COURS: '#3b82f6',
    TRAITE: '#10b981',
    CLOTURE: '#6b7280',
};

const FILTER_OPTIONS = [
    { key: 'type', label: 'Type de courrier' },
    { key: 'statut', label: 'Statut' },
    { key: 'categorie', label: 'Catégorie' },
    { key: 'urgence', label: 'Urgence' },
    { key: 'service_id', label: 'Service' },
    { key: 'agent_id', label: 'Agent' },
    { key: 'date_from', label: 'Date début' },
    { key: 'date_to', label: 'Date fin' },
    { key: 'en_retard', label: 'En retard' },
];

const _ = '__none__';

export default function CourriersListe({ courriers, filters, filterValues, types, statuts }: Props) {
    const [showFilters, setShowFilters] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; courrier: Courrier | null }>({
        open: false,
        courrier: null,
    });

    const hasActiveFilter = Object.values(filterValues).some((v) => v !== undefined && v !== '');

    const badgeColors: Record<string, string> = {
        ENT: 'bg-blue-100 text-blue-800',
        SOR: 'bg-emerald-100 text-emerald-800',
    };

    function handleDeleteConfirm() {
        if (!deleteConfirm.courrier) return;
        router.delete(`/courriers/${deleteConfirm.courrier.id}`, {
            onSuccess: () => setDeleteConfirm({ open: false, courrier: null }),
        });
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'Courriers', href: '/courriers' }, { title: 'Liste', href: '/courriers/liste' }]}>
            <Head title="Liste des courriers" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Liste des courriers</h1>
                        <p className="text-sm text-muted-foreground">
                            {courriers.total} courrier{courriers.total > 1 ? 's' : ''} au total
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button asChild>
                            <Link href="/courriers/entrant/creer"><Plus className="mr-2 h-4 w-4" />Courrier entrant</Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/courriers/sortant/creer"><Send className="mr-2 h-4 w-4" />Courrier sortant</Link>
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Rechercher par numéro, objet, expéditeur, destinataire..."
                                        defaultValue={filterValues.q}
                                        onChange={(e) => {
                                            const params = new URLSearchParams(window.location.search);
                                            params.set('q', e.target.value);
                                            router.get(`/courriers/liste?${params.toString()}`, {}, { preserveState: true, replace: true });
                                        }}
                                        className="pl-9"
                                    />
                                </div>
                                <Button
                                    variant={showFilters ? 'default' : 'outline'}
                                    size="icon"
                                    onClick={() => setShowFilters(!showFilters)}
                                    title="Afficher les filtres"
                                >
                                    <Filter className="h-4 w-4" />
                                </Button>
                                {hasActiveFilter && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            router.get('/courriers/liste', {}, { preserveState: true });
                                        }}
                                    >
                                        <RefreshCw className="mr-2 h-4 w-4" />Réinitialiser
                                    </Button>
                                )}
                            </div>

                            {showFilters && (
                                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                                    <Select
                                        value={filterValues.type ?? _}
                                        onValueChange={(v) => {
                                            const params = new URLSearchParams(window.location.search);
                                            if (v && v !== _) params.set('type', v); else params.delete('type');
                                            router.get(`/courriers/liste?${params.toString()}`, {}, { preserveState: true, replace: true });
                                        }}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Type de courrier" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={_}>Tous</SelectItem>
                                            <SelectItem value="ENT">Entrant</SelectItem>
                                            <SelectItem value="SOR">Sortant</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={filterValues.statut ?? _}
                                        onValueChange={(v) => {
                                            const params = new URLSearchParams(window.location.search);
                                            if (v && v !== _) params.set('statut', v); else params.delete('statut');
                                            router.get(`/courriers/liste?${params.toString()}`, {}, { preserveState: true, replace: true });
                                        }}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={_}>Tous</SelectItem>
                                            <SelectItem value="RECU">Reçu</SelectItem>
                                            {statuts.map((s) => <SelectItem key={s.code} value={s.code}>{s.nom}</SelectItem>)}
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={filterValues.urgence ?? _}
                                        onValueChange={(v) => {
                                            const params = new URLSearchParams(window.location.search);
                                            if (v && v !== _) params.set('urgence', v); else params.delete('urgence');
                                            router.get(`/courriers/liste?${params.toString()}`, {}, { preserveState: true, replace: true });
                                        }}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Urgence" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={_}>Toutes</SelectItem>
                                            <SelectItem value="Normal">Normal</SelectItem>
                                            <SelectItem value="Urgent">Urgent</SelectItem>
                                            <SelectItem value="TresUrgent">Très urgent</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={filterValues.service_id ?? _}
                                        onValueChange={(v) => {
                                            const params = new URLSearchParams(window.location.search);
                                            if (v && v !== _) params.set('service_id', v); else params.delete('service_id');
                                            router.get(`/courriers/liste?${params.toString()}`, {}, { preserveState: true, replace: true });
                                        }}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Service" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={_}>Tous</SelectItem>
                                            {filters.services.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.nom}</SelectItem>)}
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={filterValues.agent_id ?? _}
                                        onValueChange={(v) => {
                                            const params = new URLSearchParams(window.location.search);
                                            if (v && v !== _) params.set('agent_id', v); else params.delete('agent_id');
                                            router.get(`/courriers/liste?${params.toString()}`, {}, { preserveState: true, replace: true });
                                        }}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Agent" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={_}>Tous</SelectItem>
                                            {filters.agents.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.prenom} {a.nom}</SelectItem>)}
                                        </SelectContent>
                                    </Select>

                                    <button
                                        className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${filterValues.en_retard ? 'bg-red-50 border-red-200 text-red-700' : 'hover:bg-muted'}`}
                                        onClick={() => {
                                            const params = new URLSearchParams(window.location.search);
                                            if (filterValues.en_retard) params.delete('en_retard');
                                            else params.set('en_retard', '1');
                                            router.get(`/courriers/liste?${params.toString()}`, {}, { preserveState: true, replace: true });
                                        }}
                                    >
                                        <AlertTriangle className="h-4 w-4" />
                                        En retard uniquement
                                    </button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">Numéro</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Objet</TableHead>
                                    <TableHead>Categorie</TableHead>
                                    <TableHead>Urgence</TableHead>
                                    <TableHead>Service</TableHead>
                                    <TableHead>Agent</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead>Date réception</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {courriers.data.map((c) => (
                                    <TableRow
                                        key={c.id}
                                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => router.visit(`/courriers/${c.id}`)}
                                    >
                                        <TableCell className="font-mono text-sm font-medium">{c.numero}</TableCell>
                                        <TableCell>
                                            <Badge variant={c.type === 'ENT' ? 'secondary' : 'outline'}>{c.type === 'ENT' ? 'Entrant' : 'Sortant'}</Badge>
                                        </TableCell>
                                        <TableCell className="max-w-md truncate">{c.objet}</TableCell>
                                        <TableCell>{c.categorie ?? '—'}</TableCell>
                                        <TableCell>
                                            {c.urgence && <Badge className={URGENCE_COULEURS[c.urgence] ?? ''}>{c.urgence}</Badge>}
                                        </TableCell>
                                        <TableCell>{c.service?.nom ?? '—'}</TableCell>
                                        <TableCell>{c.agent?.nom ?? 'Non affecté'}</TableCell>
                                        <TableCell>
                                            <Badge style={{ backgroundColor: STATUT_COLORS[c.statut] ?? '#6b7280', color: '#fff' }}>
                                                {c.statutCourrier?.nom ?? c.statut}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">{c.date_reception ? formatDate(c.date_reception) : '—'}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); router.visit(`/courriers/${c.id}`); }}>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ open: true, courrier: c }); }}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {courriers.last_page > 1 && (
                    <div className="flex items-center justify-between px-2 py-4 text-sm text-muted-foreground">
                        <p>Page {courriers.current_page} sur {courriers.last_page} — {courriers.total} résultat{courriers.total > 1 ? 's' : ''}</p>
                        <div className="flex items-center gap-1">
                            <Button variant="outline" size="sm" disabled={courriers.current_page === 1}
                                onClick={() => { const params = new URLSearchParams(window.location.search); params.set('page', String(courriers.current_page - 1)); router.get(`/courriers/liste?${params.toString()}`, {}, { preserveState: true, replace: true }); }}
                            >Précédent</Button>
                            <Button variant="outline" size="sm" disabled={courriers.current_page === courriers.last_page}
                                onClick={() => { const params = new URLSearchParams(window.location.search); params.set('page', String(courriers.current_page + 1)); router.get(`/courriers/liste?${params.toString()}`, {}, { preserveState: true, replace: true }); }}
                            >Suivant</Button>
                        </div>
                    </div>
                )}

                <Dialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Confirmer la suppression</DialogTitle></DialogHeader>
                        <p className="py-4">
                            Êtes-vous sûr de vouloir supprimer le courrier{' '}
                            <strong>{deleteConfirm.courrier?.numero}</strong> — <em>{deleteConfirm.courrier?.objet}</em> ?
                            <br /><span className="text-sm text-red-600">Cette action est irréversible.</span>
                        </p>
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setDeleteConfirm({ open: false, courrier: null })}>Annuler</Button>
                            <Button variant="destructive" onClick={handleDeleteConfirm}>Supprimer</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}