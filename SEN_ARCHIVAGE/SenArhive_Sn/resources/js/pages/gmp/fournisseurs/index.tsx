import { Head, router, useForm } from '@inertiajs/react';
import { Building2, Pencil, Plus, Search, Star, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Fournisseur {
    id: string;
    raison_sociale: string;
    ninea: string | null;
    rc: string | null;
    adresse: string | null;
    telephone: string | null;
    email: string | null;
    pays: string | null;
    statut: string;
    score_global: string | null;
    marches_count: number;
}

interface Props {
    fournisseurs: { data: Fournisseur[]; total: number; per_page: number; current_page: number };
    filters: { search?: string; statut?: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'GMP', href: '/gmp' },
    { title: 'Fournisseurs', href: '/gmp/fournisseurs' },
];

const STATUTS = [
    { value: 'actif',      label: 'Actif',       cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { value: 'suspendu',   label: 'Suspendu',    cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    { value: 'blackliste', label: 'Blacklisté',  cls: 'bg-red-50 text-red-700 border-red-200' },
];

function statutCls(s: string) {
    return STATUTS.find(x => x.value === s)?.cls ?? 'bg-gray-50 text-gray-600 border-gray-200';
}

// ── Modal create / edit ────────────────────────────────────────────────────

interface ModalProps { fournisseur?: Fournisseur | null; onClose: () => void }

function FournisseurModal({ fournisseur, onClose }: ModalProps) {
    const editing = !!fournisseur;
    const { data, setData, post, put, processing, errors, reset } = useForm({
        raison_sociale: fournisseur?.raison_sociale ?? '',
        ninea:          fournisseur?.ninea ?? '',
        pays:           fournisseur?.pays ?? 'Sénégal',
        telephone:      fournisseur?.telephone ?? '',
        email:          fournisseur?.email ?? '',
        adresse:        fournisseur?.adresse ?? '',
        statut:         fournisseur?.statut ?? 'actif',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            put(`/gmp/fournisseurs/${fournisseur!.id}`, { onSuccess: () => { reset(); onClose(); } });
        } else {
            post('/gmp/fournisseurs', { onSuccess: () => { reset(); onClose(); } });
        }
    }

    return (
        <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 space-y-1.5">
                    <Label htmlFor="raison_sociale">Raison sociale <span className="text-destructive">*</span></Label>
                    <Input id="raison_sociale" value={data.raison_sociale} onChange={e => setData('raison_sociale', e.target.value)} placeholder="Entreprise SARL" autoFocus />
                    {errors.raison_sociale && <p className="text-xs text-destructive">{errors.raison_sociale}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="ninea">NINEA</Label>
                    <Input id="ninea" value={data.ninea} onChange={e => setData('ninea', e.target.value)} placeholder="000000000" />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="pays">Pays</Label>
                    <Input id="pays" value={data.pays} onChange={e => setData('pays', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="telephone">Téléphone</Label>
                    <Input id="telephone" value={data.telephone} onChange={e => setData('telephone', e.target.value)} placeholder="+221 77 000 00 00" />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={data.email} onChange={e => setData('email', e.target.value)} placeholder="contact@entreprise.sn" />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                    <Label htmlFor="adresse">Adresse</Label>
                    <Input id="adresse" value={data.adresse} onChange={e => setData('adresse', e.target.value)} placeholder="Dakar, Sénégal" />
                </div>
                {editing && (
                    <div className="space-y-1.5">
                        <Label htmlFor="statut">Statut</Label>
                        <select id="statut" value={data.statut} onChange={e => setData('statut', e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                            {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>
                )}
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
                <Button type="submit" disabled={processing}>
                    {processing ? 'Enregistrement...' : editing ? 'Mettre à jour' : 'Créer le fournisseur'}
                </Button>
            </DialogFooter>
        </form>
    );
}

// ── Page principale ────────────────────────────────────────────────────────

export default function FournisseursIndex({ fournisseurs, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [statut, setStatut] = useState(filters.statut ?? '');
    const [modal, setModal] = useState<'create' | Fournisseur | null>(null);

    useEffect(() => {
        const t = setTimeout(() => {
            router.get('/gmp/fournisseurs', { search, statut }, { preserveState: true, replace: true });
        }, 350);
        return () => clearTimeout(t);
    }, [search, statut]);

    const resetFilters = () => { setSearch(''); setStatut(''); };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Fournisseurs" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">

                {/* En-tête */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                            <Building2 className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Fournisseurs</h1>
                            <p className="text-sm text-muted-foreground">{fournisseurs.total} fournisseur(s) enregistré(s)</p>
                        </div>
                    </div>
                    <Button onClick={() => setModal('create')} className="shrink-0">
                        <Plus className="mr-2 h-4 w-4" />Nouveau fournisseur
                    </Button>
                </div>

                {/* Barre de filtres */}
                <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3">
                    <div className="relative flex-1 min-w-48">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            className="pl-9 bg-background"
                            placeholder="Rechercher par nom, NINEA, pays…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        value={statut}
                        onChange={e => setStatut(e.target.value)}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                        <option value="">Tous les statuts</option>
                        {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    {(search || statut) && (
                        <Button size="sm" variant="ghost" onClick={resetFilters} className="gap-1.5 text-muted-foreground">
                            <X className="h-3.5 w-3.5" />Réinitialiser
                        </Button>
                    )}
                </div>

                {/* Grille fournisseurs */}
                {fournisseurs.data.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed">
                        <div className="py-16 text-center">
                            <Building2 className="mx-auto mb-4 h-14 w-14 text-muted-foreground/25" />
                            <h3 className="text-base font-semibold">Aucun fournisseur trouvé</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Modifiez vos filtres ou créez un nouveau fournisseur.</p>
                            <Button className="mt-5" onClick={() => setModal('create')}>
                                <Plus className="mr-2 h-4 w-4" />Nouveau fournisseur
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {fournisseurs.data.map(f => (
                            <div key={f.id} className="group relative flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 font-bold text-sm">
                                        {f.raison_sociale.charAt(0).toUpperCase()}
                                    </div>
                                    <Badge className={`text-xs ${statutCls(f.statut)}`} variant="outline">{f.statut}</Badge>
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate font-semibold text-sm">{f.raison_sociale}</p>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        {f.ninea ? `NINEA: ${f.ninea}` : 'NINEA —'} · {f.pays ?? '—'}
                                    </p>
                                    {f.telephone && <p className="mt-0.5 text-xs text-muted-foreground">{f.telephone}</p>}
                                </div>
                                <div className="flex items-center justify-between border-t pt-2.5 mt-auto">
                                    <span className="text-xs text-muted-foreground">{f.marches_count} marché(s)</span>
                                    <div className="flex items-center gap-2">
                                        {f.score_global && (
                                            <span className="flex items-center gap-0.5 text-xs text-amber-500">
                                                <Star className="h-3 w-3 fill-amber-400" />
                                                {Number(f.score_global).toFixed(1)}/10
                                            </span>
                                        )}
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => setModal(f)}
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            <Dialog open={modal !== null} onOpenChange={open => !open && setModal(null)}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-emerald-600" />
                            {modal === 'create' ? 'Nouveau fournisseur' : 'Modifier le fournisseur'}
                        </DialogTitle>
                    </DialogHeader>
                    <FournisseurModal
                        key={typeof modal === 'object' && modal !== null ? modal.id : 'create'}
                        fournisseur={modal !== 'create' ? modal : null}
                        onClose={() => setModal(null)}
                    />
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
