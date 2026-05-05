import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, FileText, Check, X, Clock, CircleCheck, CircleX } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { InstanceWorkflow, Workflow, Document, EtapeWorkflow } from '@/types/models';

type EtapeWithUser = EtapeWorkflow;

interface Props {
    instance: InstanceWorkflow & {
        workflow: Workflow;
        document: Document;
        etapes: EtapeWithUser[];
    };
}

const statutLabels: Record<string, string> = {
    en_cours: 'En cours',
    approuve: 'Approuve',
    rejete: 'Rejete',
    annule: 'Annule',
    en_attente: 'En attente',
};

const statutVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    en_cours: 'default',
    approuve: 'secondary',
    rejete: 'destructive',
    annule: 'outline',
    en_attente: 'outline',
};

export default function InstanceShow({ instance }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Workflows', href: '/workflows' },
        { title: 'Instances', href: '/workflows/instances' },
        { title: `#${instance.id}`, href: `/workflows/instances/${instance.id}` },
    ];

    const [showApprove, setShowApprove] = useState(false);
    const [showReject, setShowReject] = useState(false);

    const approveForm = useForm({ commentaire: '' });
    const rejectForm = useForm({ commentaire: '' });

    function submitApprove(e: FormEvent) {
        e.preventDefault();
        approveForm.post(`/workflows/instances/${instance.id}/approve`, {
            onSuccess: () => {
                setShowApprove(false);
                approveForm.reset();
            },
        });
    }

    function submitReject(e: FormEvent) {
        e.preventDefault();
        rejectForm.post(`/workflows/instances/${instance.id}/reject`, {
            onSuccess: () => {
                setShowReject(false);
                rejectForm.reset();
            },
        });
    }

    function formatDate(dateStr: string | null) {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    function getEtapeIcon(statut: string, isCurrent: boolean) {
        if (statut === 'approuve') return <CircleCheck className="h-6 w-6 text-green-600" />;
        if (statut === 'rejete') return <CircleX className="h-6 w-6 text-destructive" />;
        if (isCurrent) return <Clock className="h-6 w-6 text-primary" />;
        return <Clock className="h-6 w-6 text-muted-foreground/40" />;
    }

    // Determine if the current user can act (we check if instance is en_cours)
    const canAct = instance.statut === 'en_cours';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Instance #${instance.id}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Link href="/workflows/instances">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Instance de workflow #{instance.id}</h1>
                        <p className="text-sm text-muted-foreground">
                            {instance.workflow?.nom}
                        </p>
                    </div>
                    <Badge variant={statutVariants[instance.statut] ?? 'outline'} className="ml-auto">
                        {statutLabels[instance.statut] ?? instance.statut}
                    </Badge>
                </div>

                {/* Document info card */}
                <Card>
                    <CardContent className="flex items-center gap-3 p-4">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                            <p className="font-medium">{instance.document?.titre ?? 'Document inconnu'}</p>
                            <Link
                                href={`/documents/${instance.document_id}`}
                                className="text-sm text-primary hover:underline"
                            >
                                Voir le document
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Workflow progress - vertical stepper */}
                <div>
                    <h2 className="mb-4 font-semibold">Progression du workflow</h2>
                    <div className="space-y-0">
                        {instance.etapes.map((etape, index) => {
                            const isCurrent = etape.numero_etape === instance.etape_courante && instance.statut === 'en_cours';
                            const isLast = index === instance.etapes.length - 1;

                            return (
                                <div key={etape.id} className="flex gap-4">
                                    {/* Vertical line + icon */}
                                    <div className="flex flex-col items-center">
                                        {getEtapeIcon(etape.statut, isCurrent)}
                                        {!isLast && (
                                            <div className="w-px flex-1 bg-border" />
                                        )}
                                    </div>

                                    {/* Step content */}
                                    <div className={`pb-6 ${isCurrent ? '' : ''}`}>
                                        <div className="flex items-center gap-2">
                                            <p className={`font-medium ${isCurrent ? 'text-primary' : ''}`}>
                                                Etape {etape.numero_etape}
                                            </p>
                                            <Badge
                                                variant={statutVariants[etape.statut] ?? 'outline'}
                                                className="text-xs"
                                            >
                                                {statutLabels[etape.statut] ?? etape.statut}
                                            </Badge>
                                        </div>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Assignée à : {etape.approbateur?.prenom} {etape.approbateur?.nom}
                                        </p>
                                        {etape.traite_le && (
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                Traite le {formatDate(etape.traite_le)}
                                            </p>
                                        )}
                                        {etape.commentaire && (
                                            <p className="mt-1 rounded-md bg-muted p-2 text-sm">
                                                {etape.commentaire}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Action buttons */}
                {canAct && (
                    <div className="flex items-center gap-3">
                        {/* Approve dialog */}
                        <Dialog open={showApprove} onOpenChange={setShowApprove}>
                            <DialogTrigger asChild>
                                <Button className="bg-green-600 hover:bg-green-700">
                                    <Check className="mr-2 h-4 w-4" />
                                    Approuver
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Approuver cette etape</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={submitApprove} className="space-y-4">
                                    <div>
                                        <Label>Commentaire (optionnel)</Label>
                                        <Input
                                            value={approveForm.data.commentaire}
                                            onChange={(e) => approveForm.setData('commentaire', e.target.value)}
                                            placeholder="Ajouter un commentaire..."
                                            className="mt-1"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={approveForm.processing}
                                        className="w-full bg-green-600 hover:bg-green-700"
                                    >
                                        Confirmer l'approbation
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>

                        {/* Reject dialog */}
                        <Dialog open={showReject} onOpenChange={setShowReject}>
                            <DialogTrigger asChild>
                                <Button variant="destructive">
                                    <X className="mr-2 h-4 w-4" />
                                    Rejeter
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Rejeter cette etape</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={submitReject} className="space-y-4">
                                    <div>
                                        <Label>Commentaire</Label>
                                        <Input
                                            value={rejectForm.data.commentaire}
                                            onChange={(e) => rejectForm.setData('commentaire', e.target.value)}
                                            placeholder="Raison du rejet..."
                                            className="mt-1"
                                        />
                                        {rejectForm.errors.commentaire && (
                                            <p className="mt-1 text-sm text-destructive">
                                                {rejectForm.errors.commentaire}
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        type="submit"
                                        variant="destructive"
                                        disabled={rejectForm.processing}
                                        className="w-full"
                                    >
                                        Confirmer le rejet
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
