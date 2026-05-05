import { Head, Link } from '@inertiajs/react';
import {
    Archive,
    AlertTriangle,
    CreditCard,
    FileText,
    FolderOpen,
    HardDrive,
    Plus,
    Search,
    Upload,
    Users,
} from 'lucide-react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Document } from '@/types/models';

// ── Palette de couleurs cohérente ─────────────────────────────────────────────
const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];
const STATUS_COLORS: Record<string, string> = {
    'Actifs':     '#10b981',
    'Archivés':   '#6366f1',
    'En attente': '#f59e0b',
    'Supprimés':  '#ef4444',
};

interface ChartData {
    documents_par_mois:   { mois: string; short: string; total: number }[];
    documents_par_statut: { statut: string; total: number }[];
    documents_par_type:   { extension: string; total: number }[];
    documents_par_espace: { nom: string; total: number }[];
}

interface AbonnementInfo {
    plan_nom:       string | null;
    date_fin:       string | null;
    jours_restants: number | null;
}

interface DashboardProps {
    stats: {
        total_documents:             number;
        total_dossiers:              number;
        total_espaces:               number;
        total_utilisateurs:          number;
        stockage_utilise_mo:         number;
        stockage_max_go:             number;
        workflows_en_cours:          number;
        documents_archivage_depasse: number;
    };
    charts: ChartData;
    documents_recents:           Document[];
    documents_archivage_bientot: Document[];
    abonnement:                  AbonnementInfo | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tableau de bord', href: '/dashboard' },
];

function formatStorage(mo: number): string {
    if (mo >= 1024) return `${(mo / 1024).toFixed(1)} Go`;
    return `${mo} Mo`;
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'short', year: 'numeric',
    });
}

function daysUntil(dateStr: string): number {
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

// ── Tooltip personnalisé ──────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ color?: string; fill?: string; name?: string; dataKey?: string; value?: number | string }>; label?: string | number }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-sm">
            <p className="font-medium text-foreground mb-1">{label}</p>
            {payload.map((p, i: number) => (
                <p key={i} style={{ color: p.color ?? p.fill }}>
                    {p.name ?? p.dataKey} : <span className="font-semibold">{p.value}</span>
                </p>
            ))}
        </div>
    );
}

// ── Label centre du donut ─────────────────────────────────────────────────────
// Kept as reference but not currently used in render

