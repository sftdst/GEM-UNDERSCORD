import { Head, Link, usePage } from '@inertiajs/react';
import { CheckCircle, AlertCircle, PauseCircle } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SuperAdminLayout from '@/layouts/superadmin-layout';

interface Organisation {
    id: string;
    nom: string;
    slug: string;
    domaine?: string;
    statut: 'actif' | 'inactif' | 'suspendu';
    plan: { nom: string; prix_mensuel: number };
    pays: string;
    langue_defaut: string;
    created_at: string;
    updated_at: string;
}

interface Stats {
    utilisateurs: number;
    documents: number;
    espaces: number;
    stockage_utilise: number;
}

export default function ShowOrganisation() {
    const page = usePage();
    const { organisation, stats } = page.props as unknown as {
        organisation: Organisation;
        stats: Stats;
    };

    const getStatusIcon = (statut: string) => {
        switch (statut) {
            case 'actif':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'suspendu':
                return <PauseCircle className="w-5 h-5 text-yellow-600" />;
            default:
                return <AlertCircle className="w-5 h-5 text-gray-600" />;
        }
    };

    const getStatusColor = (statut: string) => {
        switch (statut) {
            case 'actif':
                return 'text-green-700 bg-green-50';
            case 'suspendu':
                return 'text-yellow-700 bg-yellow-50';
            default:
                return 'text-gray-700 bg-gray-50';
        }
    };

    return (
        <SuperAdminLayout>
            <Head title={organisation.nom} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{organisation.nom}</h1>
                        <p className="text-gray-600 mt-1">slug: {organisation.slug}</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href={`/superadmin/organisations/${organisation.id}/edit`}>
                            <Button>Éditer</Button>
                        </Link>
                        <Link href="/superadmin/organisations">
                            <Button variant="outline">Retour</Button>
                        </Link>
                    </div>
                </div>

                {/* Status Card */}
                <Card className={getStatusColor(organisation.statut)}>
                    <CardContent className="pt-6 flex items-center gap-4">
                        {getStatusIcon(organisation.statut)}
                        <div>
                            <p className="font-semibold">Statut: {organisation.statut}</p>
                            <p className="text-sm opacity-75">
                                Créée le {new Date(organisation.created_at).toLocaleDateString('fr-FR')}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Utilisateurs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{stats.utilisateurs}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Documents</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.documents}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Espaces</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600">{stats.espaces}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Stockage</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">{stats.stockage_utilise} MB</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Informations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Domaine</p>
                                <p className="text-gray-900">{organisation.domaine || 'Non configuré'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Plan</p>
                                <p className="text-gray-900">{organisation.plan.nom}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Pays</p>
                                <p className="text-gray-900">{organisation.pays}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Langue</p>
                                <p className="text-gray-900">{organisation.langue_defaut}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Prix mensuel</p>
                                <p className="text-gray-900">{organisation.plan.prix_mensuel} XOF</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Mis à jour</p>
                                <p className="text-gray-900">
                                    {new Date(organisation.updated_at).toLocaleDateString('fr-FR')}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </SuperAdminLayout>
    );
}
