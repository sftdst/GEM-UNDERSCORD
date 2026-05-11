import { Head, router } from '@inertiajs/react';
import { CheckCircle, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Alerte {
    id: string;
    titre: string;
    description: string;
    niveau: string;
    entite_type: string | null;
    recommandation: string | null;
    traite: boolean;
    created_at: string;
}

interface Props {
    alertes: { data: Alerte[]; total: number };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'GMP', href: '/gmp' },
    { title: 'Alertes IA', href: '/gmp/alertes' },
];

const niveauStyle: Record<string, { badge: string; border: string }> = {
    critique: { badge: 'bg-red-100 text-red-700',    border: 'border-l-red-500' },
    urgent:   { badge: 'bg-orange-100 text-orange-700', border: 'border-l-orange-400' },
    attention:{ badge: 'bg-yellow-100 text-yellow-700', border: 'border-l-yellow-400' },
    info:     { badge: 'bg-blue-100 text-blue-700',   border: 'border-l-blue-400' },
};

export default function AlertesIndex({ alertes }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Alertes IA" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
                        <Sparkles className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Alertes IA</h1>
                        <p className="text-sm text-muted-foreground">{alertes.total} alerte(s) · {alertes.data.filter(a => !a.traite).length} non traitée(s)</p>
                    </div>
                </div>

                {alertes.data.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center">
                        <div className="text-center">
                            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-400/50" />
                            <h3 className="text-lg font-medium">Aucune alerte</h3>
                            <p className="mt-1 text-sm text-muted-foreground">L'IA n'a détecté aucun risque pour le moment.</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {alertes.data.map((a) => {
                            const style = niveauStyle[a.niveau] ?? niveauStyle.info;
                            return (
                                <Card key={a.id} className={`border-l-4 ${style.border} ${a.traite ? 'opacity-60' : ''}`}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge className={`text-xs ${style.badge}`} variant="outline">
                                                        {a.niveau}
                                                    </Badge>
                                                    {a.entite_type && (
                                                        <span className="text-xs text-muted-foreground">{a.entite_type}</span>
                                                    )}
                                                </div>
                                                <p className="mt-1 font-medium">{a.titre}</p>
                                                <p className="mt-0.5 text-sm text-muted-foreground">{a.description}</p>
                                                {a.recommandation && (
                                                    <p className="mt-2 text-sm text-blue-700 dark:text-blue-400">
                                                        <span className="font-medium">Recommandation :</span> {a.recommandation}
                                                    </p>
                                                )}
                                            </div>
                                            {!a.traite && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="shrink-0"
                                                    onClick={() => router.post(`/gmp/alertes/${a.id}/traiter`)}
                                                >
                                                    <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                                                    Traiter
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