export default function Dashboard({
    stats,
    charts,
    documents_recents,
    documents_archivage_bientot,
    abonnement,
}: DashboardProps) {
    const storagePercent = stats.stockage_max_go > 0
        ? Math.round((stats.stockage_utilise_mo / (stats.stockage_max_go * 1024)) * 100)
        : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tableau de bord" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">

                {/* ── Bannière abonnement ───────────────────────────────────── */}
                {abonnement && abonnement.jours_restants !== null && abonnement.jours_restants <= 5 && (
                    <div className={`flex items-center gap-3 rounded-lg border p-4 ${
                        abonnement.jours_restants <= 0
                            ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950'
                            : 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950'
                    }`}>
                        <CreditCard className={`h-5 w-5 shrink-0 ${
                            abonnement.jours_restants <= 0 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                        }`} />
                        <div className="flex-1">
                            <p className={`font-medium ${
                                abonnement.jours_restants <= 0 ? 'text-red-800 dark:text-red-200' : 'text-amber-800 dark:text-amber-200'
                            }`}>
                                {abonnement.jours_restants <= 0
                                    ? 'Votre abonnement a expiré'
                                    : `Votre abonnement expire dans ${abonnement.jours_restants} jour(s)`}
                            </p>
                            <p className={`text-sm ${
                                abonnement.jours_restants <= 0 ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'
                            }`}>
                                Plan : {abonnement.plan_nom}
                                {abonnement.date_fin && ` · Échéance : ${formatDate(abonnement.date_fin)}`}
                            </p>
                        </div>
                        <Link href="/admin/abonnement">
                            <Button
                                variant="outline"
                                size="sm"
                                className={abonnement.jours_restants <= 0
                                    ? 'border-red-400 text-red-700 hover:bg-red-100'
                                    : 'border-amber-400 text-amber-700 hover:bg-amber-100'}
                            >
                                Renouveler
                            </Button>
                        </Link>
                    </div>
                )}

                {/* ── Bannière alerte archivage ────────────────────────────── */}
                {stats.documents_archivage_depasse > 0 && (
                    <div className="flex items-center gap-3 rounded-lg border border-orange-300 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950">
                        <AlertTriangle className="h-5 w-5 shrink-0 text-orange-600 dark:text-orange-400" />
                        <div className="flex-1">
                            <p className="font-medium text-orange-800 dark:text-orange-200">
                                {stats.documents_archivage_depasse} document(s) ont dépassé leur délai d'archivage
                            </p>
                            <p className="text-sm text-orange-700 dark:text-orange-300">
                                Rendez-vous dans la section Documents pour les traiter.
                            </p>
                        </div>
                        <Link href="/documents?statut=actif">
                            <Button variant="outline" size="sm" className="border-orange-400 text-orange-700 hover:bg-orange-100">
                                <Archive className="mr-2 h-4 w-4" />
                                Voir
                            </Button>
                        </Link>
                    </div>
                )}

                {/* ── KPI Cards ────────────────────────────────────────────── */}
                <div className={`grid gap-4 sm:grid-cols-2 ${abonnement ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
                    {/* Documents */}
                    <Card className="relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Documents</CardTitle>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15">
                                <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.total_documents}</div>
                            <p className="text-xs text-muted-foreground mt-1">au total dans la plateforme</p>
                        </CardContent>
                    </Card>

                    {/* Espaces & Dossiers */}
                    <Card className="relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Espaces</CardTitle>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15">
                                <FolderOpen className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.total_espaces}</div>
                            <p className="text-xs text-muted-foreground mt-1">{stats.total_dossiers} dossiers au total</p>
                        </CardContent>
                    </Card>

                    {/* Stockage */}
                    <Card className="relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Stockage</CardTitle>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15">
                                <HardDrive className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{formatStorage(stats.stockage_utilise_mo)}</div>
                            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                    className={`h-1.5 rounded-full transition-all ${
                                        storagePercent > 80 ? 'bg-red-500' :
                                        storagePercent > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${Math.min(storagePercent, 100)}%` }}
                                />
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {storagePercent}% de {stats.stockage_max_go} Go utilisé
                            </p>
                        </CardContent>
                    </Card>

                    {/* Utilisateurs */}
                    <Card className="relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/15">
                                <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.total_utilisateurs}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {stats.workflows_en_cours} workflow(s) en cours
                            </p>
                        </CardContent>
                    </Card>

                    {/* Abonnement — Compte à rebours */}
                    {abonnement && (
                        <Link href="/admin/abonnement" className="block">
                            <Card className={`relative overflow-hidden h-full transition-colors hover:bg-accent ${
                                abonnement.jours_restants !== null && abonnement.jours_restants <= 0
                                    ? 'border-red-300 dark:border-red-700'
                                    : abonnement.jours_restants !== null && abonnement.jours_restants <= 5
                                        ? 'border-amber-300 dark:border-amber-700'
                                        : ''
                            }`}>
                                <div className={`absolute inset-0 bg-gradient-to-br ${
                                    abonnement.jours_restants !== null && abonnement.jours_restants <= 0
                                        ? 'from-red-500/10'
                                        : abonnement.jours_restants !== null && abonnement.jours_restants <= 5
                                            ? 'from-amber-500/10'
                                            : 'from-teal-500/10'
                                } to-transparent`} />
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Abonnement</CardTitle>
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                                        abonnement.jours_restants !== null && abonnement.jours_restants <= 0
                                            ? 'bg-red-500/15'
                                            : abonnement.jours_restants !== null && abonnement.jours_restants <= 5
                                                ? 'bg-amber-500/15'
                                                : 'bg-teal-500/15'
                                    }`}>
                                        <CreditCard className={`h-4 w-4 ${
                                            abonnement.jours_restants !== null && abonnement.jours_restants <= 0
                                                ? 'text-red-600 dark:text-red-400'
                                                : abonnement.jours_restants !== null && abonnement.jours_restants <= 5
                                                    ? 'text-amber-600 dark:text-amber-400'
                                                    : 'text-teal-600 dark:text-teal-400'
                                        }`} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {abonnement.jours_restants !== null && abonnement.jours_restants <= 0 ? (
                                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">Expiré</div>
                                    ) : (
                                        <div className="text-3xl font-bold">
                                            {abonnement.jours_restants ?? '—'}
                                            <span className="text-base font-normal text-muted-foreground ml-1">j</span>
                                        </div>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1 truncate">
                                        {abonnement.plan_nom ?? 'Plan inconnu'}
                                        {abonnement.date_fin && ` · ${formatDate(abonnement.date_fin)}`}
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    )}
                </div>

                {/* ── Actions rapides ──────────────────────────────────────── */}
                <div className="flex flex-wrap gap-3">
                    <Link href="/documents?upload=true">
                        <Button><Upload className="mr-2 h-4 w-4" />Ajouter un document</Button>
                    </Link>
                    <Link href="/espaces">
                        <Button variant="outline"><Plus className="mr-2 h-4 w-4" />Nouvel espace</Button>
                    </Link>
                    <Link href="/documents">
                        <Button variant="outline"><Search className="mr-2 h-4 w-4" />Rechercher</Button>
                    </Link>
                </div>

                {/* ── Graphes ──────────────────────────────────────────────── */}
                <div className="grid gap-6 lg:grid-cols-3">

                    {/* Graphe 1 : Évolution mensuelle (occupe 2 colonnes) */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-base">Évolution des documents (12 mois)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {charts.documents_par_mois.every(d => d.total === 0) ? (
                                <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
                                    Aucune donnée disponible
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <AreaChart data={charts.documents_par_mois} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                                        <defs>
                                            <linearGradient id="gradDoc" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis
                                            dataKey="short"
                                            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            allowDecimals={false}
                                            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area
                                            type="monotone"
                                            dataKey="total"
                                            name="Documents"
                                            stroke="#6366f1"
                                            strokeWidth={2}
                                            fill="url(#gradDoc)"
                                            dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
                                            activeDot={{ r: 5, strokeWidth: 0 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Graphe 2 : Répartition par statut (Donut) */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Répartition par statut</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {charts.documents_par_statut.length === 0 ? (
                                <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
                                    Aucune donnée disponible
                                </div>
                            ) : (
                                <>
                                    <ResponsiveContainer width="100%" height={180}>
                                        <PieChart>
                                            <Pie
                                                data={charts.documents_par_statut}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={55}
                                                outerRadius={80}
                                                dataKey="total"
                                                nameKey="statut"
                                                paddingAngle={3}
                                            >
                                                {charts.documents_par_statut.map((entry, i) => (
                                                    <Cell
                                                        key={entry.statut}
                                                        fill={STATUS_COLORS[entry.statut] ?? COLORS[i % COLORS.length]}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    {/* Légende */}
                                    <div className="mt-2 space-y-1.5">
                                        {charts.documents_par_statut.map((entry, i) => (
                                            <div key={entry.statut} className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-1.5">
                                                    <span
                                                        className="inline-block h-2 w-2 rounded-full"
                                                        style={{ backgroundColor: STATUS_COLORS[entry.statut] ?? COLORS[i % COLORS.length] }}
                                                    />
                                                    <span className="text-muted-foreground">{entry.statut}</span>
                                                </div>
                                                <span className="font-medium">{entry.total}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Graphes secondaires ───────────────────────────────────── */}
                <div className="grid gap-6 lg:grid-cols-2">

                    {/* Graphe 3 : Top types de fichiers */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Top types de fichiers</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {charts.documents_par_type.length === 0 ? (
                                <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                                    Aucune donnée disponible
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart
                                        data={charts.documents_par_type}
                                        layout="vertical"
                                        margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                                        <XAxis
                                            type="number"
                                            allowDecimals={false}
                                            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="extension"
                                            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                            axisLine={false}
                                            tickLine={false}
                                            width={42}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="total" name="Fichiers" radius={[0, 4, 4, 0]} maxBarSize={20}>
                                            {charts.documents_par_type.map((_, i) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Graphe 4 : Documents par espace */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Documents par espace</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {charts.documents_par_espace.length === 0 ? (
                                <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                                    Aucun document classé dans un espace
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart
                                        data={charts.documents_par_espace}
                                        margin={{ top: 4, right: 4, bottom: 24, left: -20 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                        <XAxis
                                            dataKey="nom"
                                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                            axisLine={false}
                                            tickLine={false}
                                            interval={0}
                                            angle={-20}
                                            textAnchor="end"
                                        />
                                        <YAxis
                                            allowDecimals={false}
                                            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="total" name="Documents" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                            {charts.documents_par_espace.map((_, i) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Archivage bientôt ─────────────────────────────────────── */}
                {documents_archivage_bientot?.length > 0 && (
                    <Card className="border-amber-200 dark:border-amber-800">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Archive className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                <CardTitle className="text-amber-800 dark:text-amber-200">
                                    Documents à archiver prochainement
                                </CardTitle>
                            </div>
                            <Badge variant="outline" className="border-amber-400 text-amber-700 dark:border-amber-700 dark:text-amber-300">
                                {documents_archivage_bientot.length} document(s)
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {documents_archivage_bientot.map((doc) => {
                                    const days = daysUntil(doc.date_archivage!);
                                    const isUrgent = days <= 7;
                                    return (
                                        <Link
                                            key={doc.id}
                                            href={`/documents/${doc.id}`}
                                            className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isUrgent ? 'bg-red-100 dark:bg-red-900' : 'bg-amber-100 dark:bg-amber-900'}`}>
                                                    <Archive className={`h-5 w-5 ${isUrgent ? 'text-red-600' : 'text-amber-600'}`} />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{doc.titre}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {doc.extension?.toUpperCase()} · {doc.taille_formatee}
                                                        {doc.dossier && ` · ${doc.dossier.nom}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge variant={isUrgent ? 'destructive' : 'secondary'}>
                                                    {days <= 0 ? 'Expiré' : `${days} j`}
                                                </Badge>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {formatDate(doc.date_archivage!)}
                                                </p>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ── Documents récents ─────────────────────────────────────── */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Documents récents</CardTitle>
                        <Link href="/documents">
                            <Button variant="ghost" size="sm">Voir tout</Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {documents_recents?.length > 0 ? (
                            <div className="space-y-2">
                                {documents_recents.map((doc) => (
                                    <Link
                                        key={doc.id}
                                        href={`/documents/${doc.id}`}
                                        className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                                <FileText className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate font-medium">{doc.titre}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {doc.extension?.toUpperCase()} · {doc.taille_formatee}
                                                    {doc.dossier && ` · ${doc.dossier.nom}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="ml-3 shrink-0 text-right">
                                            <Badge variant="secondary">{doc.statut}</Badge>
                                            {doc.created_at && (
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {formatDate(doc.created_at)}
                                                </p>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="py-10 text-center text-muted-foreground">
                                <FileText className="mx-auto mb-3 h-12 w-12 opacity-20" />
                                <p className="text-sm">Aucun document pour le moment</p>
                                <Link href="/documents?upload=true">
                                    <Button variant="outline" className="mt-3" size="sm">
                                        <Upload className="mr-2 h-4 w-4" />
                                        Ajouter votre premier document
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </AppLayout>
    );
}
