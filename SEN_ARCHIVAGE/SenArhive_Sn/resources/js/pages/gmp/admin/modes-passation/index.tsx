import { Head, useForm } from '@inertiajs/react';
import { GitMerge, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { useState } from 'react';

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

function ModeForm({ onSuccess }: { onSuccess: () => void }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        code: '', libelle: '', description: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/gmp/admin/modes-passation', { onSuccess: () => { reset(); onSuccess(); } });
    }

    return (
        <Card>
            <CardContent className="p-5">
                <form onSubmit={submit} className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1">
                        <Label htmlFor="code">Code *</Label>
                        <Input id="code" value={data.code} onChange={e => setData('code', e.target.value)} placeholder="AO" />
                        {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="libelle">Libellé *</Label>
                        <Input id="libelle" value={data.libelle} onChange={e => setData('libelle', e.target.value)} placeholder="Appel d'offres ouvert" />
                        {errors.libelle && <p className="text-xs text-destructive">{errors.libelle}</p>}
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="description">Description</Label>
                        <Input id="description" value={data.description} onChange={e => setData('description', e.target.value)} />
                    </div>
                    <div className="flex items-end gap-2 sm:col-span-3">
                        <Button type="submit" disabled={processing}>Ajouter</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

export default function ModesPassationIndex({ modes }: Props) {
    const [showForm, setShowForm] = useState(false);
    const { delete: destroy } = useForm();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Modes de passation" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
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
                    <Button onClick={() => setShowForm(!showForm)}>
                        <Plus className="mr-2 h-4 w-4" />Nouveau mode
                    </Button>
                </div>

                {showForm && <ModeForm onSuccess={() => setShowForm(false)} />}

                <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">Code</th>
                                <th className="px-4 py-3 text-left font-medium">Libellé</th>
                                <th className="px-4 py-3 text-left font-medium">Description</th>
                                <th className="px-4 py-3 text-left font-medium">Statut</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {modes.map((m) => (
                                <tr key={m.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3 font-mono text-xs font-semibold">{m.code}</td>
                                    <td className="px-4 py-3 font-medium">{m.libelle}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{m.description ?? '—'}</td>
                                    <td className="px-4 py-3">
                                        <Badge className={`text-xs ${m.actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`} variant="outline">
                                            {m.actif ? 'Actif' : 'Inactif'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7 text-destructive hover:text-destructive"
                                            onClick={() => destroy(`/gmp/admin/modes-passation/${m.id}`)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
