import { Head, router } from '@inertiajs/react';
import { CheckCircle, Filter, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
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
    filters: { niveau?: string; traite?: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'GMP', href: '/gmp' },
    { title: 'Alertes IA', href: '/gmp/alertes' },
];

const NIVEAUX = [
    { value: 'critique', label: 'Critique', badge: 'bg-red-100 text-red-700 border-red-200',       border: 'border-l-red-500' },
    { value: 'urgent',   label: 'Urgent',   badge: 'bg-orange-100 text-orange-700 border-orange-200', border: 'border-l-orange-400' },
    { value: 'attention',label: 'Attention',badge: 'bg-yellow-100 text-yellow-700 border-yellow-200', border: 'border-l-yellow-400' },
    { value: 'info',     label: 'Info',     badge: 'bg-blue-100 text-blue-700 border-blue-200',     border: 'border-l-blue-400' },
];

function getNiveau(val: string) {
    return NIVEAUX.find(n => n.value === val) ?? NIVEAUX[3];
}

function fmtDate(iso: string) {
    return new Intl.DateTimeFormat('fr-SN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

export default function AlertesIndex({ alertes, filters }: Props) {
    const [niveau, setNiveau] = useState(filters.niveau ?? '');
    const [traite, setTraite] = useState(filters.traite ?? '');

    useEffect(() => {
        const t = setTimeout(() => {
            router.get('/gmp/alertes', { niveau, traite }, { preserveState: true, replace: true });
        }, 200);
        return () => clearTimeout(t);
    }, [niveau, traite]);

    const resetFilters = () => { setNiveau(''); setTraite(''); };
    const hasFilters = !!(niveau || traite);
    const nonTraitees = alertes.data.filter(a => !a.traite).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Alertes IA" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">

                {/* En-tête */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
                            <Sparkles className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Alertes IA</h1>
                            <p className="text-sm text-muted-foreground">
                                {alertes.total} alerte(s)
                                {nonTraitees > 0 && (
                                    <span className="ml-1.5 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                                        {nonTraitees} non traitée(s)
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filtres */}
                <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3">
                    <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <select
                        value={niveau}
                        onChange={e => setNiveau(e.target.value)}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                        <option value="">Tous les niveaux</option>
                        {NIVEAUX.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                    </select>
                    <select
                        value={traite}
                        onChange={e => setTraite(e.target.value)}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                        <option value="">Toutes les alertes</option>
                        <option value="0">Non traitées</option>
                        <option value="1">Traitées</option>
                    </select>
                    {hasFilters && (
                        <Button size="sm" variant="ghost" onClick={resetFilters} className="gap-1.5 text-muted-foreground">
                            <X className="h-3.5 w-3.5" />Réinitialiser
                        </Button>
                    )}
                </div>

                {/* Liste */}
                {alertes.data.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center">
                        <div className="text-center">
                            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-400/50" />
                            <h3 className="text-lg font-medium">Aucune alerte</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {hasFilters ? 'Aucune alerte ne correspond à ces filtres.' : "L'IA n'a détecté aucun risque pour le moment."}
                            </p>
                            {hasFilters && (
                                <Button variant="outline" className="mt-4" onClick={resetFilters}>
                                    Effacer les filtres
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {alertes.data.map(a => {
                            const style = getNiveau(a.niveau);
                            return (
                                <Card
                                    key={a.id}
                                    className={`border-l-4 ${style.border} transition-opacity ${a.traite ? 'opacity-60' : ''}`}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Badge className={`text-xs ${style.badge}`} variant="outline">
                                                        {style.label}
                                                    </Badge>
                                                    {a.entite_type && (
                                                        <span className="text-xs text-muted-foreground">{a.entite_type}</span>
                                                    )}
                                                    {a.traite && (
                                                        <Badge className="text-xs bg-gray-100 text-gray-500 border-gray-200" variant="outline">
                                                            Traitée
                                                        </Badge>
                                                    )}
                                                    <span className="ml-auto text-xs text-muted-foreground">{fmtDate(a.created_at)}</span>
                                                </div>
                                                <p className="mt-2 font-semibold">{a.titre}</p>
                                                <p className="mt-0.5 text-sm text-muted-foreground">{a.description}</p>
                                                {a.recommandation && (
                                                    <div className="mt-2 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                                                        <span className="font-medium">Recommandation :</span> {a.recommandation}
                                                    </div>
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
