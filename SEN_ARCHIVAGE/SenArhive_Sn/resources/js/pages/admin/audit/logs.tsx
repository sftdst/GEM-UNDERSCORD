import { Head, Link } from '@inertiajs/react';
import { Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { JournalActivite, PaginatedData } from '@/types/models';

type JournalWithUser = Omit<JournalActivite, 'utilisateur'> & {
    utilisateur?: { nom: string; prenom: string };
};

interface PaginatedJournal extends PaginatedData<JournalWithUser> {
    prev_page_url: string | null;
    next_page_url: string | null;
}

interface Props {
    journaux: PaginatedJournal;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Administration', href: '/admin' },
    { title: "Journal d'activite", href: '/admin/audit/logs' },
];

function formatDateTime(dateStr: string) {
    return new Date(dateStr).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function statutBadge(statut: string) {
    switch (statut) {
        case 'succes':
            return <Badge className="bg-green-100 text-green-800 border-green-200">Succes</Badge>;
        case 'echec':
            return <Badge className="bg-red-100 text-red-800 border-red-200">Echec</Badge>;
        default:
            return <Badge variant="secondary">{statut}</Badge>;
    }
}

export default function AuditLogsPage({ journaux }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Journal d'activite" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <h1 className="text-2xl font-bold">Journal d'activite</h1>

                {journaux.data.length > 0 ? (
                    <>
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="px-4 py-3 text-left font-medium">Date / Heure</th>
                                        <th className="px-4 py-3 text-left font-medium">Utilisateur</th>
                                        <th className="px-4 py-3 text-left font-medium">Action</th>
                                        <th className="px-4 py-3 text-left font-medium">Ressource</th>
                                        <th className="px-4 py-3 text-left font-medium">IP</th>
                                        <th className="px-4 py-3 text-left font-medium">Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {journaux.data.map((log) => (
                                        <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30">
                                            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                                            <td className="px-4 py-3">
                                                {log.utilisateur
                                                    ? `${log.utilisateur.prenom} ${log.utilisateur.nom}`
                                                    : <span className="text-muted-foreground">Systeme</span>
                                                }
                                            </td>
                                            <td className="px-4 py-3 font-medium">{log.action}</td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {log.ressource_type
                                                    ? `${log.ressource_type} #${log.ressource_id}`
                                                    : '—'
                                                }
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{log.ip_address ?? '—'}</td>
                                            <td className="px-4 py-3">{statutBadge(log.statut)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Page {journaux.current_page} sur {journaux.last_page} ({journaux.total} resultats)
                            </p>
                            <div className="flex items-center gap-2">
                                {journaux.prev_page_url ? (
                                    <Link href={journaux.prev_page_url}>
                                        <Button variant="outline" size="sm">Precedent</Button>
                                    </Link>
                                ) : (
                                    <Button variant="outline" size="sm" disabled>Precedent</Button>
                                )}
                                {journaux.next_page_url ? (
                                    <Link href={journaux.next_page_url}>
                                        <Button variant="outline" size="sm">Suivant</Button>
                                    </Link>
                                ) : (
                                    <Button variant="outline" size="sm" disabled>Suivant</Button>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-1 items-center justify-center">
                        <div className="text-center">
                            <Activity className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
                            <h3 className="text-lg font-medium">Aucune activite</h3>
                            <p className="mt-1 text-muted-foreground">Le journal d'activite est vide.</p>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
