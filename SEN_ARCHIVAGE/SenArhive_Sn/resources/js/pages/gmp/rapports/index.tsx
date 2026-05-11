import { Head } from '@inertiajs/react';
import { BarChart3, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'GMP', href: '/gmp' },
    { title: 'Rapports & Anomalies', href: '/gmp/rapports' },
];

const rapports = [
    { titre: 'Rapport d\'exécution des marchés', description: 'État d\'avancement global de tous les marchés actifs', icone: FileText },
    { titre: 'Rapport PPM vs Réalisations', description: 'Comparaison entre les prévisions du PPM et les réalisations effectives', icone: BarChart3 },
    { titre: 'Rapport des anomalies détectées', description: 'Liste des anomalies identifiées par l\'IA avec score de confiance', icone: BarChart3 },
    { titre: 'Rapport des fournisseurs', description: 'Évaluation des fournisseurs et historique des marchés', icone: FileText },
];

export default function RapportsIndex() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Rapports & Anomalies" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100">
                        <BarChart3 className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Rapports & Anomalies</h1>
                        <p className="text-sm text-muted-foreground">Rapports générés par l'IA et tableaux de suivi</p>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    {rapports.map((r) => (
                        <Card key={r.titre} className="group hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <r.icone className="h-4 w-4 text-muted-foreground" />
                                    {r.titre}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">{r.description}</p>
                                <Button size="sm" variant="outline" className="mt-4">
                                    <Download className="mr-2 h-3.5 w-3.5" />
                                    Générer le rapport
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
