import { Head, Link, usePage } from '@inertiajs/react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SuperAdminLayout from '@/layouts/superadmin-layout';

interface Facture {
    id: string;
    montant_ht: number;
    taux_tva: number;
    montant_tva: number;
    montant_ttc: number;
    statut: string;
    description: string;
    devise: string;
    created_at: string;
}

interface Abonnement {
    id: string;
    organisation: { nom: string };
    plan: { nom: string };
}

interface PaginatedResponse {
    data: Facture[];
    links: any;
    current_page: number;
    total: number;
    per_page: number;
}

export default function FacturesAbonnement() {
    const page = usePage();
    const { abonnement, factures } = page.props as unknown as {
        abonnement: Abonnement;
        factures: PaginatedResponse;
    };

    return (
        <SuperAdminLayout>
            <Head title="Factures" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Factures</h1>
                        <p className="text-gray-600 mt-1">
                            {abonnement.organisation.nom} - {abonnement.plan.nom}
                        </p>
                    </div>
                    <Link href="/superadmin/abonnements">
                        <Button variant="outline">Retour</Button>
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Total Factures</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{factures.total}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Montant HT Total</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {factures.data
                                    .reduce((sum, f) => sum + (f.montant_ht || 0), 0)
                                    .toLocaleString('fr-FR')} XOF
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Montant TTC Total</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {factures.data
                                    .reduce((sum, f) => sum + (f.montant_ttc || 0), 0)
                                    .toLocaleString('fr-FR')} XOF
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Liste des Factures</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="text-left py-3 px-4 font-medium">Date</th>
                                        <th className="text-left py-3 px-4 font-medium">Description</th>
                                        <th className="text-right py-3 px-4 font-medium">Montant HT</th>
                                        <th className="text-right py-3 px-4 font-medium">TVA</th>
                                        <th className="text-right py-3 px-4 font-medium">Montant TTC</th>
                                        <th className="text-center py-3 px-4 font-medium">Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {factures.data.map((facture) => (
                                        <tr key={facture.id} className="border-b hover:bg-gray-50">
                                            <td className="py-3 px-4 text-sm">
                                                {new Date(facture.created_at).toLocaleDateString('fr-FR')}
                                            </td>
                                            <td className="py-3 px-4">{facture.description}</td>
                                            <td className="py-3 px-4 text-right font-medium">
                                                {(facture.montant_ht || 0).toLocaleString('fr-FR')}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                {(facture.montant_tva || 0).toLocaleString('fr-FR')}
                                            </td>
                                            <td className="py-3 px-4 text-right font-bold">
                                                {(facture.montant_ttc || 0).toLocaleString('fr-FR')}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span
                                                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                                        facture.statut === 'payee'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}
                                                >
                                                    {facture.statut}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex justify-center mt-6 gap-2">
                            {factures.links?.map((link: any, idx: number) => (
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
                    </CardContent>
                </Card>
            </div>
        </SuperAdminLayout>
    );
}
