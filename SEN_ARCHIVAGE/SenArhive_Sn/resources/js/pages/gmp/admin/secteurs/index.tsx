import { Head, useForm } from '@inertiajs/react';
import { Layers, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { useState } from 'react';

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

function SecteurForm({ onSuccess }: { onSuccess: () => void }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        code: '', libelle: '', couleur: '#6366f1',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/gmp/admin/secteurs', { onSuccess: () => { reset(); onSuccess(); } });
    }

    return (
        <Card>
            <CardContent className="p-5">
                <form onSubmit={submit} className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1">
                        <Label htmlFor="code">Code *</Label>
                        <Input id="code" value={data.code} onChange={e => setData('code', e.target.value)} placeholder="SANTE" />
                        {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="libelle">Libellé *</Label>
                        <Input id="libelle" value={data.libelle} onChange={e => setData('libelle', e.target.value)} placeholder="Santé" />
                        {errors.libelle && <p className="text-xs text-destructive">{errors.libelle}</p>}
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="couleur">Couleur</Label>
                        <div className="flex items-center gap-2">
                            <input
                                id="couleur"
                                type="color"
                                value={data.couleur}
                                onChange={e => setData('couleur', e.target.value)}
                                className="h-9 w-9 cursor-pointer rounded border border-input p-0.5"
                            />
                            <span className="text-sm text-muted-foreground">{data.couleur}</span>
                        </div>
                    </div>
                    <div className="flex items-end gap-2 sm:col-span-3">
                        <Button type="submit" disabled={processing}>Ajouter</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

export default function SecteursIndex({ secteurs }: Props) {
    const [showForm, setShowForm] = useState(false);
    const { delete: destroy } = useForm();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Secteurs d'intervention" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
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
                    <Button onClick={() => setShowForm(!showForm)}>
                        <Plus className="mr-2 h-4 w-4" />Nouveau secteur
                    </Button>
                </div>

                {showForm && <SecteurForm onSuccess={() => setShowForm(false)} />}

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {secteurs.map((s) => (
                        <Card key={s.id} className="group">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div
                                            className="h-8 w-8 shrink-0 rounded-lg"
                                            style={{ backgroundColor: s.couleur ?? '#6366f1' }}
                                        />
                                        <div className="min-w-0">
                                            <p className="truncate font-semibold">{s.libelle}</p>
                                            <p className="text-xs font-mono text-muted-foreground">{s.code}</p>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 flex-col items-end gap-1">
                                        <Badge className={`text-xs ${s.actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`} variant="outline">
                                            {s.actif ? 'Actif' : 'Inactif'}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">{s.marches_prevus_count} marché(s)</span>
                                    </div>
                                </div>
                                {s.marches_prevus_count === 0 && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="mt-3 h-7 w-full text-xs text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => destroy(`/gmp/admin/secteurs/${s.id}`)}
                                    >
                                        <Trash2 className="mr-1 h-3 w-3" />Supprimer
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {secteurs.length === 0 && (
                    <div className="flex flex-1 items-center justify-center">
                        <div className="text-center">
                            <Layers className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
                            <h3 className="text-lg font-medium">Aucun secteur</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Ajoutez les secteurs d'intervention.</p>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
