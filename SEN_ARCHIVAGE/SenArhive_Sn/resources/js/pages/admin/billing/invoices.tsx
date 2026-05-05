import { Head, Link } from '@inertiajs/react';
import { FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Facture, PaginatedData } from '@/types/models';

interface Props {
    factures: PaginatedData<Facture> & { prev_page_url: string | null; next_page_url: string | null };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Administration', href: '/admin' },
    { title: 'Factures', href: '/admin/billing/invoices' },
];

function formatXOF(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 0 }).format(amount) + ' FCFA';
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

function statutBadge(statut: string) {
    switch (statut) {
        case 'payee':
            return <Badge className="bg-green-100 text-green-800 border-green-200">Payee</Badge>;
        case 'en_attente':
            return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">En attente</Badge>;
        case 'echouee':
            return <Badge className="bg-red-100 text-red-800 border-red-200">Echouee</Badge>;
        case 'remboursee':
            return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Remboursee</Badge>;
        default:
            return <Badge variant="secondary">{statut}</Badge>;
    }
}

export default function InvoicesPage({ factures }: Props) {
    const items = factures.data ?? [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Factures" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <h1 className="text-2xl font-bold">Factures</h1>

                {items.length > 0 ? (
                    <>
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="px-4 py-3 text-left font-medium">Numero</th>
                                        <th className="px-4 py-3 text-left font-medium">Date</th>
                                        <th className="px-4 py-3 text-right font-medium">Montant HT</th>
                                        <th className="px-4 py-3 text-right font-medium">TVA</th>
                                        <th className="px-4 py-3 text-right font-medium">Montant TTC</th>
                                        <th className="px-4 py-3 text-left font-medium">Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((facture) => (
                                        <tr key={facture.id} className="border-b last:border-0 hover:bg-muted/30">
                                            <td className="px-4 py-3 font-medium">{facture.numero}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{formatDate(facture.created_at)}</td>
                                            <td className="px-4 py-3 text-right">{formatXOF(facture.montant_ht)}</td>
                                            <td className="px-4 py-3 text-right text-muted-foreground">{formatXOF(facture.montant_tva)}</td>
                                            <td className="px-4 py-3 text-right font-medium">{formatXOF(facture.montant_ttc)}</td>
                                            <td className="px-4 py-3">{statutBadge(facture.statut)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Page {factures.current_page} sur {factures.last_page} ({factures.total} resultats)
                            </p>
                            <div className="flex items-center gap-2">
                                {factures.prev_page_url ? (
                                    <Link href={factures.prev_page_url}><Button variant="outline" size="sm">Precedent</Button></Link>
                                ) : (
                                    <Button variant="outline" size="sm" disabled>Precedent</Button>
                                )}
                                {factures.next_page_url ? (
                                    <Link href={factures.next_page_url}><Button variant="outline" size="sm">Suivant</Button></Link>
                                ) : (
                                    <Button variant="outline" size="sm" disabled>Suivant</Button>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-1 items-center justify-center">
                        <div className="text-center">
                            <FileText className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
                            <h3 className="text-lg font-medium">Aucune facture</h3>
                            <p className="mt-1 text-muted-foreground">Vos factures apparaitront ici.</p>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
