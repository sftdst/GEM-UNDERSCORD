import { Head, useForm } from '@inertiajs/react';
import { FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface TypeMarche {
    id: string;
    code: string;
    libelle: string;
    description: string | null;
    actif: boolean;
    marches_prevus_count: number;
}

interface Props {
    types: TypeMarche[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'GMP', href: '/gmp' },
    { title: 'Paramétrage', href: '/gmp/admin/types-marche' },
    { title: 'Types de marché', href: '/gmp/admin/types-marche' },
];

// ── Modal create / edit ────────────────────────────────────────────────────

interface ModalProps { type?: TypeMarche | null; onClose: () => void }

function TypeMarcheModal({ type, onClose }: ModalProps) {
    const editing = !!type;
    const { data, setData, post, put, processing, errors, reset } = useForm({
        code:        type?.code ?? '',
        libelle:     type?.libelle ?? '',
        description: type?.description ?? '',
        actif:       type?.actif ?? true,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            put(`/gmp/admin/types-marche/${type!.id}`, { onSuccess: () => { reset(); onClose(); } });
        } else {
            post('/gmp/admin/types-marche', { onSuccess: () => { reset(); onClose(); } });
        }
    }

    return (
        <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label>Code <span className="text-destructive">*</span></Label>
                    <Input value={data.code} onChange={e => setData('code', e.target.value)} placeholder="TRAV" autoFocus />
                    {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label>Libellé <span className="text-destructive">*</span></Label>
                    <Input value={data.libelle} onChange={e => setData('libelle', e.target.value)} placeholder="Travaux" />
                    {errors.libelle && <p className="text-xs text-destructive">{errors.libelle}</p>}
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                    <Label>Description</Label>
                    <Input value={data.description} onChange={e => setData('description', e.target.value)} placeholder="Description optionnelle…" />
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
                    {processing ? 'Enregistrement...' : editing ? 'Mettre à jour' : 'Créer le type'}
                </Button>
            </DialogFooter>
        </form>
    );
}

// ── Page principale ────────────────────────────────────────────────────────

export default function TypesMarcheIndex({ types }: Props) {
    const [modal, setModal] = useState<'create' | TypeMarche | null>(null);
    const { delete: destroy } = useForm();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Types de marché" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">

                {/* En-tête */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                            <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Types de marché</h1>
                            <p className="text-sm text-muted-foreground">{types.length} type(s)</p>
                        </div>
                    </div>
                    <Button onClick={() => setModal('create')}>
                        <Plus className="mr-2 h-4 w-4" />Nouveau type
                    </Button>
                </div>

                {/* Tableau */}
                {types.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed">
                        <div className="py-16 text-center">
                            <FileText className="mx-auto mb-4 h-14 w-14 text-muted-foreground/25" />
                            <h3 className="text-base font-semibold">Aucun type de marché</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Commencez par créer vos types de marché.</p>
                            <Button className="mt-5" onClick={() => setModal('create')}>
                                <Plus className="mr-2 h-4 w-4" />Nouveau type
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border shadow-sm">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/40">
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Code</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Libellé</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
                                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Marchés</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
                                    <th className="px-4 py-3 w-20" />
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {types.map(t => (
                                    <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs font-semibold">{t.code}</td>
                                        <td className="px-4 py-3 font-medium">{t.libelle}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{t.description ?? '—'}</td>
                                        <td className="px-4 py-3 text-center tabular-nums">{t.marches_prevus_count}</td>
                                        <td className="px-4 py-3">
                                            <Badge
                                                className={`text-xs ${t.actif ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}
                                                variant="outline"
                                            >
                                                {t.actif ? 'Actif' : 'Inactif'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7"
                                                    onClick={() => setModal(t)}
                                                    title="Modifier"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                {t.marches_prevus_count === 0 && (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-7 w-7 text-destructive hover:text-destructive"
                                                        onClick={() => destroy(`/gmp/admin/types-marche/${t.id}`)}
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
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
            <Dialog open={modal !== null} onOpenChange={open => !open && setModal(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-600" />
                            {modal === 'create' ? 'Nouveau type de marché' : 'Modifier le type de marché'}
                        </DialogTitle>
                    </DialogHeader>
                    <TypeMarcheModal
                        key={typeof modal === 'object' && modal !== null ? modal.id : 'create'}
                        type={modal !== 'create' ? modal : null}
                        onClose={() => setModal(null)}
                    />
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
