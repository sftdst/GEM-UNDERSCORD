import { Head, Link, router, usePage } from '@inertiajs/react';
import { Check, X, Clock, Building2, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SuperAdminLayout from '@/layouts/superadmin-layout';

interface Plan {
    id: string;
    nom: string;
    prix_mensuel: string;
    prix_annuel: string;
}

interface Organisation {
    id: string;
    nom: string;
    statut: string;
}

interface Demande {
    id: string;
    statut: 'en_attente' | 'approuvee' | 'rejetee' | 'annulee';
    periodicite_demandee: string;
    message: string | null;
    motif_rejet: string | null;
    traite_le: string | null;
    created_at: string;
    organisation: Organisation;
    plan_actuel: Plan | null;
    plan_demande: Plan;
}

interface PaginatedDemandes {
    data: Demande[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
}

interface Props {
    demandes: PaginatedDemandes;
    filters: { statut: string };
    counts: { en_attente: number; approuvee: number; rejetee: number };
}

function formatXOF(price: string) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        maximumFractionDigits: 0,
    }).format(Number(price));
}

function statutBadge(statut: string) {
    switch (statut) {
        case 'en_attente':
            return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">En attente</Badge>;
        case 'approuvee':
            return <Badge className="bg-green-100 text-green-800 border-green-200">Approuvée</Badge>;
        case 'rejetee':
            return <Badge className="bg-red-100 text-red-800 border-red-200">Rejetée</Badge>;
        case 'annulee':
            return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Annulée</Badge>;
        default:
            return <Badge variant="secondary">{statut}</Badge>;
    }
}

