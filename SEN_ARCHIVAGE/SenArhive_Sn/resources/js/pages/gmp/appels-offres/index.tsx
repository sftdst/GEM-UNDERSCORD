import { Head, router, useForm } from '@inertiajs/react';
import { Megaphone, Pencil, Plus, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface AppelOffre {
    id: string;
    numero_aao: string;
    intitule: string;
    statut: string;
    date_cloture: string | null;
    montant_estime: string | null;
    type_marche?: { id: string; libelle: string };
    mode_passation?: { id: string; libelle: string };
}

interface RefItem { id: string; libelle: string }

interface Props {
    appels_offres: { data: AppelOffre[]; total: number };
    types_marche: RefItem[];
    modes_passation: RefItem[];
    filters: { search?: string; statut?: string; type_marche_id?: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'GMP', href: '/gmp' },
    { title: "Appels d'offres", href: '/gmp/appels-offres' },
];

const STATUTS_AO = [
    { value: 'preparation',         label: 'En préparation',    cls: 'bg-gray-50 text-gray-600 border-gray-200' },
    { value: 'publie',               label: 'Publié',            cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    { value: 'en_cours_evaluation',  label: 'Évaluation',        cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    { value: 'cloture',              label: 'Clôturé',           cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { value: 'annule',               label: 'Annulé',            cls: 'bg-red-50 text-red-700 border-red-200' },
];

function statutCls(s: string) {
    return STATUTS_AO.find(x => x.value === s)?.cls ?? 'bg-gray-50 text-gray-600 border-gray-200';
}
function statutLabel(s: string) {
    return STATUTS_AO.find(x => x.value === s)?.label ?? s.replace(/_/g, ' ');
}

function fmt(val: string | null) {
    if (!val) return '—';
    return new Intl.NumberFormat('fr-SN', { maximumFractionDigits: 0 }).format(Number(val)) + ' FCFA';
}

// ── Modal ──────────────────────────────────────────────────────────────────

interface ModalProps { ao?: AppelOffre | null; types: RefItem[]; modes: RefItem[]; onClose: () => void }

function AoModal({ ao, types, modes, onClose }: ModalProps) {
    const editing = !!ao;
    const { data, setData, post, put, processing, errors, reset } = useForm({
        numero_aao:         ao?.numero_aao ?? '',
        intitule:           ao?.intitule ?? '',
        type_marche_id:     ao?.type_marche?.id ?? '',
        mode_passation_id:  ao?.mode_passation?.id ?? '',
        montant_estime:     ao?.montant_estime ?? '',
        date_cloture:       ao?.date_cloture ?? '',
        statut:             ao?.statut ?? 'preparation',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            put(`/gmp/appels-offres/${ao!.id}`, { onSuccess: () => { reset(); onClose(); } });
        } else {
            post('/gmp/appels-offres', { onSuccess: () => { reset(); onClose(); } });
        }
    }

    return (
        <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label>Référence AAO <span className="text-destructive">*</span></Label>
                    <Input value={data.numero_aao} onChange={e => setData('numero_aao', e.target.value)} placeholder="AAO-2026-001" autoFocus />
                    {errors.numero_aao && <p className="text-xs text-destructive">{errors.numero_aao}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label>Montant estimé (FCFA)</Label>
                    <Input type="number" value={data.montant_estime} onChange={e => setData('montant_estime', e.target.value)} placeholder="0" />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                    <Label>Intitulé <span className="text-destructive">*</span></Label>
                    <Input value={data.intitule} onChange={e => setData('intitule', e.target.value)} placeholder="Fourniture de…" />
                    {errors.intitule && <p className="text-xs text-destructive">{errors.intitule}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label>Type de marché</Label>
                    <select value={data.type_marche_id} onChange={e => setData('type_marche_id', e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                        <option value="">— Sélectionner —</option>
                        {types.map(t => <option key={t.id} value={t.id}>{t.libelle}</option>)}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <Label>Mode de passation</Label>
                    <select value={data.mode_passation_id} onChange={e => setData('mode_passation_id', e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                        <option value="">— Sélectionner —</option>
                        {modes.map(m => <option key={m.id} value={m.id}>{m.libelle}</option>)}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <Label>Date de clôture</Label>
                    <Input type="date" value={data.date_cloture ?? ''} onChange={e => setData('date_cloture', e.target.value)} />
                </div>
                {editing && (
                    <div className="space-y-1.5">
                        <Label>Statut</Label>
                        <select value={data.statut} onChange={e => setData('statut', e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                            {STATUTS_AO.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>
                )}
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
                <Button type="submit" disabled={processing}>
                    {processing ? 'Enregistrement...' : editing ? "Mettre à jour" : "Créer l'appel d'offres"}
                </Button>
            </DialogFooter>
        </form>
    );
}

// ── Page principale ────────────────────────────────────────────────────────

export default function AppelsOffresIndex({ appels_offres, types_marche, modes_passation, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [statut, setStatut] = useState(filters.statut ?? '');
    const [typeId, setTypeId] = useState(filters.type_marche_id ?? '');
    const [modal, setModal]   = useState<'create' | AppelOffre | null>(null);

    useEffect(() => {
        const t = setTimeout(() => {
            router.get('/gmp/appels-offres', { search, statut, type_marche_id: typeId }, { preserveState: true, replace: true });
        }, 350);
        return () => clearTimeout(t);
    }, [search, statut, typeId]);

    const resetFilters = () => { setSearch(''); setStatut(''); setTypeId(''); };
    const hasFilters = !!(search || statut || typeId);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Appels d'offres" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">

                {/* En-tête */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                            <Megaphone className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Appels d'offres</h1>
                            <p className="text-sm text-muted-foreground">{appels_offres.total} appel(s) enregistré(s)</p>
                        </div>
                    </div>
                    <Button onClick={() => setModal('create')} className="shrink-0">
                        <Plus className="mr-2 h-4 w-4" />Nouvel appel d'offres
                    </Button>
                </div>

                {/* Filtres */}
                <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3">
                    <div className="relative flex-1 min-w-48">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input className="pl-9 bg-background" placeholder="Référence, intitulé…" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <select value={statut} onChange={e => setStatut(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                        <option value="">Tous les statuts</option>
                        {STATUTS_AO.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
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
                {appels_offres.data.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed">
                        <div className="py-16 text-center">
                            <Megaphone className="mx-auto mb-4 h-14 w-14 text-muted-foreground/25" />
                            <h3 className="text-base font-semibold">Aucun appel d'offres trouvé</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Modifiez vos filtres ou lancez un appel d'offres.</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border shadow-sm">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/40">
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Référence</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Intitulé</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Mode</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Montant estimé</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Clôture</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
                                    <th className="px-4 py-3 w-10" />
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {appels_offres.data.map(ao => (
                                    <tr key={ao.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs font-medium">{ao.numero_aao}</td>
                                        <td className="max-w-xs px-4 py-3 font-medium truncate">{ao.intitule}</td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground">{ao.type_marche?.libelle ?? '—'}</td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground">{ao.mode_passation?.libelle ?? '—'}</td>
                                        <td className="px-4 py-3 text-right tabular-nums">{fmt(ao.montant_estime)}</td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground">{ao.date_cloture ?? '—'}</td>
                                        <td className="px-4 py-3">
                                            <Badge className={`text-xs ${statutCls(ao.statut)}`} variant="outline">
                                                {statutLabel(ao.statut)}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setModal(ao)}>
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
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Megaphone className="h-5 w-5 text-purple-600" />
                            {modal === 'create' ? "Nouvel appel d'offres" : "Modifier l'appel d'offres"}
                        </DialogTitle>
                    </DialogHeader>
                    <AoModal
                        key={typeof modal === 'object' && modal !== null ? modal.id : 'create'}
                        ao={modal !== 'create' ? modal : null}
                        types={types_marche}
                        modes={modes_passation}
                        onClose={() => setModal(null)}
                    />
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
