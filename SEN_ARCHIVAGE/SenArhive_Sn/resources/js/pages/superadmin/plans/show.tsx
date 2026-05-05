import { Head, Link, router, usePage } from '@inertiajs/react';
import { Edit, CheckCircle, XCircle, Users, FileText, HardDrive, Building2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SuperAdminLayout from '@/layouts/superadmin-layout';

interface Fonctionnalite {
    id: string;
    code: string;
    nom: string;
    categorie: string | null;
}

interface Plan {
    id: string;
    nom: string;
    description: string | null;
    prix_mensuel: string;
    prix_annuel: string;
    stockage_max_go: number;
    users_max: number | null;
    documents_max: number | null;
    fonctionnalites: Fonctionnalite[];
    actif: boolean;
    organisations_count: number;
    abonnements_count: number;
    created_at: string;
    updated_at: string;
}

interface Organisation {
    id: string;
    nom: string;
    statut: string;
    created_at: string;
}

export default function PlanShow() {
    const { plan, organisations } = usePage().props as unknown as { plan: Plan; organisations: Organisation[] };

    const fmt = (price: string) =>
        new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
            maximumFractionDigits: 0,
        }).format(Number(price));

    const handleToggle = () => {
        const action = plan.actif ? 'deactivate' : 'activate';
        router.post(`/superadmin/plans/${plan.id}/${action}`);
    };

    const handleDelete = () => {
        if (!confirm(`Supprimer le plan "${plan.nom}" ? Cette action est irréversible.`)) return;
        router.delete(`/superadmin/plans/${plan.id}`);
    };

    const economiePct =
        Number(plan.prix_mensuel) > 0
            ? Math.round((1 - Number(plan.prix_annuel) / (Number(plan.prix_mensuel) * 12)) * 100)
            : 0;

    return (
        <SuperAdminLayout>
            <Head title={plan.nom} />

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-gray-900">{plan.nom}</h1>
                            <span
                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                                    plan.actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                }`}
                            >
                                {plan.actif ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                {plan.actif ? 'Actif' : 'Inactif'}
                            </span>
                        </div>
                        {plan.description && <p className="text-gray-600 mt-2">{plan.description}</p>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <Link href="/superadmin/plans">
                            <Button variant="outline">Retour</Button>
                        </Link>
                        <Link href={`/superadmin/plans/${plan.id}/edit`}>
                            <Button variant="outline">
                                <Edit className="w-4 h-4 mr-2" /> Modifier
                            </Button>
                        </Link>
                        <Button
                            onClick={handleToggle}
                            variant="outline"
                            className={
                                plan.actif
                                    ? 'text-yellow-600 border-yellow-300 hover:bg-yellow-50'
                                    : 'text-green-600 border-green-300 hover:bg-green-50'
                            }
                        >
                            {plan.actif ? (
                                <>
                                    <XCircle className="w-4 h-4 mr-2" /> Désactiver
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4 mr-2" /> Activer
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <Building2 className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                            <p className="text-2xl font-bold">{plan.organisations_count}</p>
                            <p className="text-sm text-gray-500">Organisations</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <CreditCard className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                            <p className="text-2xl font-bold">{plan.abonnements_count}</p>
                            <p className="text-sm text-gray-500">Abonnements</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <HardDrive className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                            <p className="text-2xl font-bold">{plan.stockage_max_go} Go</p>
                            <p className="text-sm text-gray-500">Stockage</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <Users className="w-6 h-6 text-green-500 mx-auto mb-2" />
                            <p className="text-2xl font-bold">{plan.users_max ?? '∞'}</p>
                            <p className="text-sm text-gray-500">Utilisateurs</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tarification */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Tarification</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                                <div>
                                    <p className="text-sm text-blue-600 font-medium">Abonnement Mensuel</p>
                                    <p className="text-2xl font-bold text-blue-900">{fmt(plan.prix_mensuel)}</p>
                                    <p className="text-xs text-blue-500">/ mois</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                                <div>
                                    <p className="text-sm text-purple-600 font-medium">Abonnement Annuel</p>
                                    <p className="text-2xl font-bold text-purple-900">{fmt(plan.prix_annuel)}</p>
                                    <p className="text-xs text-purple-500">/ an</p>
                                </div>
                                {economiePct > 0 && (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                        -{economiePct}%
                                    </span>
                                )}
                            </div>
                            {economiePct > 0 && (
                                <p className="text-sm text-green-600 text-center">
                                    Économie de{' '}
                                    {fmt(String(Number(plan.prix_mensuel) * 12 - Number(plan.prix_annuel)))} avec
                                    l'abonnement annuel
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Limites & Fonctionnalités */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Limites</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex items-center justify-between py-2 border-b">
                                    <span className="flex items-center gap-2 text-gray-600">
                                        <HardDrive className="w-4 h-4" /> Stockage
                                    </span>
                                    <span className="font-semibold">{plan.stockage_max_go} Go</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b">
                                    <span className="flex items-center gap-2 text-gray-600">
                                        <Users className="w-4 h-4" /> Utilisateurs max
                                    </span>
                                    <span className="font-semibold">{plan.users_max ?? 'Illimité'}</span>
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <span className="flex items-center gap-2 text-gray-600">
                                        <FileText className="w-4 h-4" /> Documents max
                                    </span>
                                    <span className="font-semibold">{plan.documents_max ?? 'Illimité'}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Fonctionnalités</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {plan.fonctionnalites?.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {plan.fonctionnalites.map((f) => (
                                            <span
                                                key={f.id}
                                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-sm"
                                            >
                                                <CheckCircle className="w-3 h-3" /> {f.nom}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400">
                                        Aucune fonctionnalité assignée.{' '}
                                        <a href={`/superadmin/plans/${plan.id}/edit`} className="text-blue-600 hover:underline">
                                            Modifier le plan
                                        </a>
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Organisations utilisant ce plan */}
                <Card>
                    <CardHeader>
                        <CardTitle>Organisations utilisant ce plan ({plan.organisations_count})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {organisations.length === 0 ? (
                            <p className="text-gray-500 text-sm py-4 text-center">
                                Aucune organisation n'utilise encore ce plan
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="text-left py-2 px-4 font-medium">Organisation</th>
                                            <th className="text-left py-2 px-4 font-medium">Statut</th>
                                            <th className="text-left py-2 px-4 font-medium">Inscrite le</th>
                                            <th className="text-center py-2 px-4 font-medium">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {organisations.map((org) => (
                                            <tr key={org.id} className="border-b hover:bg-gray-50">
                                                <td className="py-2 px-4 font-medium">{org.nom}</td>
                                                <td className="py-2 px-4">
                                                    <span
                                                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                            org.statut === 'actif'
                                                                ? 'bg-green-100 text-green-700'
                                                                : org.statut === 'suspendu'
                                                                  ? 'bg-yellow-100 text-yellow-700'
                                                                  : 'bg-gray-100 text-gray-600'
                                                        }`}
                                                    >
                                                        {org.statut}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-4 text-gray-500">
                                                    {new Date(org.created_at).toLocaleDateString('fr-FR')}
                                                </td>
                                                <td className="py-2 px-4 text-center">
                                                    <Link href={`/superadmin/organisations/${org.id}`}>
                                                        <button className="text-blue-600 hover:underline text-xs">
                                                            Voir
                                                        </button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {plan.organisations_count > 10 && (
                                    <p className="text-sm text-gray-400 mt-3 text-center">
                                        Affichage des 10 dernières organisations sur {plan.organisations_count}
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Zone de danger */}
                {plan.organisations_count === 0 && (
                    <Card className="border-red-200">
                        <CardHeader>
                            <CardTitle className="text-red-700">Zone de Danger</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 mb-4">
                                Ce plan n'est utilisé par aucune organisation. Vous pouvez le supprimer définitivement.
                            </p>
                            <Button
                                variant="outline"
                                onClick={handleDelete}
                                className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                                Supprimer ce plan
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </SuperAdminLayout>
    );
}
