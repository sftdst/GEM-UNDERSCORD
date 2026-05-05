import { Head, Link, router, usePage } from '@inertiajs/react';
import { CheckCircle, PauseCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import SuperAdminLayout from '@/layouts/superadmin-layout';

interface Abonnement {
    id: string;
    statut: 'actif' | 'suspendu' | 'termine';
    periodicite: 'mensuel' | 'annuel';
    date_debut: string;
    date_fin: string;
    organisation: { id: string; nom: string };
    plan: { id: string; nom: string };
    created_at: string;
}

interface PaginatedResponse {
    data: Abonnement[];
    links: any;
    current_page: number;
    total: number;
    per_page: number;
}

export default function AbonnementsIndex() {
    const page = usePage();
    const { abonnements, filters } = page.props as unknown as {
        abonnements: PaginatedResponse;
        filters: { q?: string; statut?: string; organisation_id?: string };
    };

    const [searchTerm, setSearchTerm] = useState(filters?.q || '');
    const [statusFilter, setStatusFilter] = useState(filters?.statut || 'all');

    const handleSearch = () => {
        router.get('/superadmin/abonnements', {
            q: searchTerm,
            statut: statusFilter === 'all' ? undefined : statusFilter,
        });
    };

    const getStatusBadgeColor = (statut: string) => {
        switch (statut) {
            case 'actif':
                return 'bg-green-100 text-green-800';
            case 'suspendu':
                return 'bg-yellow-100 text-yellow-800';
            case 'termine':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (statut: string) => {
        switch (statut) {
            case 'actif':
                return <CheckCircle className="w-4 h-4" />;
            case 'suspendu':
                return <PauseCircle className="w-4 h-4" />;
            case 'termine':
                return <AlertCircle className="w-4 h-4" />;
            default:
                return <AlertCircle className="w-4 h-4" />;
        }
    };

    const handleAction = (action: string, abonnementId: string) => {
        const actionMap: Record<string, string> = {
            suspend: `/superadmin/abonnements/${abonnementId}/suspend`,
            activate: `/superadmin/abonnements/${abonnementId}/activate`,
            renew: `/superadmin/abonnements/${abonnementId}/renew`,
            terminate: `/superadmin/abonnements/${abonnementId}/terminate`,
        };

        if (actionMap[action]) {
            router.post(actionMap[action]);
        }
    };

    return (
        <SuperAdminLayout>
            <Head title="Abonnements" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Abonnements</h1>
                    <p className="text-gray-600 mt-1">Gérez tous les abonnements des organisations</p>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex gap-4 flex-wrap">
                            <Input
                                placeholder="Rechercher par organisation..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1 min-w-[200px]"
                            />
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Tous les statuts" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous</SelectItem>
                                    <SelectItem value="actif">Actif</SelectItem>
                                    <SelectItem value="suspendu">Suspendu</SelectItem>
                                    <SelectItem value="termine">Terminé</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button onClick={handleSearch}>Rechercher</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Liste des Abonnements ({abonnements.total})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {abonnements.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10">
                                <p className="text-gray-500 text-center">Aucun abonnement trouvé</p>
                                <p className="text-gray-400 text-sm mt-1">Les abonnements apparaîtront ici après création d'organisations</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="text-left py-3 px-4 font-medium">Organisation</th>
                                            <th className="text-left py-3 px-4 font-medium">Plan</th>
                                            <th className="text-left py-3 px-4 font-medium">Statut</th>
                                            <th className="text-left py-3 px-4 font-medium">Périodicité</th>
                                            <th className="text-left py-3 px-4 font-medium">Date Fin</th>
                                            <th className="text-center py-3 px-4 font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {abonnements.data.map((sub) => (
                                            <tr key={sub.id} className="border-b hover:bg-gray-50">
                                                <td className="py-3 px-4 font-medium">{sub.organisation.nom}</td>
                                                <td className="py-3 px-4">{sub.plan.nom}</td>
                                                <td className="py-3 px-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(
                                                            sub.statut
                                                        )}`}
                                                    >
                                                        {getStatusIcon(sub.statut)}
                                                        {sub.statut}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">{sub.periodicite}</td>
                                                <td className="py-3 px-4">
                                                    {new Date(sub.date_fin).toLocaleDateString('fr-FR')}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex justify-center gap-1">
                                                        <Link href={`/superadmin/abonnements/${sub.id}/factures`}>
                                                            <button className="px-2 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded">
                                                                Factures
                                                            </button>
                                                        </Link>
                                                        {sub.statut === 'actif' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleAction('suspend', sub.id)}
                                                                    className="px-2 py-1 text-xs bg-yellow-50 text-yellow-600 hover:bg-yellow-100 rounded"
                                                                >
                                                                    Suspendre
                                                                </button>
                                                                <button
                                                                    onClick={() => handleAction('renew', sub.id)}
                                                                    className="px-2 py-1 text-xs bg-green-50 text-green-600 hover:bg-green-100 rounded"
                                                                >
                                                                    Renouveler
                                                                </button>
                                                            </>
                                                        )}
                                                        {sub.statut === 'suspendu' && (
                                                            <button
                                                                onClick={() => handleAction('activate', sub.id)}
                                                                className="px-2 py-1 text-xs bg-green-50 text-green-600 hover:bg-green-100 rounded"
                                                            >
                                                                Réactiver
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {abonnements.data.length > 0 && (
                            <div className="flex justify-center mt-6 gap-2">
                                {abonnements.links?.map((link: any, idx: number) => (
                                    <Link key={idx} href={link.url || '#'}>
                                        <Button
                                            variant={link.active ? 'default' : 'outline'}
                                            disabled={!link.url}
                                            className="text-xs"
                                        >
                                            {link.label.replace(/&laquo;|&raquo;/g, '')}
                                        </Button>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </SuperAdminLayout>
    );
}
