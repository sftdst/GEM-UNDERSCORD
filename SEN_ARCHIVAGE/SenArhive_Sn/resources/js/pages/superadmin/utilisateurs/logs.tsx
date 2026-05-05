import { Head, Link, router } from '@inertiajs/react';
import {
    Activity, Download, Filter, Search, ChevronLeft, ChevronRight,
    X, CheckCircle, XCircle, Globe,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SuperAdminLayout from '@/layouts/superadmin-layout';

// ─── Types ───────────────────────────────────────────────────────────────────

interface JournalEntry {
    id: string;
    created_at: string | null;
    action: string;
    ressource_type: string | null;
    ressource_id: string | null;
    ip_address: string | null;
    statut: string;
    organisation: { id: string; nom: string } | null;
    utilisateur: { id: string; nom: string; prenom: string; email: string } | null;
}

interface Pagination<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    journaux: Pagination<JournalEntry>;
    organisations: { id: string; nom: string }[];
    actions: string[];
    filters: {
        organisation_id?: string;
        utilisateur_id?: string;
        action?: string;
        date_from?: string;
        date_to?: string;
        statut?: string;
    };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

const ACTION_COLORS: Record<string, string> = {
    create:       'bg-green-100 text-green-700',
    store:        'bg-green-100 text-green-700',
    update:       'bg-blue-100 text-blue-700',
    delete:       'bg-red-100 text-red-700',
    destroy:      'bg-red-100 text-red-700',
    login:        'bg-purple-100 text-purple-700',
    logout:       'bg-gray-100 text-gray-600',
    download:     'bg-amber-100 text-amber-700',
    org_create:   'bg-green-100 text-green-700',
    org_update:   'bg-blue-100 text-blue-700',
    org_delete:   'bg-red-100 text-red-700',
    org_suspend:  'bg-orange-100 text-orange-700',
    org_activate: 'bg-teal-100 text-teal-700',
    sub_create:   'bg-green-100 text-green-700',
    sub_renew:    'bg-teal-100 text-teal-700',
    sub_suspend:  'bg-orange-100 text-orange-700',
    sub_terminate:'bg-red-100 text-red-700',
};

function actionColor(action: string): string {
    return ACTION_COLORS[action] ?? 'bg-indigo-100 text-indigo-700';
}

// ─── Composant ───────────────────────────────────────────────────────────────

export default function UtilisateurLogs({ journaux, organisations, actions, filters }: Props) {
    const [form, setForm] = useState({
        organisation_id: filters.organisation_id ?? '',
        action:          filters.action ?? '',
        date_from:       filters.date_from ?? '',
        date_to:         filters.date_to ?? '',
        statut:          filters.statut ?? '',
    });

    const applyFilters = () => {
        const params: Record<string, string> = {};
        Object.entries(form).forEach(([k, v]) => { if (v) params[k] = v; });
        router.get('/superadmin/utilisateurs/logs', params, { preserveScroll: true });
    };

    const resetFilters = () => {
        setForm({ organisation_id: '', action: '', date_from: '', date_to: '', statut: '' });
        router.get('/superadmin/utilisateurs/logs', {}, { preserveScroll: true });
    };

    const hasFilters = Object.values(filters).some(Boolean);

    const exportUrl = () => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
        return '/superadmin/utilisateurs/logs/export?' + params.toString();
    };

    const breadcrumbs = [
        { title: 'Tableau de bord', href: '/superadmin' },
        { title: 'Logs d\'activité', href: '/superadmin/utilisateurs/logs' },
    ];

    return (
        <SuperAdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Logs d'activité — SuperAdmin" />

            <div className="space-y-6">

                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Activity className="w-6 h-6 text-indigo-600" />
                            Logs d'activité
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Toutes les actions enregistrées sur la plateforme —{' '}
                            <span className="font-medium">{journaux.total.toLocaleString('fr-FR')} entrées</span>
                        </p>
                    </div>
                    <a href={exportUrl()}>
                        <Button variant="outline" className="gap-2">
                            <Download className="w-4 h-4" />
                            Exporter CSV
                        </Button>
                    </a>
                </div>

                {/* ── Filtres ─────────────────────────────────────────────── */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-600">
                            <Filter className="w-4 h-4" />
                            Filtres
                            {hasFilters && (
                                <button
                                    onClick={resetFilters}
                                    className="ml-2 text-xs text-red-500 hover:underline flex items-center gap-1"
                                >
                                    <X className="w-3 h-3" /> Réinitialiser
                                </button>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                            {/* Organisation */}
                            <select
                                value={form.organisation_id}
                                onChange={e => setForm(f => ({ ...f, organisation_id: e.target.value }))}
                                className="rounded-md border border-gray-200 px-3 py-2 text-sm bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">Toutes les organisations</option>
                                {organisations.map(o => (
                                    <option key={o.id} value={o.id}>{o.nom}</option>
                                ))}
                            </select>

                            {/* Action */}
                            <select
                                value={form.action}
                                onChange={e => setForm(f => ({ ...f, action: e.target.value }))}
                                className="rounded-md border border-gray-200 px-3 py-2 text-sm bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">Toutes les actions</option>
                                {actions.map(a => (
                                    <option key={a} value={a}>{a}</option>
                                ))}
                            </select>

                            {/* Date début */}
                            <input
                                type="date"
                                value={form.date_from}
                                onChange={e => setForm(f => ({ ...f, date_from: e.target.value }))}
                                className="rounded-md border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500"
                                placeholder="Date début"
                            />

                            {/* Date fin */}
                            <input
                                type="date"
                                value={form.date_to}
                                onChange={e => setForm(f => ({ ...f, date_to: e.target.value }))}
                                className="rounded-md border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500"
                                placeholder="Date fin"
                            />

                            {/* Statut */}
                            <select
                                value={form.statut}
                                onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}
                                className="rounded-md border border-gray-200 px-3 py-2 text-sm bg-white focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="">Tous les statuts</option>
                                <option value="succes">Succès</option>
                                <option value="echec">Échec</option>
                            </select>
                        </div>
                        <div className="mt-3 flex justify-end">
                            <Button onClick={applyFilters} size="sm" className="gap-2">
                                <Search className="w-4 h-4" />
                                Appliquer
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* ── Tableau ─────────────────────────────────────────────── */}
                <Card>
                    <CardContent className="p-0">
                        {journaux.data.length === 0 ? (
                            <div className="py-16 text-center text-gray-400">
                                <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p className="text-sm">Aucun journal d'activité trouvé</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-gray-50">
                                            <th className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">Date</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-500">Organisation</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-500">Utilisateur</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-500">Action</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-500">Ressource</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-500">IP</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-500">Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {journaux.data.map((j) => (
                                            <tr key={j.id} className="hover:bg-gray-50 transition-colors">
                                                {/* Date */}
                                                <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-xs">
                                                    {fmtDate(j.created_at)}
                                                </td>

                                                {/* Organisation */}
                                                <td className="px-4 py-3">
                                                    {j.organisation ? (
                                                        <Link
                                                            href={`/superadmin/organisations/${j.organisation.id}`}
                                                            className="font-medium text-blue-600 hover:underline text-xs"
                                                        >
                                                            {j.organisation.nom}
                                                        </Link>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">—</span>
                                                    )}
                                                </td>

                                                {/* Utilisateur */}
                                                <td className="px-4 py-3">
                                                    {j.utilisateur ? (
                                                        <div>
                                                            <p className="font-medium text-gray-800 text-xs">
                                                                {j.utilisateur.prenom} {j.utilisateur.nom}
                                                            </p>
                                                            <p className="text-gray-400 text-xs">{j.utilisateur.email}</p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">Système</span>
                                                    )}
                                                </td>

                                                {/* Action */}
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${actionColor(j.action)}`}>
                                                        {j.action}
                                                    </span>
                                                </td>

                                                {/* Ressource */}
                                                <td className="px-4 py-3 text-xs text-gray-500">
                                                    {j.ressource_type ? (
                                                        <span>
                                                            <span className="font-medium">{j.ressource_type}</span>
                                                            {j.ressource_id && (
                                                                <span className="text-gray-400 ml-1 font-mono text-[10px]">
                                                                    #{j.ressource_id.substring(0, 8)}…
                                                                </span>
                                                            )}
                                                        </span>
                                                    ) : '—'}
                                                </td>

                                                {/* IP */}
                                                <td className="px-4 py-3 text-xs text-gray-400 font-mono whitespace-nowrap">
                                                    {j.ip_address ? (
                                                        <span className="flex items-center gap-1">
                                                            <Globe className="w-3 h-3" />
                                                            {j.ip_address}
                                                        </span>
                                                    ) : '—'}
                                                </td>

                                                {/* Statut */}
                                                <td className="px-4 py-3">
                                                    {j.statut === 'succes' ? (
                                                        <span className="flex items-center gap-1 text-green-600 text-xs">
                                                            <CheckCircle className="w-3.5 h-3.5" /> Succès
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-red-500 text-xs">
                                                            <XCircle className="w-3.5 h-3.5" /> Échec
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ── Pagination ──────────────────────────────────────────── */}
                {journaux.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            {journaux.from}–{journaux.to} sur {journaux.total.toLocaleString('fr-FR')} entrées
                        </p>
                        <div className="flex items-center gap-1">
                            {journaux.links.map((link, i) => {
                                if (link.label === '&laquo; Previous') {
                                    return (
                                        <button
                                            key={i}
                                            disabled={!link.url}
                                            onClick={() => link.url && router.get(link.url)}
                                            className="p-1.5 rounded border text-gray-500 disabled:opacity-40 hover:bg-gray-50"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                    );
                                }
                                if (link.label === 'Next &raquo;') {
                                    return (
                                        <button
                                            key={i}
                                            disabled={!link.url}
                                            onClick={() => link.url && router.get(link.url)}
                                            className="p-1.5 rounded border text-gray-500 disabled:opacity-40 hover:bg-gray-50"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    );
                                }
                                return (
                                    <button
                                        key={i}
                                        onClick={() => link.url && router.get(link.url)}
                                        className={`px-3 py-1.5 rounded border text-sm ${
                                            link.active
                                                ? 'bg-indigo-600 border-indigo-600 text-white font-medium'
                                                : 'text-gray-600 hover:bg-gray-50'
                                        } disabled:opacity-40`}
                                    >
                                        {link.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

            </div>
        </SuperAdminLayout>
    );
}
