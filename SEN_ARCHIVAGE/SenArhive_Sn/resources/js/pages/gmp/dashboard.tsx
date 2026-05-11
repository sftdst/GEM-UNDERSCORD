import { Head } from '@inertiajs/react';
import { AlertTriangle, BarChart3, FileCheck2, Megaphone, Scale, TrendingUp, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Stats {
    marches_actifs: number;
    appels_offres_ouverts: number;
    fournisseurs_actifs: number;
    alertes_non_traitees: number;
}

interface Props {
    stats: Stats;
    exercice: { annee: number; budget_global: string | null; statut: string } | null;
    marches_recents: Array<{ id: string; numero_marche: string; intitule: string; statut: string; statut_risque: string; montant_actuel_ht: string; fournisseur?: { raison_sociale: string } }>;
    alertes: Array<{ id: string; titre: string; niveau: string; description: string }>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'GMP', href: '/gmp' },
    { title: 'Tableau de bord', href: '/gmp' },
];

const niveauColor: Record<string, string> = {
    critique: 'bg-red-100 text-red-700 border-red-200',
    urgent:   'bg-orange-100 text-orange-700 border-orange-200',
    attention:'bg-yellow-100 text-yellow-700 border-yellow-200',
    info:     'bg-blue-100 text-blue-700 border-blue-200',
};

const risqueColor: Record<string, string> = {
    rouge:  'bg-red-500',
    orange: 'bg-orange-400',
    vert:   'bg-green-500',
};

function formatMontant(val: string | null) {
    if (!val) return '—';
    return new Intl.NumberFormat('fr-SN', { maximumFractionDigits: 0 }).format(Number(val)) + ' FCFA';
}

export default function GmpDashboard({ stats, exercice, marches_recents, alertes }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tableau de bord GMP" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">

                {/* En-tête */}
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Scale className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">GMP Intelligence</h1>
                        <p className="text-sm text-muted-foreground">
                            Gestion des Marchés Publics & Privés
                            {exercice && <span className="ml-2 font-medium text-foreground">— Exercice {exercice.annee}</span>}
                        </p>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Card>
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                                <FileCheck2 className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.marches_actifs}</p>
                                <p className="text-sm text-muted-foreground">Marchés actifs</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                                <Megaphone className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.appels_offres_ouverts}</p>
                                <p className="text-sm text-muted-foreground">Appels d'offres ouverts</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                                <Users className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.fournisseurs_actifs}</p>
                                <p className="text-sm text-muted-foreground">Fournisseurs actifs</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.alertes_non_traitees}</p>
                                <p className="text-sm text-muted-foreground">Alertes IA en attente</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Marchés récents */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-base font-semibold">Marchés récents</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="p-0">
                            {marches_recents.length === 0 ? (
                                <p className="px-5 pb-5 text-sm text-muted-foreground">Aucun marché enregistré.</p>
                            ) : (
                                <ul className="divide-y">
                                    {marches_recents.map((m) => (
                                        <li key={m.id} className="flex items-center justify-between px-5 py-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium">{m.intitule}</p>
                                                <p className="text-xs text-muted-foreground">{m.numero_marche} · {m.fournisseur?.raison_sociale ?? '—'}</p>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2 pl-3">
                                                <span className={`h-2 w-2 rounded-full ${risqueColor[m.statut_risque] ?? 'bg-gray-400'}`} />
                                                <span className="text-xs font-medium">{formatMontant(m.montant_actuel_ht)}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>

                    {/* Alertes IA */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-base font-semibold">Alertes IA prioritaires</CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="p-0">
                            {alertes.length === 0 ? (
                                <p className="px-5 pb-5 text-sm text-muted-foreground">Aucune alerte en attente.</p>
                            ) : (
                                <ul className="divide-y">
                                    {alertes.map((a) => (
                                        <li key={a.id} className="px-5 py-3">
                                            <div className="flex items-start gap-2">
                                                <Badge className={`shrink-0 text-xs capitalize ${niveauColor[a.niveau] ?? ''}`} variant="outline">
                                                    {a.niveau}
                                                </Badge>
                                                <p className="text-sm">{a.titre}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
