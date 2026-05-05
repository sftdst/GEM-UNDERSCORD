import { Head, Link, router, usePage } from '@inertiajs/react';
import { Eye, Edit, Trash2, AlertCircle, CheckCircle, PauseCircle } from 'lucide-react';
import React, { useState } from 'react';
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

interface Organisation {
    id: string;
    nom: string;
    slug: string;
    domaine?: string;
    statut: 'actif' | 'inactif' | 'suspendu';
    plan?: { nom: string };
    utilisateurs?: any[];
    created_at: string;
}

interface PaginatedResponse {
    data: Organisation[];
    links: any;
    current_page: number;
    total: number;
    per_page: number;
}

export default function OrganisationsIndex() {
    const page = usePage();
    const { organisations, filters } = page.props as unknown as {
        organisations: PaginatedResponse;
        filters: { q?: string; statut?: string };
    };

    const [searchTerm, setSearchTerm] = useState(filters?.q || '');
    const [statusFilter, setStatusFilter] = useState(filters?.statut || 'all');

    const handleSearch = () => {
        router.get('/superadmin/organisations', {
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
            case 'inactif':
                return 'bg-gray-100 text-gray-800';
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
            default:
                return <AlertCircle className="w-4 h-4" />;
        }
    };

    return (
        <SuperAdminLayout>
            <Head title="Organisations" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Organisations</h1>
                        <p className="text-gray-600 mt-1">Gérez toutes les organisations</p>
                    </div>
                    <Link href="/superadmin/organisations/create">
                        <Button>Nouvelle Organisation</Button>
                    </Link>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex gap-4 flex-wrap">
                            <Input
                                placeholder="Rechercher par nom, domaine, slug..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1 min-w-[200px]"
                            />
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Tous les statuts" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les statuts</SelectItem>
                                    <SelectItem value="actif">Actif</SelectItem>
                                    <SelectItem value="inactif">Inactif</SelectItem>
                                    <SelectItem value="suspendu">Suspendu</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button onClick={handleSearch}>Rechercher</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Liste des Organisations ({organisations.total})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {organisations.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10">
                                <p className="text-gray-500 text-center mb-4">Aucune organisation trouvée</p>
                                <Link href="/superadmin/organisations/create">
                                    <Button>Créer la première organisation</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="text-left py-3 px-4 font-medium">Nom</th>
                                            <th className="text-left py-3 px-4 font-medium">Slug</th>
                                            <th className="text-left py-3 px-4 font-medium">Plan</th>
                                            <th className="text-left py-3 px-4 font-medium">Statut</th>
                                            <th className="text-left py-3 px-4 font-medium">Créée</th>
                                            <th className="text-center py-3 px-4 font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {organisations.data.map((org, idx) => (
                                            <tr key={org.id} className="border-b hover:bg-gray-50">
                                                <td className="py-3 px-4 font-medium">{org.nom}</td>
                                                <td className="py-3 px-4 text-gray-600 text-sm">{org.slug}</td>
                                                <td className="py-3 px-4">{org.plan?.nom || '-'}</td>
                                                <td className="py-3 px-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(
                                                            org.statut
                                                        )}`}
                                                    >
                                                        {getStatusIcon(org.statut)}
                                                        {org.statut}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-gray-600">
                                                    {new Date(org.created_at).toLocaleDateString('fr-FR')}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex justify-center gap-2">
                                                        <Link href={`/superadmin/organisations/${org.id}`}>
                                                            <button className="p-1 text-blue-600 hover:bg-blue-100 rounded">
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                        </Link>
                                                        <Link href={`/superadmin/organisations/${org.id}/edit`}>
                                                            <button className="p-1 text-green-600 hover:bg-green-100 rounded">
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {organisations.data.length > 0 && (
                            <div className="flex justify-center mt-6 gap-2">
                                {organisations.links?.map((link: any, idx: number) => (
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
