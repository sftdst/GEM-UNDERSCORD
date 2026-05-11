import { Head, router, useForm } from '@inertiajs/react';
import { FileCheck2, Pencil, Plus, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Marche {
    id: string;
    numero_marche: string;
    intitule: string;
    statut: string;
    statut_risque: string;
    montant_actuel_ht: string;
    montant_initial_ht: string;
    taux_avancement_physique: string;
    date_signature: string | null;
    date_debut: string | null;
    date_fin_prevue: string | null;
    fournisseur?: { id: string; raison_sociale: string };
    type_marche?: { id: string; libelle: string };
}

interface RefItem     { id: string; libelle: string }
interface FournRef    { id: string; raison_sociale: string }

interface Props {
    marches: { data: Marche[]; total: number };
    types_marche: RefItem[];
    fournisseurs: FournRef[];
    filters: { search?: string; statut?: string; risque?: string; type_marche_id?: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'GMP', href: '/gmp' },
    { title: 'Marchés', href: '/gmp/marches' },
];

const STATUTS_MARCHE = [
    { value: 'en_preparation', label: 'En préparation', cls: 'bg-gray-50 text-gray-600 border-gray-200' },
    { value: 'signe',          label: 'Signé',          cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    { value: 'en_cours',       label: 'En cours',       cls: 'bg-violet-50 text-violet-700 border-violet-200' },
    { value: 'suspendu',       label: 'Suspendu',       cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    { value: 'cloture',        label: 'Clôturé',        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { value: 'resilie',        label: 'Résilié',        cls: 'bg-red-50 text-red-700 border-red-200' },
];

const RISQUES = [
    { value: 'vert',   label: 'Faible',  dot: 'bg-emerald-500' },
    { value: 'orange', label: 'Moyen',   dot: 'bg-amber-400' },
    { value: 'rouge',  label: 'Élevé',   dot: 'bg-red-500' },
];

function fmt(val: string) {
    return new Intl.NumberFormat('fr-SN', { maximumFractionDigits: 0 }).format(Number(val)) + ' FCFA';
}

function statutCls(s: string) {
    return STATUTS_MARCHE.find(x => x.value === s)?.cls ?? 'bg-gray-50 text-gray-600 border-gray-200';
}

// ── Modal ──────────────────────────────────────────────────────────────────

interface ModalProps { marche?: Marche | null; types: RefItem[]; fournisseurs: FournRef[]; onClose: () => void }

function MarcheModal({ marche, types, fournisseurs, onClose }: ModalProps) {
    const editing = !!marche;
    const { data, setData, post, put, processing, errors, reset } = useForm({
        numero_marche:            marche?.numero_marche ?? '',
        intitule:                 marche?.intitule ?? '',
        type_marche_id:           marche?.type_marche?.id ?? '',
        fournisseur_id:           marche?.fournisseur?.id ?? '',
        montant_initial_ht:       marche?.montant_initial_ht ?? '',
        montant_actuel_ht:        marche?.montant_actuel_ht ?? '',
        date_signature:           marche?.date_signature ?? '',
        date_debut:               marche?.date_debut ?? '',
        date_fin_prevue:          marche?.date_fin_prevue ?? '',
        statut:                   marche?.statut ?? 'signe',
        statut_risque:            marche?.statut_risque ?? 'vert',
        taux_avancement_physique: marche?.taux_avancement_physique ?? '0',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            put(`/gmp/marches/${marche!.id}`, { onSuccess: () => { reset(); onClose(); } });
        } else {
            post('/gmp/marches', { onSuccess: () => { reset(); onClose(); } });
        }
    }

    return (
        <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label>N° Marché <span className="text-destructive">*</span></Label>
                    <Input value={data.numero_marche} onChange={e => setData('numero_marche', e.target.value)} placeholder="MC-2026-001" autoFocus />
                    {errors.numero_marche && <p className="text-xs text-destructive">{errors.numero_marche}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label>Type de marché</Label>
                    <select value={data.type_marche_id} onChange={e => setData('type_marche_id', e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                        <option value="">— Sélectionner —</option>
                        {types.map(t => <option key={t.id} value={t.id}>{t.libelle}</option>)}
                    </select>
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                    <Label>Intitulé <span className="text-destructive">*</span></Label>
                    <Input value={data.intitule} onChange={e => setData('intitule', e.target.value)} placeholder="Construction de…" />
                    {errors.intitule && <p className="text-xs text-destructive">{errors.intitule}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label>Fournisseur</Label>
                    <select value={data.fournisseur_id} onChange={e => setData('fournisseur_id', e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                        <option value="">— Sélectionner —</option>
                        {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.raison_sociale}</option>)}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <Label>Montant {editing ? 'actuel' : 'initial'} HT (FCFA) <span className="text-destructive">*</span></Label>
                    <Input
                        type="number"
                        value={editing ? data.montant_actuel_ht : data.montant_initial_ht}
                        onChange={e => setData(editing ? 'montant_actuel_ht' : 'montant_initial_ht', e.target.value)}
                        placeholder="0"
                    />
                    {(errors.montant_initial_ht || errors.montant_actuel_ht) && (
                        <p className="text-xs text-destructive">{errors.montant_initial_ht || errors.montant_actuel_ht}</p>
                    )}
                </div>
                <div className="space-y-1.5">
                    <Label>Date de signature</Label>
                    <Input type="date" value={data.date_signature ?? ''} onChange={e => setData('date_signature', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                    <Label>Date de début</Label>
                    <Input type="date" value={data.date_debut ?? ''} onChange={e => setData('date_debut', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                    <Label>Date de fin prévue</Label>
                    <Input type="date" value={data.date_fin_prevue ?? ''} onChange={e => setData('date_fin_prevue', e.target.value)} />
                </div>
                {editing && (
                    <>
                        <div className="space-y-1.5">
                            <Label>Statut</Label>
                            <select value={data.statut} onChange={e => setData('statut', e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                                {STATUTS_MARCHE.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Niveau de risque</Label>
                            <select value={data.statut_risque} onChange={e => setData('statut_risque', e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                                {RISQUES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Avancement physique (%)</Label>
                            <Input type="number" min="0" max="100" value={data.taux_avancement_physique} onChange={e => setData('taux_avancement_physique', e.target.value)} />
                        </div>
                    </>
                )}
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
                <Button type="submit" disabled={processing}>
                    {processing ? 'Enregistrement...' : editing ? 'Mettre à jour' : 'Créer le marché'}
                </Button>
            </DialogFooter>
        </form>
    );
}

// ── Page principale ────────────────────────────────────────────────────────

export default function MarchesIndex({ marches, types_marche, fournisseurs, filters }: Props) {
    const [search, setSearch]   = useState(filters.search ?? '');
    const [statut, setStatut]   = useState(filters.statut ?? '');
    const [risque, setRisque]   = useState(filters.risque ?? '');
    const [typeId, setTypeId]   = useState(filters.type_marche_id ?? '');
    const [modal, setModal]     = useState<'create' | Marche | null>(null);

    useEffect(() => {
        const t = setTimeout(() => {
            router.get('/gmp/marches', { search, statut, risque, type_marche_id: typeId }, { preserveState: true, replace: true });
        }, 350);
        return () => clearTimeout(t);
    }, [search, statut, risque, typeId]);

    const resetFilters = () => { setSearch(''); setStatut(''); setRisque(''); setTypeId(''); };
    const hasFilters = !!(search || statut || risque || typeId);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Marchés" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">

                {/* En-tête */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                            <FileCheck2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Marchés</h1>
                            <p className="text-sm text-muted-foreground">{marches.total} marché(s) enregistré(s)</p>
                        </div>
                    </div>
                    <Button onClick={() => setModal('create')} className="shrink-0">
                        <Plus className="mr-2 h-4 w-4" />Nouveau marché
                    </Button>
                </div>

                {/* Filtres */}
                <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3">
                    <div className="relative flex-1 min-w-48">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input className="pl-9 bg-background" placeholder="N° marché, intitulé…" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <select value={statut} onChange={e => setStatut(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                        <option value="">Tous les statuts</option>
                        {STATUTS_MARCHE.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <select value={risque} onChange={e => setRisque(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                        <option value="">Tout niveau de risque</option>
                        {RISQUES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                    <select value={typeId} onChange={e => setTypeId(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                        <option value="">Tous les types</option>
                        {types_marche.map(t => <option key={t.id} value={t.id}>{t.libelle}</option>)}
                    </select>
                    {hasFilters && (
                        <Button size="sm" variant="ghost" onClick={resetFilters} className="gap-1.5 text-muted-foreground">
                            <X className="h-3.5 w-3.5" />Réinitialiser
                        </Button>
                    )}
                </div>

                {/* Tableau */}
                {marches.data.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed">
                        <div className="py-16 text-center">
                            <FileCheck2 className="mx-auto mb-4 h-14 w-14 text-muted-foreground/25" />
                            <h3 className="text-base font-semibold">Aucun marché trouvé</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Modifiez vos filtres ou créez un nouveau marché.</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border shadow-sm">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/40">
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">N° Marché</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Intitulé</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fournisseur</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Montant HT</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Avancement</th>
                                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Risque</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
                                    <th className="px-4 py-3 w-10" />
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {marches.data.map(m => (
                                    <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs font-medium">{m.numero_marche}</td>
                                        <td className="max-w-xs px-4 py-3">
                                            <p className="truncate font-medium">{m.intitule}</p>
                                            <p className="text-xs text-muted-foreground">{m.type_marche?.libelle ?? '—'}</p>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground text-xs">{m.fournisseur?.raison_sociale ?? '—'}</td>
                                        <td className="px-4 py-3 text-right tabular-nums font-medium">{fmt(m.montant_actuel_ht)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                                                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Number(m.taux_avancement_physique)}%` }} />
                                                </div>
                                                <span className="text-xs tabular-nums">{Number(m.taux_avancement_physique).toFixed(0)}%</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-block h-3 w-3 rounded-full ${RISQUES.find(r => r.value === m.statut_risque)?.dot ?? 'bg-gray-400'}`} title={RISQUES.find(r => r.value === m.statut_risque)?.label} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge className={`text-xs ${statutCls(m.statut)}`} variant="outline">
                                                {STATUTS_MARCHE.find(s => s.value === m.statut)?.label ?? m.statut}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setModal(m)}>
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

            {/* Modal */}
            <Dialog open={modal !== null} onOpenChange={open => !open && setModal(null)}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileCheck2 className="h-5 w-5 text-blue-600" />
                            {modal === 'create' ? 'Nouveau marché' : 'Modifier le marché'}
                        </DialogTitle>
                    </DialogHeader>
                    <MarcheModal
                        key={typeof modal === 'object' && modal !== null ? modal.id : 'create'}
                        marche={modal !== 'create' ? modal : null}
                        types={types_marche}
                        fournisseurs={fournisseurs}
                        onClose={() => setModal(null)}
                    />
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
