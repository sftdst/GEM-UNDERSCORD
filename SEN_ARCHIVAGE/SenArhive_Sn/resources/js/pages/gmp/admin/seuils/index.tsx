import { Head } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface SeuilReglementaire {
    id: string;
    annee_application: number;
    montant_min: string | null;
    montant_max: string | null;
    type_marche: { libelle: string } | null;
    mode_passation: { libelle: string } | null;
    source_reglementaire: string | null;
}

interface Props {
    seuils: SeuilReglementaire[];
    types_marche: { id: string; libelle: string }[];
    modes_passation: { id: string; libelle: string }[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'GMP', href: '/gmp' },
    { title: 'Paramétrage', href: '/gmp/admin/seuils' },
    { title: 'Seuils réglementaires', href: '/gmp/admin/seuils' },
];

function formatMontant(val: string | null) {
    if (!val) return '—';
    return new Intl.NumberFormat('fr-SN', { maximumFractionDigits: 0 }).format(Number(val)) + ' FCFA';
}

export default function SeuilsIndex({ seuils }: Props) {
    const years = [...new Set(seuils.map(s => s.annee_application))].sort((a, b) => b - a);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Seuils réglementaires ARMP" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100">
                        <ShieldCheck className="h-5 w-5 text-rose-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Seuils réglementaires ARMP</h1>
                        <p className="text-sm text-muted-foreground">
                            {seuils.length} seuil(s) · données de référence du Code des Marchés Publics du Sénégal
                        </p>
                    </div>
                </div>

                {seuils.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center">
                        <div className="text-center">
                            <ShieldCheck className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
                            <h3 className="text-lg font-medium">Aucun seuil défini</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Les seuils ARMP seront chargés via le seeder.</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {years.map(year => (
                            <Card key={year}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        Exercice {year}
                                        <Badge className="bg-rose-100 text-rose-700 text-xs" variant="outline">
                                            {seuils.filter(s => s.annee_application === year).length} seuils
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-hidden rounded-md border">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/50">
                                                <tr>
                                                    <th className="px-4 py-2.5 text-left font-medium">Type de marché</th>
                                                    <th className="px-4 py-2.5 text-left font-medium">Mode de passation</th>
                                                    <th className="px-4 py-2.5 text-right font-medium">Montant min</th>
                                                    <th className="px-4 py-2.5 text-right font-medium">Montant max</th>
                                                    <th className="px-4 py-2.5 text-left font-medium">Source</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {seuils
                                                    .filter(s => s.annee_application === year)
                                                    .map(s => (
                                                        <tr key={s.id} className="hover:bg-muted/30">
                                                            <td className="px-4 py-2.5">{s.type_marche?.libelle ?? '—'}</td>
                                                            <td className="px-4 py-2.5 text-muted-foreground">{s.mode_passation?.libelle ?? '—'}</td>
                                                            <td className="px-4 py-2.5 text-right tabular-nums">{formatMontant(s.montant_min)}</td>
                                                            <td className="px-4 py-2.5 text-right tabular-nums">{formatMontant(s.montant_max)}</td>
                                                            <td className="px-4 py-2.5 text-xs text-muted-foreground">{s.source_reglementaire ?? '—'}</td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
