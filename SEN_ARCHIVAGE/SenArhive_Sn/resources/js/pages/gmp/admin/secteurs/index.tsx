import { Head, useForm } from '@inertiajs/react';
import { Layers, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Secteur {
    id: string;
    code: string;
    libelle: string;
    couleur: string | null;
    actif: boolean;
    marches_prevus_count: number;
}

interface Props {
    secteurs: Secteur[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'GMP', href: '/gmp' },
    { title: 'Paramétrage', href: '/gmp/admin/secteurs' },
    { title: "Secteurs d'intervention", href: '/gmp/admin/secteurs' },
];

// ── Modal create / edit ────────────────────────────────────────────────────

interface ModalProps { secteur?: Secteur | null; onClose: () => void }

function SecteurModal({ secteur, onClose }: ModalProps) {
    const editing = !!secteur;
    const { data, setData, post, put, processing, errors, reset } = useForm({
        code:    secteur?.code ?? '',
        libelle: secteur?.libelle ?? '',
        couleur: secteur?.couleur ?? '#6366f1',
        actif:   secteur?.actif ?? true,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            put(`/gmp/admin/secteurs/${secteur!.id}`, { onSuccess: () => { reset(); onClose(); } });
        } else {
            post('/gmp/admin/secteurs', { onSuccess: () => { reset(); onClose(); } });
        }
    }

    return (
        <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label>Code <span className="text-destructive">*</span></Label>
                    <Input value={data.code} onChange={e => setData('code', e.target.value)} placeholder="SANTE" autoFocus />
                    {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label>Libellé <span className="text-destructive">*</span></Label>
                    <Input value={data.libelle} onChange={e => setData('libelle', e.target.value)} placeholder="Santé" />
                    {errors.libelle && <p className="text-xs text-destructive">{errors.libelle}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label>Couleur</Label>
                    <div className="flex items-center gap-3">
                        <input
                            type="color"
                            value={data.couleur}
                            onChange={e => setData('couleur', e.target.value)}
                            className="h-9 w-12 cursor-pointer rounded-md border border-input p-0.5"
                        />
                        <span className="font-mono text-sm text-muted-foreground">{data.couleur}</span>
                    </div>
                </div>
                {editing && (
                    <div className="space-y-1.5">
                        <Label>Statut</Label>
                        <select
                            value={data.actif ? 'actif' : 'inactif'}
                            onChange={e => setData('actif', e.target.value === 'actif')}
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                            <option value="actif">Actif</option>
                            <option value="inactif">Inactif</option>
                        </select>
                    </div>
                )}
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
                <Button type="submit" disabled={processing}>
                    {processing ? 'Enregistrement...' : editing ? 'Mettre à jour' : 'Créer le secteur'}
                </Button>
            </DialogFooter>
        </form>
    );
}

// ── Page principale ────────────────────────────────────────────────────────

export default function SecteursIndex({ secteurs }: Props) {
    const [modal, setModal] = useState<'create' | Secteur | null>(null);
    const { delete: destroy } = useForm();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Secteurs d'intervention" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">

                {/* En-tête */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
                            <Layers className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Secteurs d'intervention</h1>
                            <p className="text-sm text-muted-foreground">{secteurs.length} secteur(s)</p>
                        </div>
                    </div>
                    <Button onClick={() => setModal('create')}>
                        <Plus className="mr-2 h-4 w-4" />Nouveau secteur
                    </Button>
                </div>

                {/* Grille */}
                {secteurs.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed">
                        <div className="py-16 text-center">
                            <Layers className="mx-auto mb-4 h-14 w-14 text-muted-foreground/25" />
                            <h3 className="text-base font-semibold">Aucun secteur</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Ajoutez les secteurs d'intervention.</p>
                            <Button className="mt-5" onClick={() => setModal('create')}>
                                <Plus className="mr-2 h-4 w-4" />Nouveau secteur
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {secteurs.map(s => (
                            <div key={s.id} className="group relative flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div
                                            className="h-9 w-9 shrink-0 rounded-lg"
                                            style={{ backgroundColor: s.couleur ?? '#6366f1' }}
                                        />
                                        <div className="min-w-0">
                                            <p className="truncate font-semibold">{s.libelle}</p>
                                            <p className="text-xs font-mono text-muted-foreground">{s.code}</p>
                                        </div>
                                    </div>
                                    <Badge
                                        className={`shrink-0 text-xs ${s.actif ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}
                                        variant="outline"
                                    >
                                        {s.actif ? 'Actif' : 'Inactif'}
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between border-t pt-2.5 mt-auto">
                                    <span className="text-xs text-muted-foreground">{s.marches_prevus_count} marché(s)</span>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7"
                                            onClick={() => setModal(s)}
                                            title="Modifier"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        {s.marches_prevus_count === 0 && (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7 text-destructive hover:text-destructive"
                                                onClick={() => destroy(`/gmp/admin/secteurs/${s.id}`)}
                                                title="Supprimer"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            <Dialog open={modal !== null} onOpenChange={open => !open && setModal(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Layers className="h-5 w-5 text-emerald-600" />
                            {modal === 'create' ? "Nouveau secteur d'intervention" : "Modifier le secteur"}
                        </DialogTitle>
                    </DialogHeader>
                    <SecteurModal
                        key={typeof modal === 'object' && modal !== null ? modal.id : 'create'}
                        secteur={modal !== 'create' ? modal : null}
                        onClose={() => setModal(null)}
                    />
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
