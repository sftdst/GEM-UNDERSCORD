import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Eye, Edit, Trash2, CheckCircle, XCircle, Users, FileText, HardDrive, Building2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import SuperAdminLayout from '@/layouts/superadmin-layout';

interface Plan {
    id: string;
    nom: string;
    description: string | null;
    prix_mensuel: string;
    prix_annuel: string;
    stockage_max_go: number;
    users_max: number | null;
    documents_max: number | null;
    fonctionnalites: string[];
    actif: boolean;
    organisations_count: number;
    abonnements_count: number;
}

export default function PlansIndex() {
    const page = usePage();
    const { plans, filters } = page.props as unknown as {
        plans: Plan[];
        filters: { q?: string };
    };

    const [searchTerm, setSearchTerm] = useState(filters?.q || '');

    const handleSearch = () => {
        router.get('/superadmin/plans', { q: searchTerm });
    };

    const handleDelete = (plan: Plan) => {
        if (!confirm(`Supprimer le plan "${plan.nom}" ? Cette action est irréversible.`)) return;
        router.delete(`/superadmin/plans/${plan.id}`);
    };

    const handleToggleActif = (plan: Plan) => {
        const action = plan.actif ? 'deactivate' : 'activate';
        router.post(`/superadmin/plans/${plan.id}/${action}`);
    };

    const formatPrice = (price: string) =>
        new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
            maximumFractionDigits: 0,
        }).format(Number(price));

    const totalOrgs = plans.reduce((s, p) => s + p.organisations_count, 0);

    return (
        <SuperAdminLayout>
            <Head title="Plans & Tarifs" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Plans & Tarifs</h1>
                        <p className="text-gray-600 mt-1">Gérez les plans d'abonnement disponibles</p>
                    </div>
                    <Link href="/superadmin/plans/create">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Nouveau Plan
                        </Button>
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-6 flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Plans</p>
                                <p className="text-2xl font-bold">{plans.length}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Plans Actifs</p>
                                <p className="text-2xl font-bold">{plans.filter((p) => p.actif).length}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 flex items-center gap-4">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <Building2 className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Organisations</p>
                                <p className="text-2xl font-bold">{totalOrgs}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex gap-4">
                            <Input
                                placeholder="Rechercher un plan..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="flex-1"
                            />
                            <Button onClick={handleSearch}>Rechercher</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Plans Grid */}
                {plans.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 mb-4">Aucun plan trouvé</p>
                            <Link href="/superadmin/plans/create">
                                <Button>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Créer le premier plan
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {plans.map((plan) => (
                            <Card key={plan.id} className={`flex flex-col ${!plan.actif ? 'opacity-70' : ''}`}>
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start gap-2">
                                        <CardTitle className="text-xl">{plan.nom}</CardTitle>
                                        <span
                                            className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                                plan.actif
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-500'
                                            }`}
                                        >
                                            {plan.actif ? (
                                                <CheckCircle className="w-3 h-3" />
                                            ) : (
                                                <XCircle className="w-3 h-3" />
                                            )}
                                            {plan.actif ? 'Actif' : 'Inactif'}
                                        </span>
                                    </div>
                                    {plan.description && (
                                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{plan.description}</p>
                                    )}
                                </CardHeader>

                                <CardContent className="flex flex-col flex-1 space-y-4">
                                    {/* Tarifs */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-blue-50 rounded-lg p-3 text-center">
                                            <p className="text-xs text-blue-600 font-medium mb-1">Mensuel</p>
                                            <p className="text-base font-bold text-blue-900">{formatPrice(plan.prix_mensuel)}</p>
                                        </div>
                                        <div className="bg-purple-50 rounded-lg p-3 text-center">
                                            <p className="text-xs text-purple-600 font-medium mb-1">Annuel</p>
                                            <p className="text-base font-bold text-purple-900">{formatPrice(plan.prix_annuel)}</p>
                                        </div>
                                    </div>

                                    {/* Limites */}
                                    <div className="space-y-2 text-sm border rounded-lg p-3">
                                        <div className="flex items-center justify-between text-gray-600">
                                            <span className="flex items-center gap-1">
                                                <HardDrive className="w-3.5 h-3.5" /> Stockage
                                            </span>
                                            <span className="font-medium">{plan.stockage_max_go} Go</span>
                                        </div>
                                        <div className="flex items-center justify-between text-gray-600">
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3.5 h-3.5" /> Utilisateurs
                                            </span>
                                            <span className="font-medium">{plan.users_max ?? '∞ Illimité'}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-gray-600">
                                            <span className="flex items-center gap-1">
                                                <FileText className="w-3.5 h-3.5" /> Documents
                                            </span>
                                            <span className="font-medium">{plan.documents_max ?? '∞ Illimité'}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-gray-600">
                                            <span className="flex items-center gap-1">
                                                <Building2 className="w-3.5 h-3.5" /> Organisations
                                            </span>
                                            <span className="font-medium text-blue-600">{plan.organisations_count}</span>
                                        </div>
                                    </div>

                                    {/* Fonctionnalités */}
                                    {plan.fonctionnalites?.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {plan.fonctionnalites.slice(0, 4).map((f, i) => (
                                                <span
                                                    key={i}
                                                    className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                                                >
                                                    {f}
                                                </span>
                                            ))}
                                            {plan.fonctionnalites.length > 4 && (
                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                                                    +{plan.fonctionnalites.length - 4}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-2 border-t mt-auto">
                                        <Link href={`/superadmin/plans/${plan.id}`} className="flex-1">
                                            <Button variant="outline" size="sm" className="w-full">
                                                <Eye className="w-3.5 h-3.5 mr-1" /> Voir
                                            </Button>
                                        </Link>
                                        <Link href={`/superadmin/plans/${plan.id}/edit`} className="flex-1">
                                            <Button variant="outline" size="sm" className="w-full">
                                                <Edit className="w-3.5 h-3.5 mr-1" /> Modifier
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleToggleActif(plan)}
                                            title={plan.actif ? 'Désactiver' : 'Activer'}
                                            className={
                                                plan.actif
                                                    ? 'text-yellow-600 hover:bg-yellow-50 border-yellow-200'
                                                    : 'text-green-600 hover:bg-green-50 border-green-200'
                                            }
                                        >
                                            {plan.actif ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                        </Button>
                                        {plan.organisations_count === 0 && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(plan)}
                                                title="Supprimer"
                                                className="text-red-600 hover:bg-red-50 border-red-200"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </SuperAdminLayout>
    );
}
