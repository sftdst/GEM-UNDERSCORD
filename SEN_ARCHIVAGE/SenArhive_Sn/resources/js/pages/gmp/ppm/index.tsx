import { Head, router, useForm } from '@inertiajs/react';
import { CalendarDays, ClipboardList, Pencil, Plus, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Plan {
    id: string;
    version: number;
    statut: string;
    exercice?: { id: string; annee: number };
    createur?: { nom: string; prenom: string };
    created_at: string;
}

interface Exercice { id: string; annee: number; statut: string }

interface Props {
    plans: { data: Plan[]; total: number };
    exercices: Exercice[];
    filters: { search?: string; statut?: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'GMP', href: '/gmp' },
    { title: 'Plan de Passation (PPM)', href: '/gmp/ppm' },
];

const STATUTS_PPM = [
    { value: 'preparation',        label: 'Préparation',        cls: 'bg-gray-50 text-gray-600 border-gray-200' },
    { value: 'soumis',              label: 'Soumis',             cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    { value: 'en_revision',         label: 'En révision',        cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    { value: 'approuve',            label: 'Approuvé',           cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { value: 'publie',              label: 'Publié',             cls: 'bg-teal-50 text-teal-700 border-teal-200' },
    { value: 'en_cours_execution',  label: 'En exécution',       cls: 'bg-violet-50 text-violet-700 border-violet-200' },
    { value: 'cloture',             label: 'Clôturé',            cls: 'bg-slate-50 text-slate-600 border-slate-200' },
    { value: 'annule',              label: 'Annulé',             cls: 'bg-red-50 text-red-700 border-red-200' },
];

function statutCls(s: string) { return STATUTS_PPM.find(x => x.value === s)?.cls ?? 'bg-gray-50 text-gray-600 border-gray-200'; }
function statutLabel(s: string) { return STATUTS_PPM.find(x => x.value === s)?.label ?? s.replace(/_/g, ' '); }

// ── Modal créer ────────────────────────────────────────────────────────────

function CreateModal({ exercices, onClose }: { exercices: Exercice[]; onClose: () => void }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        exercice_id: exercices[0]?.id ?? '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/gmp/ppm', { onSuccess: () => { reset(); onClose(); } });
    }

    return (
        <form onSubmit={submit} className="space-y-5">
            {exercices.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    Aucun exercice budgétaire ouvert ou en préparation.{' '}
                    <a href="/gmp/admin/exercices" className="font-semibold underline">Créer un exercice</a> d'abord.
                </div>
            ) : (
                <div className="space-y-1.5">
                    <Label htmlFor="exercice_id">Exercice budgétaire <span className="text-destructive">*</span></Label>
                    <select
                        id="exercice_id"
                        value={data.exercice_id}
                        onChange={e => setData('exercice_id', e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        autoFocus
                    >
                        {exercices.map(ex => (
                            <option key={ex.id} value={ex.id}>{ex.annee} — {ex.statut}</option>
                        ))}
                    </select>
                    {errors.exercice_id && <p className="text-xs text-destructive">{errors.exercice_id}</p>}
                    <p className="text-xs text-muted-foreground">Le numéro de version sera calculé automatiquement.</p>
                </div>
            )}
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
                <Button type="submit" disabled={processing || exercices.length === 0}>
                    {processing ? 'Création...' : 'Créer le PPM'}
                </Button>
            </DialogFooter>
        </form>
    );
}

// ── Modal éditer ───────────────────────────────────────────────────────────

function EditModal({ plan, onClose }: { plan: Plan; onClose: () => void }) {
    const { data, setData, put, processing, errors, reset } = useForm({
        statut: plan.statut,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(`/gmp/ppm/${plan.id}`, { onSuccess: () => { reset(); onClose(); } });
    }

    return (
        <form onSubmit={submit} className="space-y-5">
            <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                <p className="font-semibold">PPM {plan.exercice?.annee ?? '—'} — Version {plan.version}</p>
                <p className="mt-1 text-muted-foreground">
                    Créé par {plan.createur?.prenom} {plan.createur?.nom}
                </p>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="statut">Statut</Label>
                <select
                    id="statut"
                    value={data.statut}
                    onChange={e => setData('statut', e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    autoFocus
                >
                    {STATUTS_PPM.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                {errors.statut && <p className="text-xs text-destructive">{errors.statut}</p>}
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
                <Button type="submit" disabled={processing}>
                    {processing ? 'Enregistrement...' : 'Mettre à jour'}
                </Button>
            </DialogFooter>
        </form>
    );
}

// ── Page principale ────────────────────────────────────────────────────────

export default function PpmIndex({ plans, exercices, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [statut, setStatut] = useState(filters.statut ?? '');
    const [modal, setModal]   = useState<'create' | Plan | null>(null);

    useEffect(() => {
        const t = setTimeout(() => {
            router.get('/gmp/ppm', { search, statut }, { preserveState: true, replace: true });
        }, 350);
        return () => clearTimeout(t);
    }, [search, statut]);

    const resetFilters = () => { setSearch(''); setStatut(''); };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Plan de Passation des Marchés" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">

                {/* En-tête */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                            <ClipboardList className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Plans de Passation des Marchés</h1>
                            <p className="text-sm text-muted-foreground">{plans.total} plan(s) enregistré(s)</p>
                        </div>
                    </div>
                    <Button onClick={() => setModal('create')} className="shrink-0">
                        <Plus className="mr-2 h-4 w-4" />Nouveau PPM
                    </Button>
                </div>

                {/* Filtres */}
                <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3">
                    <div className="relative flex-1 min-w-48">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            placeholder="Rechercher par année…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <select value={statut} onChange={e => setStatut(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                        <option value="">Tous les statuts</option>
                        {STATUTS_PPM.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    {(search || statut) && (
                        <Button size="sm" variant="ghost" onClick={resetFilters} className="gap-1.5 text-muted-foreground">
                            <X className="h-3.5 w-3.5" />Réinitialiser
                        </Button>
                    )}
                </div>

                {/* Grille */}
                {plans.data.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed">
                        <div className="py-16 text-center">
                            <ClipboardList className="mx-auto mb-4 h-14 w-14 text-muted-foreground/25" />
                            <h3 className="text-base font-semibold">Aucun plan de passation</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Créez le premier PPM de votre organisation.</p>
                            <Button className="mt-5" onClick={() => setModal('create')}>
                                <Plus className="mr-2 h-4 w-4" />Nouveau PPM
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {plans.data.map(plan => (
                            <div key={plan.id} className="group relative flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                        <CalendarDays className="h-5 w-5 text-primary" />
                                    </div>
                                    <Badge className={`text-xs ${statutCls(plan.statut)}`} variant="outline">
                                        {statutLabel(plan.statut)}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="font-bold text-base">
                                        PPM {plan.exercice?.annee ?? '—'}
                                        <span className="ml-1.5 text-sm font-normal text-muted-foreground">v{plan.version}</span>
                                    </p>
                                    {plan.createur && (
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {plan.createur.prenom} {plan.createur.nom}
                                        </p>
                                    )}
                                </div>
                                <div className="flex justify-end border-t pt-3 mt-auto">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 gap-1.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => setModal(plan)}
                                    >
                                        <Pencil className="h-3 w-3" />Modifier
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal créer */}
            <Dialog open={modal === 'create'} onOpenChange={open => !open && setModal(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ClipboardList className="h-5 w-5 text-primary" />
                            Nouveau Plan de Passation
                        </DialogTitle>
                    </DialogHeader>
                    <CreateModal exercices={exercices} onClose={() => setModal(null)} />
                </DialogContent>
            </Dialog>

            {/* Modal éditer */}
            <Dialog open={typeof modal === 'object' && modal !== null} onOpenChange={open => !open && setModal(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pencil className="h-4 w-4" />
                            Modifier le PPM
                        </DialogTitle>
                    </DialogHeader>
                    {typeof modal === 'object' && modal !== null && (
                        <EditModal key={modal.id} plan={modal} onClose={() => setModal(null)} />
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
