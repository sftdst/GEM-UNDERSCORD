import { Head, router, usePage } from '@inertiajs/react';
import { Copy, ExternalLink, Link2, Trash2, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { LienPartage } from '@/types/models';

interface LienWithMeta extends LienPartage {
    url: string;
    est_expire: boolean;
    est_epuise: boolean;
    createur?: { id: string; nom: string; prenom: string };
}

interface Props {
    liens: LienWithMeta[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Partage', href: '/partage' },
];

function formatDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function statusBadge(lien: LienWithMeta) {
    if (lien.est_expire) return <Badge className="bg-red-100 text-red-800 border-red-200">Expire</Badge>;
    if (lien.est_epuise) return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Epuise</Badge>;
    return <Badge className="bg-green-100 text-green-800 border-green-200">Actif</Badge>;
}

export default function PartageIndex({ liens }: Props) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props as { flash: { success?: string; error?: string } };

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    function copyLink(url: string) {
        navigator.clipboard.writeText(url).then(() => {
            toast.success('Lien copie dans le presse-papiers');
        });
    }

    function deleteLink(lien: LienWithMeta) {
        if (!confirm('Supprimer ce lien de partage ?')) return;
        router.delete(`/partage/${lien.id}`);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Liens de partage" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Liens de partage</h1>
                </div>

                {liens.length > 0 ? (
                    <div className="space-y-3">
                        {liens.map((lien) => (
                            <div
                                key={lien.id}
                                className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/30"
                            >
                                <div className="flex items-start gap-4 flex-1 min-w-0">
                                    <Link2 className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-medium truncate">
                                                {lien.document?.titre ?? 'Document supprime'}
                                            </p>
                                            {statusBadge(lien)}
                                        </div>
                                        <p className="mt-1 text-sm text-muted-foreground truncate">
                                            {lien.url}
                                        </p>
                                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                            {lien.createur && (
                                                <span>Par {lien.createur.prenom} {lien.createur.nom}</span>
                                            )}
                                            {lien.created_at && (
                                                <span>Cree le {formatDate(lien.created_at)}</span>
                                            )}
                                            {lien.expire_le && (
                                                <span>Expire le {formatDate(lien.expire_le)}</span>
                                            )}
                                            {lien.max_telechargements && (
                                                <span>
                                                    {lien.nb_telechargements}/{lien.max_telechargements} telechargements
                                                </span>
                                            )}
                                            {lien.est_protege && (
                                                <span className="flex items-center gap-1">
                                                    <AlertTriangle className="h-3 w-3" /> Protege par mot de passe
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 ml-4">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => copyLink(lien.url)}
                                        title="Copier le lien"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                    <a href={lien.url} target="_blank" rel="noopener noreferrer">
                                        <Button variant="ghost" size="icon" title="Ouvrir">
                                            <ExternalLink className="h-4 w-4" />
                                        </Button>
                                    </a>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => deleteLink(lien)}
                                        title="Supprimer"
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-1 items-center justify-center">
                        <div className="text-center">
                            <Link2 className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
                            <h3 className="text-lg font-medium">Aucun lien de partage</h3>
                            <p className="mt-1 text-muted-foreground">
                                Partagez un document depuis sa page de detail pour creer un lien.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
