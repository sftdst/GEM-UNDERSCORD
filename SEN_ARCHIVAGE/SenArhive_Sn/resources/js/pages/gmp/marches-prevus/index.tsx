import { Head, router, useForm } from '@inertiajs/react';
import {
    CalendarDays,
    ListChecks,
    Pencil,
    Plus,
    Search,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
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

interface Ref { id: string; libelle: string }
interface RefColor extends Ref { couleur: string | null }

interface Plan {
    id: string;
    reference: string;
    version: number;
    statut: string;
    exercice?: { id: string; annee: number };
}

interface MarchePrevu {
    id: string;
    numero: string;
    objet: string;
    statut: string;
    montant_previsionnel: string;
    date_lancement_prevue: string | null;
    date_attribution_prevue: string | null;
    date_debut_prevue: string | null;
    date_fin_prevue: string | null;
    duree_prevue_jours: number | null;
    observations: string | null;
    plan_id: string;
    type_marche_id: string;
    mode_passation_id: string;
    source_financement_id: string;
    secteur_id: string;
    plan?: Plan;
    type_marche?: Ref;
    mode_passation?: Ref;
    secteur?: RefColor;
    source_financement?: Ref;
}

interface Props {
    marches_prevus: { data: MarchePrevu[]; total: number };
    plans: Plan[];
    types_marche: Ref[];
    modes_passation: Ref[];
    secteurs: RefColor[];
    sources: Ref[];
    filters: { search?: string; statut?: string; plan_id?: string; secteur_id?: string };
}

// ── Constantes ─────────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'GMP', href: '/gmp' },
    { title: 'Planification', href: '/gmp/ppm' },
    { title: 'Marchés prévus', href: '/gmp/marches-prevus' },
];

