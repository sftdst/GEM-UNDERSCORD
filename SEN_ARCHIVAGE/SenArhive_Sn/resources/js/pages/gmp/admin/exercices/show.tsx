import { Head, Link, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    CalendarRange,
    Layers,
    Pencil,
    Plus,
    Trash2,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Secteur {
    id: string;
    code: string;
    libelle: string;
    couleur: string | null;
}

interface Enveloppe {
    id: string;
    secteur_id: string;
    montant_alloue: string;
    montant_engage: string;
    secteur: Secteur;
}

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
    exercice: Exercice;
    enveloppes: Enveloppe[];
    secteurs_dispo: Secteur[];
    total_alloue: number;
    total_engage: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const STATUTS = [
    { value: 'preparation', label: 'Préparation', cls: 'bg-gray-100 text-gray-700 border-gray-200' },
    { value: 'ouvert',      label: 'Ouvert',      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { value: 'cloture',     label: 'Clôturé',     cls: 'bg-slate-100 text-slate-600 border-slate-200' },
];

function fmt(val: string | number | null) {
    if (val === null || val === '' || Number(val) === 0) return '—';
    return new Intl.NumberFormat('fr-SN', { maximumFractionDigits: 0 }).format(Number(val)) + ' FCFA';
}

function pct(val: number, total: number): number {
    if (!total) return 0;
    return Math.min(100, Math.round((val / total) * 100));
}

function statutCls(s: string) {
    return STATUTS.find(x => x.value === s)?.cls ?? 'bg-gray-100 text-gray-600';
}
function statutLabel(s: string) {
    return STATUTS.find(x => x.value === s)?.label ?? s;
}

// ── KPI card ───────────────────────────────────────────────────────────────────

function KpiCard({
    label,
    value,
    sub,
    icon: Icon,
    color,
}: {
    label: string;
    value: string;
    sub?: string;
    icon: React.ElementType;
    color: string;
}) {
    return (
        <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="truncate text-base font-bold tabular-nums">{value}</p>
                {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
            </div>
        </div>
    );
}

// ── Modal enveloppe (create / edit) ───────────────────────────────────────────

interface EnvModalProps {
    exerciceId: string;
    enveloppe?: Enveloppe | null;
    secteursDispo: Secteur[];
    onClose: () => void;
}

function EnveloppeModal({ exerciceId, enveloppe, secteursDispo, onClose }: EnvModalProps) {
    const editing = !!enveloppe;

    const { data, setData, post, put, processing, errors, reset } = useForm({
        secteur_id:     enveloppe?.secteur_id ?? (secteursDispo[0]?.id ?? ''),
        montant_alloue: enveloppe?.montant_alloue ?? '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            put(`/gmp/admin/exercices/${exerciceId}/enveloppes/${enveloppe!.id}`, {
                onSuccess: () => { reset(); onClose(); },
            });
        } else {
            post(`/gmp/admin/exercices/${exerciceId}/enveloppes`, {
                onSuccess: () => { reset(); onClose(); },
            });
        }
    }

    return (
        <form onSubmit={submit} className="space-y-5">
            {!editing && (
                <div className="space-y-1.5">
                    <Label>Secteur d'intervention <span className="text-destructive">*</span></Label>
                    {secteursDispo.length === 0 ? (
                        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                            Tous les secteurs actifs ont déjà une enveloppe pour cet exercice.
                        </p>
                    ) : (
                        <select
                            value={data.secteur_id}
                            onChange={e => setData('secteur_id', e.target.value)}
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            autoFocus
                        >
                            {secteursDispo.map(s => (
                                <option key={s.id} value={s.id}>{s.libelle} ({s.code})</option>
                            ))}
                        </select>
                    )}
                    {errors.secteur_id && <p className="text-xs text-destructive">{errors.secteur_id}</p>}
                </div>
            )}

            {editing && (
                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
                    <div
                        className="h-7 w-7 shrink-0 rounded-md"
                        style={{ backgroundColor: enveloppe!.secteur.couleur ?? '#6366f1' }}
                    />
                    <div>
                        <p className="text-sm font-semibold">{enveloppe!.secteur.libelle}</p>
                        <p className="text-xs font-mono text-muted-foreground">{enveloppe!.secteur.code}</p>
                    </div>
                </div>
            )}

            <div className="space-y-1.5">
                <Label>Montant alloué (FCFA) <span className="text-destructive">*</span></Label>
                <Input
                    type="number"
                    min={0}
                    step={1000}
                    value={data.montant_alloue}
                    onChange={e => setData('montant_alloue', e.target.value)}
                    placeholder="Ex. : 50 000 000"
                    autoFocus={editing}
                />
                {errors.montant_alloue && <p className="text-xs text-destructive">{errors.montant_alloue}</p>}
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
                <Button
                    type="submit"
                    disabled={processing || (!editing && secteursDispo.length === 0)}
                >
                    {processing ? 'Enregistrement...' : editing ? 'Mettre à jour' : "Créer l'enveloppe"}
                </Button>
            </DialogFooter>
        </form>
    );
}

// ── Page principale ────────────────────────────────────────────────────────────

export default function ExerciceShow({
    exercice,
    enveloppes,
    secteurs_dispo,
    total_alloue,
    total_engage,
}: Props) {
    const [modal, setModal] = useState<'create' | Enveloppe | null>(null);
    const { delete: destroy } = useForm();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'GMP', href: '/gmp' },
        { title: 'Exercices budgétaires', href: '/gmp/admin/exercices' },
        { title: String(exercice.annee), href: `/gmp/admin/exercices/${exercice.id}` },
    ];

    const budgetGlobal    = Number(exercice.budget_global ?? 0);
    const pctAlloue       = pct(total_alloue, budgetGlobal);
    const pctEngage       = pct(total_engage, budgetGlobal);
    const budgetRestant   = budgetGlobal - total_alloue;
    const allBudgetUsed   = budgetGlobal > 0 && total_alloue >= budgetGlobal;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Exercice ${exercice.annee} — Enveloppes`} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">

                {/* ── En-tête ── */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/gmp/admin/exercices"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-card text-muted-foreground transition-colors hover:bg-muted"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100">
                            <CalendarRange className="h-5 w-5 text-sky-600" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h1 className="text-xl font-bold tracking-tight">
                                    Exercice budgétaire {exercice.annee}
                                </h1>
                                <Badge className={`text-xs ${statutCls(exercice.statut)}`} variant="outline">
                                    {statutLabel(exercice.statut)}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Gestion des enveloppes sectorielles · {enveloppes.length} secteur(s) alloué(s)
                            </p>
                        </div>
                    </div>
                    <Button onClick={() => setModal('create')} className="shrink-0" disabled={secteurs_dispo.length === 0 && enveloppes.length > 0}>
                        <Plus className="mr-2 h-4 w-4" />Nouvelle enveloppe
                    </Button>
                </div>

                {/* ── KPIs ── */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <KpiCard
                        label="Budget global"
                        value={fmt(exercice.budget_global)}
                        icon={Wallet}
                        color="bg-sky-100 text-sky-600"
                    />
                    <KpiCard
                        label="Total alloué"
                        value={fmt(total_alloue)}
                        sub={budgetGlobal > 0 ? `${pctAlloue}% du budget` : undefined}
                        icon={Layers}
                        color="bg-violet-100 text-violet-600"
                    />
                    <KpiCard
                        label="Total engagé"
                        value={fmt(total_engage)}
                        sub={total_alloue > 0 ? `${pct(total_engage, total_alloue)}% de l'alloué` : undefined}
                        icon={TrendingUp}
                        color="bg-amber-100 text-amber-600"
                    />
                    <KpiCard
                        label="Budget restant"
                        value={budgetGlobal > 0 ? fmt(budgetRestant) : '—'}
                        sub={budgetGlobal > 0 ? `${100 - pctAlloue}% disponible` : 'Budget non défini'}
                        icon={allBudgetUsed ? AlertCircle : Wallet}
                        color={allBudgetUsed ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}
                    />
                </div>

                {/* ── Barre de couverture budgétaire ── */}
                {budgetGlobal > 0 && (
                    <div className="rounded-xl border bg-card p-4 shadow-sm">
                        <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="font-medium">Couverture budgétaire</span>
                            <span className="text-muted-foreground tabular-nums">
                                {fmt(total_alloue)} / {fmt(budgetGlobal)}
                            </span>
                        </div>
                        <div className="relative h-3 overflow-hidden rounded-full bg-muted">
                            {/* Alloué */}
                            <div
                                className="absolute inset-y-0 left-0 rounded-full bg-violet-500 transition-all"
                                style={{ width: `${pctAlloue}%` }}
                            />
                            {/* Engagé (par-dessus, plus foncé) */}
                            <div
                                className="absolute inset-y-0 left-0 rounded-full bg-amber-400 transition-all"
                                style={{ width: `${pctEngage}%` }}
                            />
                        </div>
                        <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
                                Alloué ({pctAlloue}%)
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                                Engagé ({pctEngage}%)
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
                                Disponible ({100 - pctAlloue}%)
                            </span>
                        </div>
                    </div>
                )}

                {/* ── Tableau des enveloppes ── */}
                {enveloppes.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed">
                        <div className="py-16 text-center">
                            <Layers className="mx-auto mb-4 h-14 w-14 text-muted-foreground/25" />
                            <h3 className="text-base font-semibold">Aucune enveloppe sectorielle</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Allouez un budget à chaque secteur d'intervention.
                            </p>
                            <Button className="mt-5" onClick={() => setModal('create')}>
                                <Plus className="mr-2 h-4 w-4" />Nouvelle enveloppe
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border shadow-sm">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/40">
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Secteur</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Alloué</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Engagé</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Disponible</th>
                                    <th className="px-4 py-3 w-48 font-medium text-muted-foreground">Avancement</th>
                                    <th className="px-4 py-3 w-20" />
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {enveloppes.map(env => {
                                    const alloue    = Number(env.montant_alloue);
                                    const engage    = Number(env.montant_engage);
                                    const dispo     = alloue - engage;
                                    const pctEng    = pct(engage, alloue);
                                    const isRed     = pctEng >= 90;
                                    const isOrange  = !isRed && pctEng >= 70;

                                    return (
                                        <tr key={env.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="h-7 w-7 shrink-0 rounded-md"
                                                        style={{ backgroundColor: env.secteur.couleur ?? '#6366f1' }}
                                                    />
                                                    <div>
                                                        <p className="font-medium">{env.secteur.libelle}</p>
                                                        <p className="text-xs font-mono text-muted-foreground">{env.secteur.code}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums font-medium">
                                                {fmt(env.montant_alloue)}
                                            </td>
                                            <td className={`px-4 py-3 text-right tabular-nums ${isRed ? 'text-red-600 font-semibold' : isOrange ? 'text-amber-600' : 'text-muted-foreground'}`}>
                                                {fmt(env.montant_engage)}
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                                                {fmt(dispo)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${
                                                                isRed ? 'bg-red-500' : isOrange ? 'bg-amber-400' : 'bg-emerald-500'
                                                            }`}
                                                            style={{ width: `${pctEng}%` }}
                                                        />
                                                    </div>
                                                    <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
                                                        {pctEng}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-7 w-7"
                                                        onClick={() => setModal(env)}
                                                        title="Modifier"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    {engage === 0 && (
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-7 w-7 text-destructive hover:text-destructive"
                                                            onClick={() => destroy(
                                                                `/gmp/admin/exercices/${exercice.id}/enveloppes/${env.id}`
                                                            )}
                                                            title="Supprimer"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>

                            {/* Ligne de total */}
                            {enveloppes.length > 1 && (
                                <tfoot>
                                    <tr className="border-t-2 bg-muted/20">
                                        <td className="px-4 py-3 font-bold">Total</td>
                                        <td className="px-4 py-3 text-right tabular-nums font-bold">{fmt(total_alloue)}</td>
                                        <td className="px-4 py-3 text-right tabular-nums font-bold text-muted-foreground">{fmt(total_engage)}</td>
                                        <td className="px-4 py-3 text-right tabular-nums font-bold text-muted-foreground">{fmt(total_alloue - total_engage)}</td>
                                        <td className="px-4 py-3" colSpan={2} />
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                )}
            </div>

            {/* ── Modal ── */}
            <Dialog open={modal !== null} onOpenChange={open => !open && setModal(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Layers className="h-5 w-5 text-violet-600" />
                            {modal === 'create' ? 'Nouvelle enveloppe sectorielle' : 'Modifier l\'enveloppe'}
                        </DialogTitle>
                    </DialogHeader>
                    <EnveloppeModal
                        key={typeof modal === 'object' && modal !== null ? modal.id : 'create'}
                        exerciceId={exercice.id}
                        enveloppe={modal !== 'create' ? modal : null}
                        secteursDispo={secteurs_dispo}
                        onClose={() => setModal(null)}
                    />
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
