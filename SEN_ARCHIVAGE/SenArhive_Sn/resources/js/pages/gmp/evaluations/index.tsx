import { Head, router } from '@inertiajs/react';
import {
    AlertTriangle, BarChart2, ChevronDown, ChevronRight,
    ClipboardCheck, Pencil, Plus, Search, Trash2, X,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

// ── Types ──────────────────────────────────────────────────────────────────────

interface EvaluationCritere {
    id: string;
    critere: string;
    ponderation: string;
    note: string;
    note_ponderee: string;
    commentaire: string | null;
    evaluateur?: { id: string; name: string };
}

interface Soumission {
    id: string;
    reference_soumission: string;
    montant_offre_ht: string;
    montant_offre_ttc: string;
    statut: string;
    score_technique: string | null;
    score_financier: string | null;
    score_global: string | null;
    motif_elimination: string | null;
    alerte_offre_anormale: boolean;
    fournisseur?: { id: string; raison_sociale: string };
    evaluations: EvaluationCritere[];
}

interface AppelOffre {
    id: string;
    numero_aao: string;
    objet: string;
    statut: string;
    date_cloture: string | null;
    soumissions: Soumission[];
}

interface Props {
    appels_offres: AppelOffre[];
    all_aos: { id: string; numero_aao: string; objet: string }[];
    filters: { appel_offre_id?: string };
}

// ── Constantes ─────────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'GMP', href: '/gmp' },
    { title: 'Passation', href: '/gmp/appels-offres' },
    { title: 'Évaluation des offres', href: '/gmp/evaluations' },
];