const STATUTS = [
    { value: 'planifie',     label: 'Planifié',      cls: 'bg-slate-50 text-slate-600 border-slate-200' },
    { value: 'lance',        label: 'Lancé',          cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    { value: 'attribue',     label: 'Attribué',       cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { value: 'en_execution', label: 'En exécution',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { value: 'solde',        label: 'Soldé',           cls: 'bg-teal-50 text-teal-700 border-teal-200' },
    { value: 'annule',       label: 'Annulé',          cls: 'bg-red-50 text-red-600 border-red-200' },
];

function statutCls(s: string)   { return STATUTS.find(x => x.value === s)?.cls ?? 'bg-gray-100 text-gray-600'; }
function statutLabel(s: string) { return STATUTS.find(x => x.value === s)?.label ?? s.replace(/_/g, ' '); }

function fmtMontant(val: string | null) {
    if (!val || Number(val) === 0) return '—';
    return new Intl.NumberFormat('fr-SN', { maximumFractionDigits: 0 }).format(Number(val)) + ' FCFA';
}

function fmtDate(val: string | null) {
    if (!val) return '—';
    return new Date(val).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function planLabel(plan: Plan) {
    return `${plan.reference} — ${plan.exercice?.annee ?? '?'}`;
}

// ── Formulaire (create + edit) ─────────────────────────────────────────────────

interface FormFields {
    plan_id: string;
    numero: string;
    objet: string;
    description: string;
    type_marche_id: string;
    mode_passation_id: string;
    source_financement_id: string;
    secteur_id: string;
    montant_previsionnel: string;
    date_lancement_prevue: string;
    date_attribution_prevue: string;
    date_debut_prevue: string;
    date_fin_prevue: string;
    duree_prevue_jours: string;
    statut: string;
    observations: string;
}

function MarcheModal({
    marche,
    plans,
    typesMarche,
    modesPassation,
    secteurs,
    sources,
    onClose,
}: {
    marche?: MarchePrevu | null;
    plans: Plan[];
    typesMarche: Ref[];
    modesPassation: Ref[];
    secteurs: RefColor[];
    sources: Ref[];
    onClose: () => void;
}) {
    const editing = !!marche;

    const { data, setData, post, put, processing, errors, reset } = useForm<FormFields>({
        plan_id:               marche?.plan_id               ?? plans[0]?.id ?? '',
        numero:                marche?.numero                ?? '',
        objet:                 marche?.objet                 ?? '',
        description:           '',
        type_marche_id:        marche?.type_marche_id        ?? typesMarche[0]?.id ?? '',
        mode_passation_id:     marche?.mode_passation_id     ?? modesPassation[0]?.id ?? '',
        source_financement_id: marche?.source_financement_id ?? sources[0]?.id ?? '',
        secteur_id:            marche?.secteur_id            ?? secteurs[0]?.id ?? '',
        montant_previsionnel:  marche?.montant_previsionnel  ?? '',
        date_lancement_prevue: marche?.date_lancement_prevue  ? marche.date_lancement_prevue.substring(0, 10) : '',
        date_attribution_prevue: marche?.date_attribution_prevue ? marche.date_attribution_prevue.substring(0, 10) : '',
        date_debut_prevue:     marche?.date_debut_prevue      ? marche.date_debut_prevue.substring(0, 10) : '',
        date_fin_prevue:       marche?.date_fin_prevue         ? marche.date_fin_prevue.substring(0, 10) : '',
        duree_prevue_jours:    marche?.duree_prevue_jours != null ? String(marche.duree_prevue_jours) : '',
        statut:                marche?.statut                ?? 'planifie',
        observations:          marche?.observations           ?? '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            put(`/gmp/marches-prevus/${marche!.id}`, { onSuccess: () => { reset(); onClose(); } });
        } else {
            post('/gmp/marches-prevus', { onSuccess: () => { reset(); onClose(); } });
        }
    }

    const sel = 'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring';

    return (
        <form onSubmit={submit} className="space-y-5">

            {/* Ligne 1 : PPM + Numéro */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="plan_id">PPM <span className="text-destructive">*</span></Label>
                    <select id="plan_id" value={data.plan_id} onChange={e => setData('plan_id', e.target.value)} className={sel} autoFocus>
                        <option value="">— Sélectionner —</option>
                        {plans.map(p => <option key={p.id} value={p.id}>{planLabel(p)}</option>)}
                    </select>
                    {errors.plan_id && <p className="text-xs text-destructive">{errors.plan_id}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="numero">Numéro <span className="text-destructive">*</span></Label>
                    <Input id="numero" value={data.numero} onChange={e => setData('numero', e.target.value)} placeholder="MP-2025-001" />
                    {errors.numero && <p className="text-xs text-destructive">{errors.numero}</p>}
                </div>
            </div>

            {/* Objet */}
            <div className="space-y-1.5">
                <Label htmlFor="objet">Objet du marché <span className="text-destructive">*</span></Label>
                <Input id="objet" value={data.objet} onChange={e => setData('objet', e.target.value)} placeholder="Objet du marché…" />
                {errors.objet && <p className="text-xs text-destructive">{errors.objet}</p>}
            </div>

            {/* Ligne 2 : Type + Mode */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="type_marche_id">Type de marché <span className="text-destructive">*</span></Label>
                    <select id="type_marche_id" value={data.type_marche_id} onChange={e => setData('type_marche_id', e.target.value)} className={sel}>
                        <option value="">— Sélectionner —</option>
                        {typesMarche.map(t => <option key={t.id} value={t.id}>{t.libelle}</option>)}
                    </select>
                    {errors.type_marche_id && <p className="text-xs text-destructive">{errors.type_marche_id}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="mode_passation_id">Mode de passation <span className="text-destructive">*</span></Label>
                    <select id="mode_passation_id" value={data.mode_passation_id} onChange={e => setData('mode_passation_id', e.target.value)} className={sel}>
                        <option value="">— Sélectionner —</option>
                        {modesPassation.map(m => <option key={m.id} value={m.id}>{m.libelle}</option>)}
                    </select>
                    {errors.mode_passation_id && <p className="text-xs text-destructive">{errors.mode_passation_id}</p>}
                </div>
            </div>

            {/* Ligne 3 : Secteur + Source */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="secteur_id">Secteur <span className="text-destructive">*</span></Label>
                    <select id="secteur_id" value={data.secteur_id} onChange={e => setData('secteur_id', e.target.value)} className={sel}>
                        <option value="">— Sélectionner —</option>
                        {secteurs.map(s => <option key={s.id} value={s.id}>{s.libelle}</option>)}
                    </select>
                    {errors.secteur_id && <p className="text-xs text-destructive">{errors.secteur_id}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="source_financement_id">Source de financement <span className="text-destructive">*</span></Label>
                    <select id="source_financement_id" value={data.source_financement_id} onChange={e => setData('source_financement_id', e.target.value)} className={sel}>
                        <option value="">— Sélectionner —</option>
                        {sources.map(s => <option key={s.id} value={s.id}>{s.libelle}</option>)}
                    </select>
                    {errors.source_financement_id && <p className="text-xs text-destructive">{errors.source_financement_id}</p>}
                </div>
            </div>

            {/* Montant */}
            <div className="space-y-1.5">
                <Label htmlFor="montant_previsionnel">Montant prévisionnel (FCFA) <span className="text-destructive">*</span></Label>
                <Input id="montant_previsionnel" type="number" min="0" step="1000" value={data.montant_previsionnel} onChange={e => setData('montant_previsionnel', e.target.value)} placeholder="0" />
                {errors.montant_previsionnel && <p className="text-xs text-destructive">{errors.montant_previsionnel}</p>}
            </div>

            {/* Ligne 4 : Dates */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="date_lancement_prevue">Date lancement prévue <span className="text-destructive">*</span></Label>
                    <Input id="date_lancement_prevue" type="date" value={data.date_lancement_prevue} onChange={e => setData('date_lancement_prevue', e.target.value)} />
                    {errors.date_lancement_prevue && <p className="text-xs text-destructive">{errors.date_lancement_prevue}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="date_attribution_prevue">Date attribution prévue</Label>
                    <Input id="date_attribution_prevue" type="date" value={data.date_attribution_prevue} onChange={e => setData('date_attribution_prevue', e.target.value)} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="date_debut_prevue">Date début prévue</Label>
                    <Input id="date_debut_prevue" type="date" value={data.date_debut_prevue} onChange={e => setData('date_debut_prevue', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="date_fin_prevue">Date fin prévue</Label>
                    <Input id="date_fin_prevue" type="date" value={data.date_fin_prevue} onChange={e => setData('date_fin_prevue', e.target.value)} />
                </div>
            </div>

            {/* Ligne 5 : Durée + Statut (édition) */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="duree_prevue_jours">Durée prévue (jours)</Label>
                    <Input id="duree_prevue_jours" type="number" min="1" value={data.duree_prevue_jours} onChange={e => setData('duree_prevue_jours', e.target.value)} placeholder="Ex: 180" />
                </div>
                {editing && (
                    <div className="space-y-1.5">
                        <Label htmlFor="statut">Statut</Label>
                        <select id="statut" value={data.statut} onChange={e => setData('statut', e.target.value)} className={sel}>
                            {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                        {errors.statut && <p className="text-xs text-destructive">{errors.statut}</p>}
                    </div>
                )}
            </div>

            {/* Observations */}
            <div className="space-y-1.5">
                <Label htmlFor="observations">Observations</Label>
                <textarea
                    id="observations"
                    rows={2}
                    value={data.observations}
                    onChange={e => setData('observations', e.target.value)}
                    placeholder="Remarques ou précisions…"
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
                <Button type="submit" disabled={processing}>
                    {processing ? 'Enregistrement…' : editing ? 'Mettre à jour' : 'Créer le marché'}
                </Button>
            </DialogFooter>
        </form>
    );
}

// ── Page principale ────────────────────────────────────────────────────────────

export default function MarchesPrevusIndex({
    marches_prevus,
    plans,
    types_marche,
    modes_passation,
    secteurs,
    sources,
    filters,
}: Props) {
    const [search,    setSearch]    = useState(filters.search    ?? '');
    const [statut,    setStatut]    = useState(filters.statut    ?? '');
    const [planId,    setPlanId]    = useState(filters.plan_id   ?? '');
    const [secteurId, setSecteurId] = useState(filters.secteur_id ?? '');
    const [modal,     setModal]     = useState<'create' | MarchePrevu | null>(null);

    useEffect(() => {
        const t = setTimeout(() => {
            router.get('/gmp/marches-prevus', { search, statut, plan_id: planId, secteur_id: secteurId }, { preserveState: true, replace: true });
        }, 350);
        return () => clearTimeout(t);
    }, [search, statut, planId, secteurId]);

    const resetFilters = () => { setSearch(''); setStatut(''); setPlanId(''); setSecteurId(''); };
    const hasFilters = search || statut || planId || secteurId;

    const sel = 'h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Marchés prévus" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">

                {/* En-tête */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                            <ListChecks className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Marchés prévus</h1>
                            <p className="text-sm text-muted-foreground">{marches_prevus.total} marché(s) planifié(s)</p>
                        </div>
                    </div>
                    <Button onClick={() => setModal('create')} className="shrink-0">
                        <Plus className="mr-2 h-4 w-4" />Nouveau marché prévu
                    </Button>
                </div>

                {/* Filtres */}
                <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3">
                    <div className="relative flex-1 min-w-48">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            placeholder="Rechercher (N° ou objet)…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <select value={planId} onChange={e => setPlanId(e.target.value)} className={sel}>
                        <option value="">Tous les PPM</option>
                        {plans.map(p => <option key={p.id} value={p.id}>{planLabel(p)}</option>)}
                    </select>
                    <select value={secteurId} onChange={e => setSecteurId(e.target.value)} className={sel}>
                        <option value="">Tous secteurs</option>
                        {secteurs.map(s => <option key={s.id} value={s.id}>{s.libelle}</option>)}
                    </select>
                    <select value={statut} onChange={e => setStatut(e.target.value)} className={sel}>
                        <option value="">Tous statuts</option>
                        {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    {hasFilters && (
                        <Button size="sm" variant="ghost" onClick={resetFilters} className="gap-1.5 text-muted-foreground">
                            <X className="h-3.5 w-3.5" />Réinitialiser
                        </Button>
                    )}
                </div>

                {/* Tableau */}
                {marches_prevus.data.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed">
                        <div className="py-16 text-center">
                            <ListChecks className="mx-auto mb-4 h-14 w-14 text-muted-foreground/25" />
                            <h3 className="text-base font-semibold">Aucun marché prévu</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Ajoutez les marchés planifiés dans votre PPM.</p>
                            <Button className="mt-5" onClick={() => setModal('create')}>
                                <Plus className="mr-2 h-4 w-4" />Nouveau marché prévu
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border bg-card">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    <th className="px-4 py-3 text-left">N°</th>
                                    <th className="px-4 py-3 text-left">Objet</th>
                                    <th className="px-4 py-3 text-left">PPM</th>
                                    <th className="px-4 py-3 text-left">Type</th>
                                    <th className="px-4 py-3 text-left">Mode</th>
                                    <th className="px-4 py-3 text-left">Secteur</th>
                                    <th className="px-4 py-3 text-right">Montant prév.</th>
                                    <th className="px-4 py-3 text-left">
                                        <span className="flex items-center gap-1">
                                            <CalendarDays className="h-3.5 w-3.5" />Lancement
                                        </span>
                                    </th>
                                    <th className="px-4 py-3 text-left">Statut</th>
                                    <th className="w-12 px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {marches_prevus.data.map(mp => (
                                    <tr key={mp.id} className="group transition-colors hover:bg-muted/30">
                                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{mp.numero}</td>
                                        <td className="px-4 py-3 max-w-[220px]">
                                            <span className="line-clamp-2 leading-snug">{mp.objet}</span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                            {mp.plan ? planLabel(mp.plan) : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-xs">{mp.type_marche?.libelle ?? '—'}</td>
                                        <td className="px-4 py-3 text-xs">{mp.mode_passation?.libelle ?? '—'}</td>
                                        <td className="px-4 py-3">
                                            {mp.secteur ? (
                                                <span
                                                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                                                    style={{ backgroundColor: mp.secteur.couleur ?? '#6b7280' }}
                                                >
                                                    {mp.secteur.libelle}
                                                </span>
                                            ) : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums text-xs font-medium">
                                            {fmtMontant(mp.montant_previsionnel)}
                                        </td>
                                        <td className="px-4 py-3 text-xs whitespace-nowrap">{fmtDate(mp.date_lancement_prevue)}</td>
                                        <td className="px-4 py-3">
                                            <Badge variant="outline" className={`text-[11px] ${statutCls(mp.statut)}`}>
                                                {statutLabel(mp.statut)}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7"
                                                    title="Modifier"
                                                    onClick={() => setModal(mp)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

            </div>

            {/* Modal */}
            <Dialog
                open={modal !== null}
                onOpenChange={open => !open && setModal(null)}
            >
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {modal === 'create'
                                ? <><Plus className="h-4 w-4 text-primary" />Nouveau marché prévu</>
                                : <><Pencil className="h-4 w-4" />Modifier le marché prévu</>
                            }
                        </DialogTitle>
                    </DialogHeader>
                    {modal !== null && (
                        <MarcheModal
                            key={modal === 'create' ? 'create' : (modal as MarchePrevu).id}
                            marche={modal === 'create' ? null : modal as MarchePrevu}
                            plans={plans}
                            typesMarche={types_marche}
                            modesPassation={modes_passation}
                            secteurs={secteurs}
                            sources={sources}
                            onClose={() => setModal(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
