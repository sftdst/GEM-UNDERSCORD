import { Head, router } from '@inertiajs/react';
import {
    Users, Building2, Download, Activity,
    TrendingUp, UserCheck,
} from 'lucide-react';
import { useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, Legend,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SuperAdminLayout from '@/layouts/superadmin-layout';

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrgRapport {
    id: string;
    nom: string;
    statut: string;
    total_utilisateurs: number;
    connectes: number;
    taux_connexion: number;
    derniere_connexion: string | null;
}

interface ChartEntry {
    nom: string;
    connectes: number;
    total: number;
}

interface Stats {
    total_utilisateurs: number;
    connectes_periode: number;
    orgs_avec_connexions: number;
    periode_label: string;
}

interface Props {
    rapport: OrgRapport[];
    chartData: ChartEntry[];
    stats: Stats;
    filters: { periode?: string; date_from?: string; date_to?: string };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d: string | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

const BAR_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
                    '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#3b82f6'];

// ─── Composant ───────────────────────────────────────────────────────────────

export default function RapportUtilisateurs({ rapport, chartData, stats, filters }: Props) {
    const [periode, setPeriode]   = useState(filters.periode ?? '7d');
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo]     = useState(filters.date_to ?? '');

    const applyFilters = () => {
        const params: Record<string, string> = { periode };
        if (periode === 'custom') {
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo)   params.date_to   = dateTo;
        }
        router.get('/superadmin/utilisateurs/rapport', params, { preserveScroll: true });
    };

    const exportUrl = () => {
        const params = new URLSearchParams({ periode });
        if (periode === 'custom') {
            if (dateFrom) params.set('date_from', dateFrom);
            if (dateTo)   params.set('date_to', dateTo);
        }
        return '/superadmin/utilisateurs/rapport/export?' + params.toString();
    };

    const breadcrumbs = [
        { title: 'Tableau de bord', href: '/superadmin' },
        { title: 'Rapport connexions', href: '/superadmin/utilisateurs/rapport' },
    ];

    const periodes = [
        { value: '24h', label: '24 heures' },
        { value: '7d',  label: '7 jours' },
        { value: '30d', label: '30 jours' },
        { value: 'custom', label: 'Personnalisé' },
    ];

    return (
        <SuperAdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Rapport connexions — SuperAdmin" />

            <div className="space-y-6">

                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <TrendingUp className="w-6 h-6 text-indigo-600" />
                            Rapport des connexions
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Activité des utilisateurs par organisation — <span className="font-medium">{stats.periode_label}</span>
                        </p>
                    </div>
                    <a href={exportUrl()}>
                        <Button variant="outline" className="gap-2">
                            <Download className="w-4 h-4" />
                            Exporter CSV
                        </Button>
                    </a>
                </div>

                {/* ── Sélecteur de période ─────────────────────────────────── */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-sm font-medium text-gray-600">Période :</span>
                            <div className="flex rounded-lg border overflow-hidden">
                                {periodes.map(p => (
                                    <button
                                        key={p.value}
                                        onClick={() => setPeriode(p.value)}
                                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                                            periode === p.value
                                                ? 'bg-indigo-600 text-white'
                                                : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>

                            {periode === 'custom' && (
                                <>
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={e => setDateFrom(e.target.value)}
                                        className="rounded-md border px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500"
                                    />
                                    <span className="text-gray-400 text-sm">au</span>
                                    <input
                                        type="date"
                                        value={dateTo}
                                        onChange={e => setDateTo(e.target.value)}
                                        className="rounded-md border px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500"
                                    />
                                </>
                            )}

                            <Button onClick={applyFilters} size="sm" className="gap-2">
                                <Activity className="w-4 h-4" />
                                Générer
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* ── KPI Cards ────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Total utilisateurs</p>
                                    <p className="text-3xl font-bold text-gray-800 mt-1">
                                        {stats.total_utilisateurs.toLocaleString('fr-FR')}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">sur toute la plateforme</p>
                                </div>
                                <div className="p-3 rounded-xl bg-blue-50">
                                    <Users className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Connectés sur la période</p>
                                    <p className="text-3xl font-bold text-indigo-600 mt-1">
                                        {stats.connectes_periode.toLocaleString('fr-FR')}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {stats.total_utilisateurs > 0
                                            ? Math.round(stats.connectes_periode / stats.total_utilisateurs * 100)
                                            : 0}% du total
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-indigo-50">
                                    <UserCheck className="w-6 h-6 text-indigo-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Organisations actives</p>
                                    <p className="text-3xl font-bold text-green-600 mt-1">
                                        {stats.orgs_avec_connexions}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">avec au moins 1 connexion</p>
                                </div>
                                <div className="p-3 rounded-xl bg-green-50">
                                    <Building2 className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Graphique : Utilisateurs connectés par organisation ──── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-500" />
                            Utilisateurs connectés par organisation (Top 10)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {chartData.length === 0 ? (
                            <div className="flex h-56 items-center justify-center text-gray-400 text-sm">
                                Aucune connexion enregistrée sur cette période
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart
                                    data={chartData}
                                    margin={{ top: 5, right: 20, left: 0, bottom: 60 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="nom"
                                        tick={{ fontSize: 11, fill: '#6b7280' }}
                                        angle={-30}
                                        textAnchor="end"
                                        interval={0}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: '#6b7280' }}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        formatter={(value: number | undefined, name: string | undefined) => [
                                            value ?? 0,
                                            name === 'connectes' ? 'Connectés' : 'Total',
                                        ]}
                                        labelFormatter={(label) => `Organisation : ${label}`}
                                    />
                                    <Legend
                                        formatter={(value) => value === 'connectes' ? 'Connectés' : 'Total'}
                                    />
                                    <Bar dataKey="total" name="total" fill="#e0e7ff" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    <Bar dataKey="connectes" name="connectes" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                        {chartData.map((_, i) => (
                                            <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* ── Tableau détaillé ─────────────────────────────────────── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Détail par organisation</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {rapport.length === 0 ? (
                            <div className="py-12 text-center text-gray-400 text-sm">
                                Aucune donnée disponible
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-gray-50">
                                            <th className="px-4 py-3 text-left font-medium text-gray-500">Organisation</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-500">Statut</th>
                                            <th className="px-4 py-3 text-right font-medium text-gray-500">Total</th>
                                            <th className="px-4 py-3 text-right font-medium text-gray-500">Connectés</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-500 w-40">Taux</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">Dernière connexion</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {rapport.map(row => (
                                            <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                                {/* Organisation */}
                                                <td className="px-4 py-3">
                                                    <span className="font-medium text-gray-800">{row.nom}</span>
                                                </td>

                                                {/* Statut */}
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                                        row.statut === 'actif'
                                                            ? 'bg-green-100 text-green-700'
                                                            : row.statut === 'suspendu'
                                                                ? 'bg-yellow-100 text-yellow-700'
                                                                : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                        {row.statut}
                                                    </span>
                                                </td>

                                                {/* Total */}
                                                <td className="px-4 py-3 text-right font-medium text-gray-700">
                                                    {row.total_utilisateurs}
                                                </td>

                                                {/* Connectés */}
                                                <td className="px-4 py-3 text-right">
                                                    <span className={`font-bold ${
                                                        row.connectes > 0 ? 'text-indigo-600' : 'text-gray-400'
                                                    }`}>
                                                        {row.connectes}
                                                    </span>
                                                </td>

                                                {/* Taux (barre de progression) */}
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-1.5 rounded-full ${
                                                                    row.taux_connexion >= 70
                                                                        ? 'bg-green-500'
                                                                        : row.taux_connexion >= 30
                                                                            ? 'bg-indigo-500'
                                                                            : 'bg-gray-300'
                                                                }`}
                                                                style={{ width: `${row.taux_connexion}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs text-gray-500 w-8 text-right shrink-0">
                                                            {row.taux_connexion}%
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Dernière connexion */}
                                                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                                                    {fmtDate(row.derniere_connexion)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </SuperAdminLayout>
    );
}
