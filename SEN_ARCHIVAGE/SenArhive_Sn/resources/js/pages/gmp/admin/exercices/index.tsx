import { Head, router, useForm } from '@inertiajs/react';
import {
    ArrowUpDown,
    CalendarDays,
    CalendarRange,
    Pencil,
    Plus,
    Search,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Exercice {
    id: string;
    annee: number;
    libelle: string;
    budget_global: string | null;
    statut: string;
    date_ouverture: string | null;
    date_cloture: string | null;
}

interface Props {
    exercices: Exercice[];
    filters: { search?: string; statut?: string };
}

// ── Constantes ─────────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'GMP', href: '/gmp' },
    { title: 'Paramétrage', href: '/gmp/admin/exercices' },
    { title: 'Exercices budgétaires', href: '/gmp/admin/exercices' },
];

const STATUTS = [
    { value: 'preparation', label: 'Préparation', cls: 'bg-gray-100 text-gray-700 border-gray-200' },
    { value: 'ouvert',      label: 'Ouvert',      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { value: 'cloture',     label: 'Clôturé',     cls: 'bg-slate-100 text-slate-600 border-slate-200' },
];

function statutCls(s: string)   { return STATUTS.find(x => x.value === s)?.cls ?? 'bg-gray-100 text-gray-600'; }
function statutLabel(s: string) { return STATUTS.find(x => x.value === s)?.label ?? s; }

function fmtBudget(val: string | null) {
    if (!val || Number(val) === 0) return '—';
    return new Intl.NumberFormat('fr-SN', { maximumFractionDigits: 0 }).format(Number(val)) + ' FCFA';
}

function fmtDate(val: string | null) {
    if (!val) return '—';
    return new Date(val).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Modal Créer / Modifier ─────────────────────────────────────────────────────

function ExerciceModal({
    exercice,
    onClose,
}: {
    exercice?: Exercice | null;
    onClose: () => void;
}) {
    const editing = !!exercice;
    const { data, setData, post, put, processing, errors, reset } = useForm({
        annee:          exercice?.annee ?? new Date().getFullYear() + 1,
        budget_global:  exercice?.budget_global ?? '',
        statut:         exercice?.statut ?? 'preparation',
        date_ouverture: exercice?.date_ouverture ?? '',
        date_cloture:   exercice?.date_cloture ?? '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            put(`/gmp/admin/exercices/${exercice!.id}`, {
                onSuccess: () => { reset(); onClose(); },
            });
        } else {
            post('/gmp/admin/exercices', {
                onSuccess: () => { reset(); onClose(); },
            });
        }
    }

    return (
        <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
                {/* Année */}
                <div className="space-y-1.5">
                    <Label htmlFor="annee">
                        Année budgétaire <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="annee"
                        type="number"
                        min={2000}
                        max={2100}
                        value={data.annee}
                        onChange={e => setData('annee', Number(e.target.value))}
                        autoFocus
                    />
                    {errors.annee && <p className="text-xs text-destructive">{errors.annee}</p>}
                </div>

                {/* Statut */}
                <div className="space-y-1.5">
                    <Label htmlFor="statut">
                        Statut <span className="text-destructive">*</span>
                    </Label>
                    <select
                        id="statut"
                        value={data.statut}
                        onChange={e => setData('statut', e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                        {STATUTS.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                    {errors.statut && <p className="text-xs text-destructive">{errors.statut}</p>}
                </div>

                {/* Budget global */}
                <div className="sm:col-span-2 space-y-1.5">
                    <Label htmlFor="budget_global">Budget global (FCFA)</Label>
                    <Input
                        id="budget_global"
                        type="number"
                        min={0}
                        step={1000}
                        value={data.budget_global ?? ''}
                        onChange={e => setData('budget_global', e.target.value)}
                        placeholder="Ex. : 500 000 000"
                    />
                    {errors.budget_global && <p className="text-xs text-destructive">{errors.budget_global}</p>}
                </div>

                {/* Dates */}
                <div className="space-y-1.5">
                    <Label htmlFor="date_ouverture">Date d'ouverture</Label>
                    <Input
                        id="date_ouverture"
                        type="date"
                        value={data.date_ouverture ?? ''}
                        onChange={e => setData('date_ouverture', e.target.value)}
                    />
                    {errors.date_ouverture && <p className="text-xs text-destructive">{errors.date_ouverture}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="date_cloture">Date de clôture</Label>
                    <Input
                        id="date_cloture"
                        type="date"
                        value={data.date_cloture ?? ''}
                        onChange={e => setData('date_cloture', e.target.value)}
                    />
                    {errors.date_cloture && <p className="text-xs text-destructive">{errors.date_cloture}</p>}
                </div>
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                    Annuler
                </Button>
                <Button type="submit" disabled={processing}>
                    {processing
                        ? 'Enregistrement...'
                        : editing ? 'Mettre à jour' : "Créer l'exercice"}
                </Button>
            </DialogFooter>
        </form>
    );
}

// ── Page principale ────────────────────────────────────────────────────────────

type SortDir = 'desc' | 'asc';

export default function ExercicesIndex({ exercices, filters }: Props) {
    const [search, setSearch]   = useState(filters.search ?? '');
    const [statut, setStatut]   = useState(filters.statut ?? '');
    const [sortDir, setSortDir] = useState<SortDir>('desc');
    const [modal, setModal]     = useState<'create' | Exercice | null>(null);

    // Filtre + tri côté client (liste courte)
    const displayed = useMemo(() => {
        let list = [...exercices];
        if (search) list = list.filter(e => String(e.annee).includes(search));
        if (statut) list = list.filter(e => e.statut === statut);
        list.sort((a, b) => sortDir === 'desc' ? b.annee - a.annee : a.annee - b.annee);
        return list;
    }, [exercices, search, statut, sortDir]);

    const hasFilters = !!(search || statut);
    const resetFilters = () => { setSearch(''); setStatut(''); };

    const openCreate = () => setModal('create');
    const openEdit   = (ex: Exercice) => setModal(ex);
    const closeModal = () => setModal(null);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Exercices budgétaires" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">

                {/* ── En-tête ── */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100">
                            <CalendarRange className="h-5 w-5 text-sky-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Exercices budgétaires</h1>
                            <p className="text-sm text-muted-foreground">
                                {exercices.length} exercice(s) enregistré(s)
                            </p>
                        </div>
                    </div>
                    <Button onClick={openCreate} className="shrink-0">
                        <Plus className="mr-2 h-4 w-4" />Nouvel exercice
                    </Button>
                </div>

                {/* ── Filtres ── */}
                <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3">
                    {/* Recherche année */}
                    <div className="relative flex-1 min-w-40">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            className="pl-9 bg-background"
                            placeholder="Rechercher une année…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Filtre statut */}
                    <select
                        value={statut}
                        onChange={e => setStatut(e.target.value)}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                        <option value="">Tous les statuts</option>
                        {STATUTS.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>

                    {/* Tri année */}
                    <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
                    >
                        <ArrowUpDown className="h-3.5 w-3.5" />
                        Année {sortDir === 'desc' ? '↓ Récent' : '↑ Ancien'}
                    </Button>

                    {/* Réinitialiser */}
                    {hasFilters && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={resetFilters}
                            className="gap-1.5 text-muted-foreground"
                        >
                            <X className="h-3.5 w-3.5" />Réinitialiser
                        </Button>
                    )}
                </div>

                {/* ── Tableau ── */}
                {displayed.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed">
                        <div className="py-16 text-center">
                            <CalendarDays className="mx-auto mb-4 h-14 w-14 text-muted-foreground/25" />
                            <h3 className="text-base font-semibold">
                                {hasFilters ? 'Aucun résultat' : 'Aucun exercice budgétaire'}
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {hasFilters
                                    ? 'Modifiez vos critères de recherche.'
                                    : 'Créez le premier exercice budgétaire de votre organisation.'}
                            </p>
                            {!hasFilters && (
                                <Button className="mt-5" onClick={openCreate}>
                                    <Plus className="mr-2 h-4 w-4" />Nouvel exercice
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border shadow-sm">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/40">
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                        <button
                                            className="flex items-center gap-1 hover:text-foreground"
                                            onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
                                        >
                                            Année
                                            <ArrowUpDown className="h-3 w-3" />
                                        </button>
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Budget global</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ouverture</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Clôture</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
                                    <th className="px-4 py-3 w-12" />
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {displayed.map(ex => (
                                    <tr key={ex.id} className="hover:bg-muted/30 transition-colors group">
                                        <td className="px-4 py-3">
                                            <span className="font-bold tabular-nums text-base">{ex.annee}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                                            {fmtBudget(ex.budget_global)}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{fmtDate(ex.date_ouverture)}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{fmtDate(ex.date_cloture)}</td>
                                        <td className="px-4 py-3">
                                            <Badge
                                                className={`text-xs ${statutCls(ex.statut)}`}
                                                variant="outline"
                                            >
                                                {statutLabel(ex.statut)}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => openEdit(ex)}
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Modal Créer / Modifier ── */}
            <Dialog open={modal !== null} onOpenChange={open => !open && closeModal()}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CalendarRange className="h-5 w-5 text-sky-600" />
                            {modal === 'create'
                                ? 'Nouvel exercice budgétaire'
                                : `Modifier l'exercice ${typeof modal === 'object' && modal ? modal.annee : ''}`}
                        </DialogTitle>
                    </DialogHeader>
                    <ExerciceModal
                        key={typeof modal === 'object' && modal !== null ? modal.id : 'create'}
                        exercice={modal !== 'create' ? modal : null}
                        onClose={closeModal}
                    />
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
