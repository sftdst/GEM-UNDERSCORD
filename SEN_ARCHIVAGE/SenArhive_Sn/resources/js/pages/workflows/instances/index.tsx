import { Head, Link } from '@inertiajs/react';
import { GitBranch, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { InstanceWorkflow, Workflow, Document } from '@/types/models';

interface Props {
    instances: (InstanceWorkflow & { workflow: Workflow; document: Document })[];
}

const statutLabels: Record<string, string> = {
    en_cours: 'En cours',
    approuve: 'Approuve',
    rejete: 'Rejete',
    annule: 'Annule',
};

const statutVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    en_cours: 'default',
    approuve: 'secondary',
    rejete: 'destructive',
    annule: 'outline',
};

export default function InstancesIndex({ instances }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Workflows', href: '/workflows' },
        { title: 'Instances', href: '/workflows/instances' },
    ];

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Instances de workflow" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Instances de workflow</h1>
                </div>

                {/* Instances list */}
                {instances.length > 0 && (
                    <div className="overflow-hidden rounded-lg border">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">Document</th>
                                    <th className="px-4 py-3 text-left font-medium">Workflow</th>
                                    <th className="px-4 py-3 text-left font-medium">Etape courante</th>
                                    <th className="px-4 py-3 text-left font-medium">Statut</th>
                                    <th className="px-4 py-3 text-left font-medium">Date de creation</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {instances.map((inst) => (
                                    <tr key={inst.id} className="hover:bg-accent/50">
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/workflows/instances/${inst.id}`}
                                                className="flex items-center gap-2 font-medium text-primary hover:underline"
                                            >
                                                <FileText className="h-4 w-4" />
                                                {inst.document?.titre ?? 'Document inconnu'}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {inst.workflow?.nom ?? '-'}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            Etape {inst.etape_courante}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={statutVariants[inst.statut] ?? 'outline'}>
                                                {statutLabels[inst.statut] ?? inst.statut}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {formatDate(inst.created_at)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Empty state */}
                {instances.length === 0 && (
                    <div className="flex flex-1 items-center justify-center text-center">
                        <div>
                            <GitBranch className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
                            <h3 className="text-lg font-medium">Aucune instance de workflow</h3>
                            <p className="text-muted-foreground">
                                Les instances apparaitront ici lorsqu'un workflow sera lance sur un document.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