const STATUTS = [
    { value: 'deposee',      label: 'Déposée',      cls: 'bg-slate-50 text-slate-600 border-slate-200' },
    { value: 'conforme',     label: 'Conforme',     cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    { value: 'non_conforme', label: 'Non conforme', cls: 'bg-red-50 text-red-600 border-red-200' },
    { value: 'retenue',      label: 'Retenue',      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { value: 'eliminee',     label: 'Éliminée',     cls: 'bg-gray-100 text-gray-500 border-gray-200' },
];

function statutCls(s: string) { return STATUTS.find(x => x.value === s)?.cls ?? ''; }
function statutLabel(s: string) { return STATUTS.find(x => x.value === s)?.label ?? s; }

function fmtMontant(v: string | null) {
    if (!v || Number(v) === 0) return '—';
    return new Intl.NumberFormat('fr-SN', { maximumFractionDigits: 0 }).format(Number(v)) + ' FCFA';
}
function fmtScore(v: string | null) {
    const n = Number(v);
    return isNaN(n) || v === null ? '—' : n.toFixed(2);
}
function scoreColor(v: string | null) {
    const n = Number(v);
    if (v === null || isNaN(n)) return 'text-muted-foreground/40';
    if (n >= 70) return 'text-emerald-600';
    if (n >= 50) return 'text-amber-600';
    return 'text-red-500';
}

// ── Modal d'évaluation ────────────────────────────────────────────────────────

function EvaluationModal({
    soumission,
    aoRef,
    onClose,
}: {
    soumission: Soumission;
    aoRef: string;
    onClose: () => void;
}) {
    const [tab,          setTab]          = useState<'criteres' | 'statut'>('criteres');
    const [editingId,    setEditingId]    = useState<string | null>(null);

    // Formulaire ajout / édition critère
    const [critere,      setCritere]      = useState('');
    const [ponderation,  setPonderation]  = useState('');
    const [note,         setNote]         = useState('');
    const [commentaire,  setCommentaire]  = useState('');
    const [cErrors,      setCErrors]      = useState<Record<string, string>>({});
    const [cProcessing,  setCProcessing]  = useState(false);

    // Formulaire statut
    const [statut,       setStatut]       = useState(soumission.statut);
    const [scoreTech,    setScoreTech]    = useState(soumission.score_technique ?? '');
    const [scoreFin,     setScoreFin]     = useState(soumission.score_financier ?? '');
    const [motif,        setMotif]        = useState(soumission.motif_elimination ?? '');
    const [sProcessing,  setSProcessing]  = useState(false);

    const sel = 'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring';

    const scoreCalc = soumission.evaluations.reduce((s, e) => s + Number(e.note_ponderee), 0);
    const totalPond = soumission.evaluations.reduce((s, e) => s + Number(e.ponderation), 0);

    function startEdit(e: EvaluationCritere) {
        setEditingId(e.id);
        setCritere(e.critere);
        setPonderation(String(e.ponderation));
        setNote(String(e.note));
        setCommentaire(e.commentaire ?? '');
        setCErrors({});
    }

    function resetForm() {
        setEditingId(null);
        setCritere(''); setPonderation(''); setNote(''); setCommentaire('');
        setCErrors({});
    }

    function validateCritere() {
        const errs: Record<string, string> = {};
        if (!critere.trim())                              errs.critere     = 'Requis';
        if (!ponderation || Number(ponderation) <= 0)    errs.ponderation = 'Entre 1 et 100';
        if (note === '' || Number(note) < 0)             errs.note        = 'Entre 0 et 100';
        setCErrors(errs);
        return Object.keys(errs).length === 0;
    }

    function submitCritere(e: React.FormEvent) {
        e.preventDefault();
        if (!validateCritere()) return;
        setCProcessing(true);

        const payload = { critere, ponderation, note, commentaire };
        const url = editingId
            ? `/gmp/evaluations/${soumission.id}/criteres/${editingId}`
            : `/gmp/evaluations/${soumission.id}/criteres`;
        const method = editingId ? router.put : router.post;

        method(url, payload, {
            preserveScroll: true,
            onSuccess: () => resetForm(),
            onError: (errs) => setCErrors(errs as Record<string, string>),
            onFinish: () => setCProcessing(false),
        });
    }

    function deleteCritere(id: string) {
        router.delete(`/gmp/evaluations/${soumission.id}/criteres/${id}`, { preserveScroll: true });
    }

    function submitStatut(e: React.FormEvent) {
        e.preventDefault();
        setSProcessing(true);
        router.put(`/gmp/evaluations/${soumission.id}/statut`, {
            statut, score_technique: scoreTech, score_financier: scoreFin, motif_elimination: motif,
        }, {
            preserveScroll: true,
            onSuccess: () => onClose(),
            onFinish: () => setSProcessing(false),
        });
    }

    const showMotif = statut === 'non_conforme' || statut === 'eliminee';

    return (
        <div className="flex flex-col gap-0">
            {/* En-tête soumission */}
            <div className="rounded-xl border bg-muted/30 px-4 py-3 mb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-muted-foreground">Soumission · {aoRef}</p>
                        <p className="text-sm font-semibold">{soumission.fournisseur?.raison_sociale ?? '—'}</p>
                        <p className="text-xs text-muted-foreground font-mono">{soumission.reference_soumission}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">Montant HT</p>
                        <p className="text-sm font-bold tabular-nums">{fmtMontant(soumission.montant_offre_ht)}</p>
                        <Badge variant="outline" className={`text-[11px] ${statutCls(soumission.statut)}`}>{statutLabel(soumission.statut)}</Badge>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b mb-4">
                {(['criteres', 'statut'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-3 py-1.5 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        {t === 'criteres' ? 'Critères d\'évaluation' : 'Scores & Statut'}
                    </button>
                ))}
            </div>

            {/* Tab : Critères */}
            {tab === 'criteres' && (
                <div className="space-y-4">
                    {/* Récap score */}
                    <div className="flex items-center gap-4 rounded-lg border bg-muted/20 px-4 py-2.5 text-sm">
                        <div className="flex-1">
                            <span className="text-muted-foreground text-xs">Pondération totale</span>
                            <p className={`font-bold tabular-nums ${totalPond > 100 ? 'text-red-600' : 'text-foreground'}`}>{totalPond.toFixed(0)} %</p>
                        </div>
                        <div className="h-8 w-px bg-border" />
                        <div className="flex-1">
                            <span className="text-muted-foreground text-xs">Score pondéré calculé</span>
                            <p className={`font-bold text-lg tabular-nums ${scoreColor(String(scoreCalc))}`}>{scoreCalc.toFixed(2)} / 100</p>
                        </div>
                        <div className="h-8 w-px bg-border" />
                        <div className="flex-1">
                            <span className="text-muted-foreground text-xs">Score global (sauvegardé)</span>
                            <p className={`font-bold text-lg tabular-nums ${scoreColor(soumission.score_global)}`}>{fmtScore(soumission.score_global)}</p>
                        </div>
                    </div>

                    {/* Table critères existants */}
                    {soumission.evaluations.length > 0 && (
                        <div className="overflow-hidden rounded-lg border">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b bg-muted/40 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                        <th className="px-3 py-2 text-left">Critère</th>
                                        <th className="px-3 py-2 text-center w-20">Pond. %</th>
                                        <th className="px-3 py-2 text-center w-20">Note /100</th>
                                        <th className="px-3 py-2 text-center w-24">Pondérée</th>
                                        <th className="w-16 px-3 py-2" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {soumission.evaluations.map(ev => (
                                        <tr key={ev.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="px-3 py-2">
                                                <p className="font-medium">{ev.critere}</p>
                                                {ev.commentaire && <p className="text-[11px] text-muted-foreground mt-0.5">{ev.commentaire}</p>}
                                                {ev.evaluateur && <p className="text-[10px] text-muted-foreground/60 mt-0.5">par {ev.evaluateur.name}</p>}
                                            </td>
                                            <td className="px-3 py-2 text-center tabular-nums font-medium">{Number(ev.ponderation).toFixed(0)}</td>
                                            <td className="px-3 py-2 text-center tabular-nums font-medium">{Number(ev.note).toFixed(1)}</td>
                                            <td className="px-3 py-2 text-center">
                                                <span className={`font-bold tabular-nums ${scoreColor(ev.note_ponderee)}`}>{Number(ev.note_ponderee).toFixed(2)}</span>
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => startEdit(ev)}>
                                                        <Pencil className="h-3 w-3" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-6 w-6 hover:text-destructive" onClick={() => deleteCritere(ev.id)}>
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Formulaire ajouter / modifier */}
                    <form onSubmit={submitCritere} className="space-y-3 rounded-lg border border-dashed p-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            {editingId ? 'Modifier le critère' : 'Ajouter un critère'}
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2 space-y-1">
                                <Label className="text-xs">Critère <span className="text-destructive">*</span></Label>
                                <Input value={critere} onChange={e => setCritere(e.target.value)} placeholder="Ex: Expérience technique, Capacité financière…" className="h-8 text-sm" />
                                {cErrors.critere && <p className="text-[11px] text-destructive">{cErrors.critere}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Pondération (%) <span className="text-destructive">*</span></Label>
                                <Input type="number" min="1" max="100" step="1" value={ponderation} onChange={e => setPonderation(e.target.value)} placeholder="Ex: 30" className="h-8 text-sm" />
                                {cErrors.ponderation && <p className="text-[11px] text-destructive">{cErrors.ponderation}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Note (0–100) <span className="text-destructive">*</span></Label>
                                <Input type="number" min="0" max="100" step="0.5" value={note} onChange={e => setNote(e.target.value)} placeholder="Ex: 75" className="h-8 text-sm" />
                                {cErrors.note && <p className="text-[11px] text-destructive">{cErrors.note}</p>}
                            </div>
                            {ponderation && note && (
                                <div className="col-span-2 flex items-center gap-2 rounded-md bg-muted/40 px-3 py-1.5 text-xs">
                                    <span className="text-muted-foreground">Note pondérée :</span>
                                    <span className="font-bold tabular-nums">{((Number(note) * Number(ponderation)) / 100).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="col-span-2 space-y-1">
                                <Label className="text-xs">Commentaire</Label>
                                <Input value={commentaire} onChange={e => setCommentaire(e.target.value)} placeholder="Observations…" className="h-8 text-sm" />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" size="sm" disabled={cProcessing} className="h-7 text-xs">
                                <Plus className="mr-1 h-3 w-3" />
                                {editingId ? 'Mettre à jour' : 'Ajouter'}
                            </Button>
                            {editingId && (
                                <Button type="button" size="sm" variant="ghost" onClick={resetForm} className="h-7 text-xs">
                                    <X className="mr-1 h-3 w-3" />Annuler
                                </Button>
                            )}
                        </div>
                    </form>
                </div>
            )}

            {/* Tab : Scores & Statut */}
            {tab === 'statut' && (
                <form onSubmit={submitStatut} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label>Statut de la soumission <span className="text-destructive">*</span></Label>
                            <select value={statut} onChange={e => setStatut(e.target.value)} className={sel}>
                                {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Score technique (manuel, /100)</Label>
                            <Input type="number" min="0" max="100" step="0.01" value={scoreTech} onChange={e => setScoreTech(e.target.value)} placeholder="—" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Score financier (manuel, /100)</Label>
                            <Input type="number" min="0" max="100" step="0.01" value={scoreFin} onChange={e => setScoreFin(e.target.value)} placeholder="—" />
                        </div>
                        <div className="flex items-end pb-1">
                            <div className="rounded-lg border bg-muted/30 px-3 py-2 text-xs w-full">
                                <p className="text-muted-foreground">Score global calculé</p>
                                <p className={`text-xl font-bold tabular-nums mt-0.5 ${scoreColor(String(scoreCalc))}`}>{scoreCalc.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    {showMotif && (
                        <div className="space-y-1.5">
                            <Label>Motif d'élimination / non-conformité</Label>
                            <textarea
                                rows={3}
                                value={motif}
                                onChange={e => setMotif(e.target.value)}
                                className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                            />
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
                        <Button type="submit" disabled={sProcessing}>
                            {sProcessing ? 'Enregistrement…' : 'Enregistrer le statut'}
                        </Button>
                    </DialogFooter>
                </form>
            )}
        </div>
    );
}

// ── Bloc AO avec soumissions ───────────────────────────────────────────────────

function AoBlock({ ao }: { ao: AppelOffre }) {
    const [open,  setOpen]  = useState(true);
    const [modal, setModal] = useState<Soumission | null>(null);

    return (
        <div className="overflow-hidden rounded-xl border bg-card">
            {/* En-tête AO */}
            <button
                onClick={() => setOpen(o => !o)}
                className="flex w-full items-center gap-3 border-b bg-muted/30 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
            >
                {open ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold">{ao.numero_aao}</span>
                        <span className="truncate text-sm text-muted-foreground">{ao.objet}</span>
                    </div>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{ao.soumissions.length} soumission(s)</span>
            </button>

            {/* Table soumissions */}
            {open && (
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b text-[11px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted/20">
                            <th className="px-4 py-2 text-left">Fournisseur</th>
                            <th className="px-4 py-2 text-right">Montant HT</th>
                            <th className="px-4 py-2 text-center">Score global</th>
                            <th className="px-4 py-2 text-center">Critères</th>
                            <th className="px-4 py-2 text-left">Statut</th>
                            <th className="w-28 px-4 py-2" />
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {ao.soumissions.map(s => (
                            <tr key={s.id} className="group hover:bg-muted/20 transition-colors">
                                <td className="px-4 py-2.5">
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-medium">{s.fournisseur?.raison_sociale ?? '—'}</span>
                                        {s.alerte_offre_anormale && (
                                            <span title="Offre anormalement basse">
                                                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] font-mono text-muted-foreground">{s.reference_soumission}</p>
                                </td>
                                <td className="px-4 py-2.5 text-right tabular-nums text-xs">{fmtMontant(s.montant_offre_ht)}</td>
                                <td className="px-4 py-2.5 text-center">
                                    <span className={`text-base font-bold tabular-nums ${scoreColor(s.score_global)}`}>{fmtScore(s.score_global)}</span>
                                </td>
                                <td className="px-4 py-2.5 text-center">
                                    <span className="text-xs text-muted-foreground">{s.evaluations.length} critère(s)</span>
                                </td>
                                <td className="px-4 py-2.5">
                                    <Badge variant="outline" className={`text-[11px] ${statutCls(s.statut)}`}>{statutLabel(s.statut)}</Badge>
                                </td>
                                <td className="px-4 py-2.5">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => setModal(s)}
                                    >
                                        <ClipboardCheck className="h-3.5 w-3.5" />Évaluer
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Modal évaluation */}
            <Dialog open={modal !== null} onOpenChange={open => !open && setModal(null)}>
                <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ClipboardCheck className="h-4 w-4 text-primary" />
                            Évaluation — {modal?.fournisseur?.raison_sociale}
                        </DialogTitle>
                    </DialogHeader>
                    {modal && (
                        <EvaluationModal
                            key={modal.id}
                            soumission={modal}
                            aoRef={ao.numero_aao}
                            onClose={() => setModal(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ── Page principale ────────────────────────────────────────────────────────────

export default function EvaluationsIndex({ appels_offres, all_aos, filters }: Props) {
    const [aoFilter, setAoFilter] = useState(filters.appel_offre_id ?? '');

    function applyFilter(val: string) {
        setAoFilter(val);
        router.get('/gmp/evaluations', { appel_offre_id: val }, { preserveState: true, replace: true });
    }

    const sel = 'h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Évaluation des offres" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">

                {/* En-tête */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
                            <BarChart2 className="h-5 w-5 text-violet-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Évaluation des offres</h1>
                            <p className="text-sm text-muted-foreground">Notation des critères et classement des soumissions</p>
                        </div>
                    </div>

                    {/* Filtre AO */}
                    <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <select value={aoFilter} onChange={e => applyFilter(e.target.value)} className={sel + ' min-w-56'}>
                            <option value="">Tous les appels d'offres</option>
                            {all_aos.map(a => <option key={a.id} value={a.id}>{a.numero_aao} — {a.objet}</option>)}
                        </select>
                        {aoFilter && (
                            <Button size="sm" variant="ghost" onClick={() => applyFilter('')} className="gap-1 text-muted-foreground">
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Contenu */}
                {appels_offres.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed">
                        <div className="py-16 text-center">
                            <BarChart2 className="mx-auto mb-4 h-14 w-14 text-muted-foreground/25" />
                            <h3 className="text-base font-semibold">Aucune soumission à évaluer</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Les soumissions apparaissent ici après leur dépôt sur un appel d'offres.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {appels_offres.map(ao => (
                            <AoBlock key={ao.id} ao={ao} />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
