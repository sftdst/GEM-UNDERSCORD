import { Head, router, useForm } from '@inertiajs/react';
import { CalendarDays, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { useState } from 'react';

interface Exercice {
    id: string;
    annee: number;
    budget_global: string | null;
    statut: string;
    date_ouverture: string | null;
    date_cloture: string | null;
}

interface Props {
    exercices: Exercice[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'GMP', href: '/gmp' },
    { title: 'Paramétrage', href: '/gmp/admin/exercices' },
    { title: 'Exercices budgétaires', href: '/gmp/admin/exercices' },
];

const statutColor: Record<string, string> = {
    preparation: 'bg-gray-100 text-gray-700',
    ouvert:      'bg-green-100 text-green-700',
    cloture:     'bg-blue-100 text-blue-700',
};

function formatBudget(val: string | null) {
    if (!val) return '—';
    return new Intl.NumberFormat('fr-SN', { maximumFractionDigits: 0 }).format(Number(val)) + ' FCFA';
}

export default function ExercicesIndex({ exercices }: Props) {
    const [showForm, setShowForm] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        annee: new Date().getFullYear() + 1,
        budget_global: '',
        statut: 'preparation',
        date_ouverture: '',
        date_cloture: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/gmp/admin/exercices', {
            onSuccess: () => { reset(); setShowForm(false); },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Exercices budgétaires" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100">
                            <CalendarDays className="h-5 w-5 text-sky-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Exercices budgétaires</h1>
                            <p className="text-sm text-muted-foreground">{exercices.length} exercice(s) enregistré(s)</p>
                        </div>
                    </div>
                    <Button onClick={() => setShowForm(!showForm)}>
                        <Plus className="mr-2 h-4 w-4" />Nouvel exercice
                    </Button>
                </div>

                {showForm && (
                    <Card>
                        <CardContent className="p-5">
                            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <div className="space-y-1">
                                    <Label htmlFor="annee">Année *</Label>
                                    <Input id="annee" type="number" value={data.annee} onChange={e => setData('annee', Number(e.target.value))} />
                                    {errors.annee && <p className="text-xs text-destructive">{errors.annee}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="budget_global">Budget global (FCFA)</Label>
                                    <Input id="budget_global" type="number" value={data.budget_global} onChange={e => setData('budget_global', e.target.value)} placeholder="0" />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="statut">Statut *</Label>
                                    <select id="statut" value={data.statut} onChange={e => setData('statut', e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                                        <option value="preparation">Préparation</option>
                                        <option value="ouvert">Ouvert</option>
                                        <option value="cloture">Clôturé</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="date_ouverture">Date d'ouverture</Label>
                                    <Input id="date_ouverture" type="date" value={data.date_ouverture} onChange={e => setData('date_ouverture', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="date_cloture">Date de clôture</Label>
                                    <Input id="date_cloture" type="date" value={data.date_cloture} onChange={e => setData('date_cloture', e.target.value)} />
                                </div>
                                <div className="flex items-end gap-2">
                                    <Button type="submit" disabled={processing}>Créer</Button>
                                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {exercices.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center">
                        <div className="text-center">
                            <CalendarDays className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
                            <h3 className="text-lg font-medium">Aucun exercice budgétaire</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Créez le premier exercice budgétaire.</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-lg border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">Année</th>
                                    <th className="px-4 py-3 text-left font-medium">Budget global</th>
                                    <th className="px-4 py-3 text-left font-medium">Ouverture</th>
                                    <th className="px-4 py-3 text-left font-medium">Clôture</th>
                                    <th className="px-4 py-3 text-left font-medium">Statut</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {exercices.map((ex) => (
                                    <tr key={ex.id} className="hover:bg-muted/30">
                                        <td className="px-4 py-3 font-bold">{ex.annee}</td>
                                        <td className="px-4 py-3">{formatBudget(ex.budget_global)}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{ex.date_ouverture ?? '—'}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{ex.date_cloture ?? '—'}</td>
                                        <td className="px-4 py-3">
                                            <Badge className={`text-xs ${statutColor[ex.statut] ?? ''}`} variant="outline">
                                                {ex.statut}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
