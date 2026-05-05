import { Head, Link } from '@inertiajs/react';
import {
    Building2, Users, CreditCard, TrendingUp, AlertTriangle, Clock,
    CheckCircle, XCircle, ArrowRight, RefreshCw, ListTodo, Activity,
    UserCheck, FileText, HardDrive, LayoutGrid, Ticket, ArrowUpRight,
    Zap, DollarSign, CalendarClock,
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SuperAdminLayout from '@/layouts/superadmin-layout';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stats {
    organisations_total: number;
    organisations_actives: number;
    organisations_suspendues: number;
    utilisateurs: number;
    abonnements_actifs: number;
    revenue_mensuel: number;
    revenue_annuel: number;
    demandes_en_attente: number;
    connectes_24h: number;
    connectes_7j: number;
    documents_total: number;
    documents_semaine: number;
    stockage_total_go: number;
    stockage_total_mo: number;
    espaces_total: number;
    workflows_actifs: number;
    tickets_ouverts: number;
    plans_actifs: number;
}

interface ConnexionOrg { nom: string; connectes_7j: number; total: number }
interface StockageOrg  { nom: string; mo: number; go: number }

interface AbonnementAlert {
    id: string; date_fin: string; date_renouvellement: string | null;
    periodicite: string;
    organisation: { id: string; nom: string };
    plan: { nom: string };
}

interface DemandePlan {
    id: string; periodicite_demandee: string; message: string | null;
    created_at: string;
    organisation: { id: string; nom: string };
    plan_actuel: { nom: string } | null;
    plan_demande: { nom: string };
}

interface RecentOrg {
    id: string; nom: string; statut: string; created_at: string;
    plan: { nom: string } | null;
}

interface PlanDistrib { nom: string; count: number; actif: boolean }
interface RevenuePlan  { nom: string; revenue: number }

interface Renouvellement {
    id: string; date_renouvellement: string; periodicite: string;
    organisation: { id: string; nom: string };
    plan: { nom: string };
}

interface DashboardPageProps {
    stats: Stats;
    expirantCritiques: AbonnementAlert[];
    expirantBientot: AbonnementAlert[];
    expires: AbonnementAlert[];
    demandesPlan: DemandePlan[];
    recentOrganisations: RecentOrg[];
    planDistribution: PlanDistrib[];
    revenueParPlan: RevenuePlan[];
    renouvellements: Renouvellement[];
    utilisateursConnectesParOrg: ConnexionOrg[];
    stockageParOrg: StockageOrg[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n);
}
function daysUntil(d: string) { return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000); }
function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtStorage(mo: number) {
    if (mo >= 1024) return `${(mo / 1024).toFixed(1)} Go`;
    return `${mo} Mo`;
}

const CHART_COLORS = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#22d3ee'];

// ─── Composants ───────────────────────────────────────────────────────────────