export default function DemandesPlanIndex({ demandes, filters, counts }: Props) {
    const { props } = usePage();
    const flash = (props as any).flash as { success?: string; error?: string } | undefined;

    const [rejetModal, setRejetModal] = useState<Demande | null>(null);
    const [motifRejet, setMotifRejet] = useState('');
    const [loading, setLoading] = useState(false);

    const setStatut = (statut: string) => {
        router.get('/superadmin/demandes_plan', { statut }, { preserveState: true });
    };

    const handleApprouver = (demande: Demande) => {
        if (!confirm(`Approuver la demande de "${demande.organisation.nom}" vers le plan "${demande.plan_demande.nom}" ?`)) return;
        setLoading(true);
        router.post(
            `/superadmin/demandes_plan/${demande.id}/approuver`,
            {},
            { onFinish: () => setLoading(false) },
        );
    };

    const handleRejeter = (e: React.FormEvent) => {
        e.preventDefault();
        if (!rejetModal) return;
        setLoading(true);
        router.post(
            `/superadmin/demandes_plan/${rejetModal.id}/rejeter`,
            { motif_rejet: motifRejet },
            {
                onFinish: () => {
                    setLoading(false);
                    setRejetModal(null);
                    setMotifRejet('');
                },
            },
        );
    };

    return (
        <SuperAdminLayout>
            <Head title="Demandes de changement de plan" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Demandes de Changement de Plan</h1>
                        <p className="text-gray-500 mt-1">
                            {counts.en_attente} demande{counts.en_attente !== 1 ? 's' : ''} en attente de traitement
                        </p>
                    </div>
                </div>

                {/* Flash messages */}
                {flash?.success && (
                    <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                        <Check className="h-4 w-4 shrink-0" />
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                        <X className="h-4 w-4 shrink-0" />
                        {flash.error}
                    </div>
                )}

                {/* Onglets de filtres */}
                <div className="flex gap-2 border-b">
                    {[
                        { key: 'en_attente', label: 'En attente', count: counts.en_attente },
                        { key: 'approuvee', label: 'Approuvées', count: counts.approuvee },
                        { key: 'rejetee', label: 'Rejetées', count: counts.rejetee },
                        { key: 'all', label: 'Toutes', count: counts.en_attente + counts.approuvee + counts.rejetee },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setStatut(tab.key)}
                            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                                filters.statut === tab.key
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span
                                    className={`ml-2 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                                        tab.key === 'en_attente' && filters.statut === 'en_attente'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-600'
                                    }`}
                                >
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Liste des demandes */}
                {demandes.data.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">Aucune demande dans cette catégorie</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {demandes.data.map((demande) => (
                            <Card key={demande.id} className={demande.statut === 'en_attente' ? 'border-yellow-200' : ''}>
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        {/* Infos principales */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-3">
                                                <Building2 className="w-5 h-5 text-gray-400 shrink-0" />
                                                <div>
                                                    <Link
                                                        href={`/superadmin/organisations/${demande.organisation.id}`}
                                                        className="font-semibold text-gray-900 hover:text-blue-600"
                                                    >
                                                        {demande.organisation.nom}
                                                    </Link>
                                                    <span className="ml-2 text-xs text-gray-400">
                                                        {new Date(demande.created_at).toLocaleDateString('fr-FR', {
                                                            day: '2-digit',
                                                            month: 'long',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </span>
                                                </div>
                                                <div className="ml-auto">{statutBadge(demande.statut)}</div>
                                            </div>

                                            {/* Changement de plan */}
                                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-3">
                                                <div className="text-center">
                                                    <p className="text-xs text-gray-400 mb-0.5">Plan actuel</p>
                                                    <p className="font-medium text-sm capitalize">
                                                        {demande.plan_actuel?.nom ?? '—'}
                                                    </p>
                                                    {demande.plan_actuel && (
                                                        <p className="text-xs text-gray-500">
                                                            {formatXOF(demande.plan_actuel.prix_mensuel)}/mois
                                                        </p>
                                                    )}
                                                </div>
                                                <ArrowRight className="w-5 h-5 text-blue-400 shrink-0" />
                                                <div className="text-center">
                                                    <p className="text-xs text-gray-400 mb-0.5">Plan demandé</p>
                                                    <p className="font-semibold text-sm capitalize text-blue-700">
                                                        {demande.plan_demande.nom}
                                                    </p>
                                                    <p className="text-xs text-blue-500">
                                                        {demande.periodicite_demandee === 'annuel'
                                                            ? formatXOF(demande.plan_demande.prix_annuel) + '/an'
                                                            : formatXOF(demande.plan_demande.prix_mensuel) + '/mois'}
                                                    </p>
                                                </div>
                                                <div className="ml-4">
                                                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100 capitalize">
                                                        {demande.periodicite_demandee}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Message de l'admin */}
                                            {demande.message && (
                                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm text-blue-800 mb-2">
                                                    <strong>Message : </strong>{demande.message}
                                                </div>
                                            )}

                                            {/* Motif de rejet */}
                                            {demande.motif_rejet && (
                                                <div className="p-3 bg-red-50 rounded-lg border border-red-100 text-sm text-red-800">
                                                    <strong>Motif de rejet : </strong>{demande.motif_rejet}
                                                </div>
                                            )}

                                            {/* Date de traitement */}
                                            {demande.traite_le && (
                                                <p className="text-xs text-gray-400 mt-2">
                                                    Traité le {new Date(demande.traite_le).toLocaleDateString('fr-FR')}
                                                </p>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        {demande.statut === 'en_attente' && (
                                            <div className="flex flex-col gap-2 shrink-0">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleApprouver(demande)}
                                                    disabled={loading}
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                >
                                                    <Check className="w-4 h-4 mr-1" /> Approuver
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => { setRejetModal(demande); setMotifRejet(''); }}
                                                    disabled={loading}
                                                    className="text-red-600 border-red-300 hover:bg-red-50"
                                                >
                                                    <X className="w-4 h-4 mr-1" /> Rejeter
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {demandes.last_page > 1 && (
                    <div className="flex justify-center gap-2">
                        {demandes.prev_page_url && (
                            <Button variant="outline" size="sm" onClick={() => router.get(demandes.prev_page_url!)}>
                                Précédent
                            </Button>
                        )}
                        <span className="flex items-center text-sm text-gray-500">
                            Page {demandes.current_page} / {demandes.last_page}
                        </span>
                        {demandes.next_page_url && (
                            <Button variant="outline" size="sm" onClick={() => router.get(demandes.next_page_url!)}>
                                Suivant
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Modal rejet */}
            {rejetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md bg-white rounded-xl shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-lg font-semibold text-red-700">Rejeter la demande</h2>
                            <button onClick={() => setRejetModal(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleRejeter} className="p-6 space-y-4">
                            <div className="p-3 bg-gray-50 rounded-lg text-sm">
                                <p className="font-medium">{rejetModal.organisation.nom}</p>
                                <p className="text-gray-500">
                                    Demande de passage au plan{' '}
                                    <strong className="text-gray-700">{rejetModal.plan_demande.nom}</strong>
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Motif du rejet <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={motifRejet}
                                    onChange={(e) => setMotifRejet(e.target.value)}
                                    required
                                    rows={4}
                                    maxLength={500}
                                    placeholder="Expliquez la raison du rejet à l'organisation..."
                                    className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                                <p className="text-xs text-gray-400 mt-1">{motifRejet.length}/500</p>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setRejetModal(null)}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                    disabled={loading || !motifRejet.trim()}
                                >
                                    {loading ? 'Envoi...' : 'Confirmer le rejet'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </SuperAdminLayout>
    );
}
