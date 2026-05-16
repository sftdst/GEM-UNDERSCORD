import { Head, useForm } from '@inertiajs/react';
import { GitMerge, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface ModePassation {
    id: string;
    code: string;
    libelle: string;
    description: string | null;
    actif: boolean;
}

interface Props {
    modes: ModePassation[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'GMP', href: '/gmp' },
    { title: 'Paramétrage', href: '/gmp/admin/modes-passation' },
    { title: 'Modes de passation', href: '/gmp/admin/modes-passation' },
];

// ── Modal create / edit ────────────────────────────────────────────────────

interface ModalProps { mode?: ModePassation | null; onClose: () => void }

function ModeModal({ mode, onClose }: ModalProps) {
    const editing = !!mode;
    const { data, setData, post, put, processing, errors, reset } = useForm({
        code:        mode?.code ?? '',
        libelle:     mode?.libelle ?? '',
        description: mode?.description ?? '',
        actif:       mode?.actif ?? true,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            put(`/gmp/admin/modes-passation/${mode!.id}`, { onSuccess: () => { reset(); onClose(); } });
        } else {
            post('/gmp/admin/modes-passation', { onSuccess: () => { reset(); onClose(); } });
        }
    }

    return (
        <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label>Code <span className="text-destructive">*</span></Label>
                    <Input value={data.code} onChange={e => setData('code', e.target.value)} placeholder="AO" autoFocus />
                    {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label>Libellé <span className="text-destructive">*</span></Label>
                    <Input value={data.libelle} onChange={e => setData('libelle', e.target.value)} placeholder="Appel d'offres ouvert" />
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
                    {processing ? 'Enregistrement...' : editing ? 'Mettre à jour' : 'Créer le mode'}
                </Button>
            </DialogFooter>
        </form>
    );
}

// ── Page principale ────────────────────────────────────────────────────────

export default function ModesPassationIndex({ modes }: Props) {
    const [modal, setModal] = useState<'create' | ModePassation | null>(null);
    const { delete: destroy } = useForm();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Modes de passation" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">

                {/* En-tête */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100">
                            <GitMerge className="h-5 w-5 text-violet-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Modes de passation</h1>
                            <p className="text-sm text-muted-foreground">{modes.length} mode(s)</p>
                        </div>
                    </div>
                    <Button onClick={() => setModal('create')}>
                        <Plus className="mr-2 h-4 w-4" />Nouveau mode
                    </Button>
                </div>

                {/* Tableau */}
                {modes.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed">
                        <div className="py-16 text-center">
                            <GitMerge className="mx-auto mb-4 h-14 w-14 text-muted-foreground/25" />
                            <h3 className="text-base font-semibold">Aucun mode de passation</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Commencez par créer vos modes de passation.</p>
                            <Button className="mt-5" onClick={() => setModal('create')}>
                                <Plus className="mr-2 h-4 w-4" />Nouveau mode
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
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
                                    <th className="px-4 py-3 w-20" />
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {modes.map(m => (
                                    <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs font-semibold">{m.code}</td>
                                        <td className="px-4 py-3 font-medium">{m.libelle}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{m.description ?? '—'}</td>
                                        <td className="px-4 py-3">
                                            <Badge
                                                className={`text-xs ${m.actif ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}
                                                variant="outline"
                                            >
                                                {m.actif ? 'Actif' : 'Inactif'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7"
                                                    onClick={() => setModal(m)}
                                                    title="Modifier"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                                    onClick={() => destroy(`/gmp/admin/modes-passation/${m.id}`)}
                                                    title="Supprimer"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
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
            <Dialog open={modal !== null} onOpenChange={open => !open && setModal(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <GitMerge className="h-5 w-5 text-violet-600" />
                            {modal === 'create' ? 'Nouveau mode de passation' : 'Modifier le mode de passation'}
                        </DialogTitle>
                    </DialogHeader>
                    <ModeModal
                        key={typeof modal === 'object' && modal !== null ? modal.id : 'create'}
                        mode={modal !== 'create' ? modal : null}
                        onClose={() => setModal(null)}
                    />
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