function KpiCard({
    label, value, sub, icon: Icon, iconClass, iconBg, tag, tagClass,
}: {
    label: string;
    value: string | number;
    sub?: string;
    icon: React.ElementType;
    iconClass: string;
    iconBg: string;
    tag?: string;
    tagClass?: string;
}) {
    return (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
                    <Icon className={`w-4 h-4 ${iconClass}`} />
                </div>
                {tag && (
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${tagClass}`}>
                        {tag}
                    </span>
                )}
            </div>
            <div>
                <p className="text-xl font-bold text-slate-800 leading-snug">{value}</p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">{label}</p>
                {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

function SectionLabel({ icon: Icon, text, action }: {
    icon: React.ElementType;
    text: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{text}</span>
            </div>
            {action}
        </div>
    );
}

function ViewAll({ href, label = 'Tout voir' }: { href: string; label?: string }) {
    return (
        <Link href={href}>
            <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-indigo-600 transition-colors">
                {label} <ArrowUpRight className="w-3 h-3" />
            </span>
        </Link>
    );
}

function StatusPill({ statut }: { statut: string }) {
    const map: Record<string, string> = {
        actif:    'bg-emerald-50 text-emerald-600',
        suspendu: 'bg-amber-50 text-amber-600',
        inactif:  'bg-red-50 text-red-500',
    };
    const labels: Record<string, string> = { actif: 'Actif', suspendu: 'Suspendu', inactif: 'Inactif' };
    return (
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${map[statut] ?? 'bg-slate-100 text-slate-500'}`}>
            {labels[statut] ?? statut}
        </span>
    );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function SuperAdminDashboard({
    stats,
    expirantCritiques, expirantBientot, expires,
    demandesPlan,
    recentOrganisations,
    planDistribution, revenueParPlan,
    renouvellements,
    utilisateursConnectesParOrg,
    stockageParOrg,
}: DashboardPageProps) {

    const totalAlertes = expirantCritiques.length + expirantBientot.length + expires.length;
    const today = new Date().toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    return (
        <SuperAdminLayout>
            <Head title="Tableau de bord — SuperAdmin" />

            <div className="space-y-7 pb-10">

                {/* ── En-tête ───────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <p className="text-[11px] text-slate-400 capitalize font-medium">{today}</p>
                        <h1 className="text-xl font-bold text-slate-800 mt-0.5">Tableau de bord</h1>
                        <p className="text-xs text-slate-400 mt-0.5">Vue d'ensemble de la plateforme SEN Archive</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {totalAlertes > 0 && (
                            <Link href="/superadmin/abonnements">
                                <span className="flex items-center gap-1.5 text-[11px] font-semibold bg-red-50 text-red-500 border border-red-100 px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition-colors cursor-pointer">
                                    <AlertTriangle className="w-3 h-3" />
                                    {totalAlertes} alerte{totalAlertes > 1 ? 's' : ''}
                                </span>
                            </Link>
                        )}
                        {stats.demandes_en_attente > 0 && (
                            <Link href="/superadmin/demandes_plan">
                                <span className="flex items-center gap-1.5 text-[11px] font-semibold bg-amber-50 text-amber-600 border border-amber-100 px-2.5 py-1.5 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer">
                                    <ListTodo className="w-3 h-3" />
                                    {stats.demandes_en_attente} demande{stats.demandes_en_attente > 1 ? 's' : ''}
                                </span>
                            </Link>
                        )}
                        {stats.tickets_ouverts > 0 && (
                            <span className="flex items-center gap-1.5 text-[11px] font-semibold bg-sky-50 text-sky-500 border border-sky-100 px-2.5 py-1.5 rounded-lg">
                                <Ticket className="w-3 h-3" />
                                {stats.tickets_ouverts} ticket{stats.tickets_ouverts > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                </div>

                {/* ── Bloc 1 · Organisations & Utilisateurs ─────────────── */}
                <div>
                    <SectionLabel icon={Building2} text="Organisations & Utilisateurs" />
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <KpiCard label="Organisations" value={stats.organisations_total}
                            sub={`${stats.organisations_actives} actives · ${stats.organisations_suspendues} susp.`}
                            icon={Building2} iconClass="text-blue-500" iconBg="bg-blue-50" />
                        <KpiCard label="Utilisateurs" value={stats.utilisateurs.toLocaleString('fr-FR')}
                            sub="membres enregistrés"
                            icon={Users} iconClass="text-emerald-500" iconBg="bg-emerald-50" />
                        <KpiCard label="Connectés (24 h)" value={stats.connectes_24h}
                            sub="actifs aujourd'hui"
                            icon={Zap} iconClass="text-indigo-500" iconBg="bg-indigo-50" />
                        <KpiCard label="Connectés (7 jours)" value={stats.connectes_7j}
                            sub={`sur ${stats.utilisateurs} au total`}
                            icon={Activity} iconClass="text-violet-500" iconBg="bg-violet-50" />
                    </div>
                </div>

                {/* ── Bloc 2 · Documents & Stockage ─────────────────────── */}
                <div>
                    <SectionLabel icon={FileText} text="Documents & Stockage" />
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <KpiCard label="Documents archivés" value={stats.documents_total.toLocaleString('fr-FR')}
                            sub="toutes organisations"
                            icon={FileText} iconClass="text-sky-500" iconBg="bg-sky-50" />
                        <KpiCard label="Nouveaux (7 jours)" value={stats.documents_semaine}
                            sub="documents ajoutés"
                            icon={CalendarClock} iconClass="text-teal-500" iconBg="bg-teal-50" />
                        <KpiCard label="Stockage total" value={fmtStorage(stats.stockage_total_mo)}
                            sub="utilisé sur la plateforme"
                            icon={HardDrive} iconClass="text-orange-400" iconBg="bg-orange-50" />
                        <KpiCard label="Espaces de travail" value={stats.espaces_total}
                            sub="créés sur la plateforme"
                            icon={LayoutGrid} iconClass="text-pink-400" iconBg="bg-pink-50" />
                    </div>
                </div>

                {/* ── Bloc 3 · Facturation & SaaS ───────────────────────── */}
                <div>
                    <SectionLabel icon={DollarSign} text="Facturation & SaaS" />
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <KpiCard label="Revenu mensuel" value={fmt(stats.revenue_mensuel)}
                            sub={new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                            icon={DollarSign} iconClass="text-emerald-500" iconBg="bg-emerald-50" />
                        <KpiCard label="Revenu annuel" value={fmt(stats.revenue_annuel)}
                            sub={`Année ${new Date().getFullYear()}`}
                            icon={TrendingUp} iconClass="text-cyan-500" iconBg="bg-cyan-50" />
                        <KpiCard label="Abonnements actifs" value={stats.abonnements_actifs}
                            sub={`${stats.plans_actifs} plan${stats.plans_actifs > 1 ? 's' : ''} disponible${stats.plans_actifs > 1 ? 's' : ''}`}
                            icon={CreditCard} iconClass="text-purple-500" iconBg="bg-purple-50" />
                        <KpiCard label="Demandes en attente" value={stats.demandes_en_attente}
                            sub="changements de plan"
                            icon={ListTodo}
                            iconClass={stats.demandes_en_attente > 0 ? 'text-amber-500' : 'text-slate-400'}
                            iconBg={stats.demandes_en_attente > 0 ? 'bg-amber-50' : 'bg-slate-50'}
                            tag={stats.demandes_en_attente > 0 ? 'À traiter' : undefined}
                            tagClass="bg-amber-50 text-amber-600" />
                    </div>
                </div>

                {/* ── Bloc 4 · Plateforme & Support ─────────────────────── */}
                <div>
                    <SectionLabel icon={Activity} text="Plateforme & Support" />
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <KpiCard label="Workflows actifs" value={stats.workflows_actifs}
                            sub="processus configurés"
                            icon={RefreshCw} iconClass="text-indigo-400" iconBg="bg-indigo-50" />
                        <KpiCard label="Tickets ouverts" value={stats.tickets_ouverts}
                            sub="support en attente"
                            icon={Ticket}
                            iconClass={stats.tickets_ouverts > 0 ? 'text-rose-400' : 'text-slate-400'}
                            iconBg={stats.tickets_ouverts > 0 ? 'bg-rose-50' : 'bg-slate-50'}
                            tag={stats.tickets_ouverts > 0 ? 'En attente' : undefined}
                            tagClass="bg-rose-50 text-rose-500" />
                        <KpiCard label="Plans disponibles" value={stats.plans_actifs}
                            sub="offres actives"
                            icon={CreditCard} iconClass="text-slate-500" iconBg="bg-slate-100" />
                        <KpiCard label="Orgs suspendues" value={stats.organisations_suspendues}
                            sub="nécessitent attention"
                            icon={XCircle}
                            iconClass={stats.organisations_suspendues > 0 ? 'text-amber-400' : 'text-slate-400'}
                            iconBg={stats.organisations_suspendues > 0 ? 'bg-amber-50' : 'bg-slate-50'} />
                    </div>
                </div>

                {/* ── Alertes expiration ────────────────────────────────── */}
                {totalAlertes > 0 && (
                    <div>
                        <SectionLabel icon={AlertTriangle} text="Alertes d'expiration d'abonnement" />
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                            {/* ≤ 7 j */}
                            <div className="rounded-xl border border-red-100 bg-white overflow-hidden">
                                <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50/80 border-b border-red-100">
                                    <XCircle className="w-3.5 h-3.5 text-red-400" />
                                    <span className="text-xs font-semibold text-red-600">Critiques — ≤ 7 jours</span>
                                    <span className="ml-auto text-[11px] font-bold bg-red-400 text-white w-5 h-5 rounded-full flex items-center justify-center">
                                        {expirantCritiques.length}
                                    </span>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {expirantCritiques.length === 0
                                        ? <p className="px-4 py-5 text-xs text-slate-400 text-center">Aucune</p>
                                        : expirantCritiques.map((a) => (
                                            <div key={a.id} className="flex items-center justify-between px-4 py-2.5">
                                                <div>
                                                    <Link href={`/superadmin/organisations/${a.organisation.id}`}
                                                        className="text-xs font-medium text-slate-700 hover:text-red-500 transition-colors">
                                                        {a.organisation.nom}
                                                    </Link>
                                                    <p className="text-[11px] text-slate-400 mt-0.5">{a.plan.nom}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span className="text-[11px] font-bold bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full">
                                                        J-{Math.max(0, daysUntil(a.date_fin))}
                                                    </span>
                                                    <p className="text-[10px] text-slate-400 mt-1">{fmtDate(a.date_fin)}</p>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>

                            {/* 8-30 j */}
                            <div className="rounded-xl border border-amber-100 bg-white overflow-hidden">
                                <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50/80 border-b border-amber-100">
                                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                                    <span className="text-xs font-semibold text-amber-600">Attention — 8 à 30 jours</span>
                                    <span className="ml-auto text-[11px] font-bold bg-amber-400 text-white w-5 h-5 rounded-full flex items-center justify-center">
                                        {expirantBientot.length}
                                    </span>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {expirantBientot.length === 0
                                        ? <p className="px-4 py-5 text-xs text-slate-400 text-center">Aucune</p>
                                        : expirantBientot.map((a) => (
                                            <div key={a.id} className="flex items-center justify-between px-4 py-2.5">
                                                <div>
                                                    <Link href={`/superadmin/organisations/${a.organisation.id}`}
                                                        className="text-xs font-medium text-slate-700 hover:text-amber-500 transition-colors">
                                                        {a.organisation.nom}
                                                    </Link>
                                                    <p className="text-[11px] text-slate-400 mt-0.5">{a.plan.nom}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span className="text-[11px] font-bold bg-amber-50 text-amber-500 px-1.5 py-0.5 rounded-full">
                                                        J-{daysUntil(a.date_fin)}
                                                    </span>
                                                    <p className="text-[10px] text-slate-400 mt-1">{fmtDate(a.date_fin)}</p>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>

                            {/* Expirés non traités */}
                            <div className="rounded-xl border border-slate-100 bg-white overflow-hidden">
                                <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                                    <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-xs font-semibold text-slate-500">Expirés non traités</span>
                                    <span className="ml-auto text-[11px] font-bold bg-slate-400 text-white w-5 h-5 rounded-full flex items-center justify-center">
                                        {expires.length}
                                    </span>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {expires.length === 0
                                        ? <p className="px-4 py-5 text-xs text-slate-400 text-center">Aucun</p>
                                        : expires.map((a) => (
                                            <div key={a.id} className="flex items-center justify-between px-4 py-2.5">
                                                <div>
                                                    <Link href={`/superadmin/organisations/${a.organisation.id}`}
                                                        className="text-xs font-medium text-slate-700 hover:text-indigo-500 transition-colors">
                                                        {a.organisation.nom}
                                                    </Link>
                                                    <p className="text-[11px] text-slate-400 mt-0.5">{a.plan.nom}</p>
                                                </div>
                                                <p className="text-[10px] text-slate-400 shrink-0">Exp. {fmtDate(a.date_fin)}</p>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Demandes de plan ─────────────────────────────────── */}
                {demandesPlan.length > 0 && (
                    <div>
                        <SectionLabel
                            icon={ListTodo}
                            text={`Demandes de changement de plan (${demandesPlan.length})`}
                            action={<ViewAll href="/superadmin/demandes_plan" />}
                        />
                        <div className="bg-white rounded-xl border border-slate-100 shadow-sm divide-y divide-slate-50">
                            {demandesPlan.map((d) => (
                                <div key={d.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                                            <Building2 className="w-3.5 h-3.5 text-amber-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-800">{d.organisation.nom}</p>
                                            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                                                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">{d.plan_actuel?.nom ?? '—'}</span>
                                                <ArrowRight className="w-2.5 h-2.5 text-slate-300" />
                                                <span className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-medium text-[10px]">{d.plan_demande.nom}</span>
                                                <span className="text-slate-400">· {d.periodicite_demandee}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <p className="text-[11px] text-slate-400 hidden sm:block">{fmtDate(d.created_at)}</p>
                                        <Link href="/superadmin/demandes_plan">
                                            <span className="text-[11px] font-medium text-indigo-500 hover:text-indigo-700 flex items-center gap-1 transition-colors cursor-pointer">
                                                Traiter <ArrowRight className="w-2.5 h-2.5" />
                                            </span>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Graphiques ────────────────────────────────────────── */}
                <div>
                    <SectionLabel icon={TrendingUp} text="Graphiques" />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                        <Card className="rounded-xl border border-slate-100 shadow-sm">
                            <CardHeader className="pb-1 pt-4 px-4">
                                <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                    Organisations par plan
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                {planDistribution.filter(p => p.count > 0).length === 0 ? (
                                    <div className="flex h-44 items-center justify-center text-slate-400 text-xs">Aucune donnée</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <PieChart>
                                            <Pie
                                                data={planDistribution.filter(p => p.count > 0)}
                                                cx="50%" cy="43%"
                                                innerRadius={50} outerRadius={80}
                                                paddingAngle={3} dataKey="count" nameKey="nom"
                                            >
                                                {planDistribution.filter(p => p.count > 0).map((_, i) => (
                                                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="none" />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(v: number | undefined, name: string | undefined) => [v != null ? `${v} org${v > 1 ? 's' : ''}` : '—', name ?? '']}
                                                contentStyle={{ borderRadius: 8, border: '1px solid #f1f5f9', fontSize: 11 }}
                                            />
                                            <Legend iconType="circle" iconSize={6}
                                                formatter={(v) => <span className="text-[11px] text-slate-500">{v}</span>} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="rounded-xl border border-slate-100 shadow-sm">
                            <CardHeader className="pb-1 pt-4 px-4">
                                <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                    Revenu par plan
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                {revenueParPlan.length === 0 ? (
                                    <div className="flex h-44 items-center justify-center text-slate-400 text-xs">Aucune donnée</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={revenueParPlan} margin={{ top: 5, right: 8, left: 0, bottom: 5 }} barSize={28}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                                            <XAxis dataKey="nom" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 10, fill: '#cbd5e1' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                                            <Tooltip formatter={(v: number | undefined) => [v != null ? fmt(v) : '—', 'Revenu']}
                                                contentStyle={{ borderRadius: 8, border: '1px solid #f1f5f9', fontSize: 11 }} />
                                            <defs>
                                                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#818cf8" stopOpacity={0.9} />
                                                    <stop offset="100%" stopColor="#c7d2fe" stopOpacity={0.5} />
                                                </linearGradient>
                                            </defs>
                                            <Bar dataKey="revenue" fill="url(#revGrad)" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* ── Connexions par organisation ───────────────────────── */}
                <div>
                    <SectionLabel icon={Activity} text="Connexions par organisation — 7 jours"
                        action={<ViewAll href="/superadmin/utilisateurs/rapport" label="Rapport complet" />} />
                    <Card className="rounded-xl border border-slate-100 shadow-sm">
                        <CardContent className="pt-4 px-4 pb-4">
                            {utilisateursConnectesParOrg.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-36 text-slate-400 gap-2">
                                    <Activity className="w-6 h-6 opacity-20" />
                                    <p className="text-xs">Aucune connexion ces 7 derniers jours</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={utilisateursConnectesParOrg} margin={{ top: 5, right: 16, left: 0, bottom: 60 }} barSize={18}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                                        <XAxis dataKey="nom" tick={{ fontSize: 10, fill: '#94a3b8' }} angle={-35} textAnchor="end" interval={0} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10, fill: '#cbd5e1' }} allowDecimals={false} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            formatter={(v: number | undefined, name: string | undefined) => [v ?? 0, name === 'connectes_7j' ? 'Connectés (7j)' : 'Total']}
                                            labelFormatter={(l) => `Organisation : ${l}`}
                                            contentStyle={{ borderRadius: 8, border: '1px solid #f1f5f9', fontSize: 11 }}
                                        />
                                        <Legend iconType="circle" iconSize={6} formatter={(n) => (
                                            <span className="text-[11px] text-slate-500">{n === 'connectes_7j' ? 'Connectés (7j)' : 'Total'}</span>
                                        )} />
                                        <Bar dataKey="total" name="total" fill="#e2e8f0" radius={[3, 3, 0, 0]} />
                                        <Bar dataKey="connectes_7j" name="connectes_7j" fill="#818cf8" radius={[3, 3, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Stockage par organisation ─────────────────────────── */}
                {stockageParOrg.length > 0 && (
                    <div>
                        <SectionLabel icon={HardDrive} text="Stockage utilisé par organisation (Top 10)" />
                        <Card className="rounded-xl border border-slate-100 shadow-sm">
                            <CardContent className="pt-4 px-4 pb-4">
                                <ResponsiveContainer width="100%" height={Math.max(180, stockageParOrg.length * 28)}>
                                    <BarChart data={stockageParOrg} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }} barSize={12}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" horizontal={false} />
                                        <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => `${v} Mo`} axisLine={false} tickLine={false} />
                                        <YAxis type="category" dataKey="nom" tick={{ fontSize: 11, fill: '#64748b' }} width={105} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            formatter={(v: number | undefined) => [v != null ? fmtStorage(v) : '—', 'Stockage']}
                                            contentStyle={{ borderRadius: 8, border: '1px solid #f1f5f9', fontSize: 11 }}
                                        />
                                        <defs>
                                            <linearGradient id="storGrad" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#fb923c" stopOpacity={0.7} />
                                                <stop offset="100%" stopColor="#fcd34d" stopOpacity={0.4} />
                                            </linearGradient>
                                        </defs>
                                        <Bar dataKey="mo" fill="url(#storGrad)" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* ── Organisations + Renouvellements ───────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                    <div>
                        <SectionLabel icon={Building2} text="Dernières organisations"
                            action={<ViewAll href="/superadmin/organisations" />} />
                        <div className="bg-white rounded-xl border border-slate-100 shadow-sm divide-y divide-slate-50">
                            {recentOrganisations.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
                                    <Building2 className="w-6 h-6 opacity-20" />
                                    <p className="text-xs">Aucune organisation</p>
                                </div>
                            ) : recentOrganisations.map((org) => (
                                <div key={org.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/50 transition-colors">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                            <Building2 className="w-3.5 h-3.5 text-blue-400" />
                                        </div>
                                        <div>
                                            <Link href={`/superadmin/organisations/${org.id}`}
                                                className="text-xs font-semibold text-slate-800 hover:text-indigo-600 transition-colors">
                                                {org.nom}
                                            </Link>
                                            <p className="text-[11px] text-slate-400 mt-0.5">{org.plan?.nom ?? 'Sans plan'}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        <StatusPill statut={org.statut} />
                                        <p className="text-[10px] text-slate-400">{fmtDate(org.created_at)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <SectionLabel icon={RefreshCw} text="Renouvellements prévus (30 jours)" />
                        <div className="bg-white rounded-xl border border-slate-100 shadow-sm divide-y divide-slate-50">
                            {renouvellements.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
                                    <CheckCircle className="w-6 h-6 text-emerald-200" />
                                    <p className="text-xs">Aucun renouvellement prévu</p>
                                </div>
                            ) : renouvellements.map((r) => (
                                <div key={r.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/50 transition-colors">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                                            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                                        </div>
                                        <div>
                                            <Link href={`/superadmin/organisations/${r.organisation.id}`}
                                                className="text-xs font-semibold text-slate-800 hover:text-indigo-600 transition-colors">
                                                {r.organisation.nom}
                                            </Link>
                                            <p className="text-[11px] text-slate-400 mt-0.5">{r.plan.nom} · {r.periodicite}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded-full">
                                            J-{Math.max(0, daysUntil(r.date_renouvellement))}
                                        </span>
                                        <p className="text-[10px] text-slate-400">{fmtDate(r.date_renouvellement)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Raccourcis ────────────────────────────────────────── */}
                <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
                    {[
                        { href: '/superadmin/utilisateurs/logs',   Icon: Activity,   label: "Logs d'activité",    hover: 'hover:text-indigo-600 hover:border-indigo-200' },
                        { href: '/superadmin/utilisateurs/rapport', Icon: UserCheck,  label: 'Rapport connexions', hover: 'hover:text-violet-600 hover:border-violet-200' },
                        { href: '/superadmin/organisations',        Icon: Building2,  label: 'Organisations',      hover: 'hover:text-blue-600 hover:border-blue-200' },
                        { href: '/superadmin/abonnements',          Icon: CreditCard, label: 'Abonnements',        hover: 'hover:text-emerald-600 hover:border-emerald-200' },
                        { href: '/superadmin/plans',                Icon: ListTodo,   label: 'Plans & Tarifs',     hover: 'hover:text-purple-600 hover:border-purple-200' },
                    ].map(({ href, Icon, label, hover }) => (
                        <Link key={href} href={href}>
                            <span className={`flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-white border border-slate-150 px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer ${hover}`}>
                                <Icon className="w-3 h-3" />
                                {label}
                            </span>
                        </Link>
                    ))}
                </div>

            </div>
        </SuperAdminLayout>
    );
}
