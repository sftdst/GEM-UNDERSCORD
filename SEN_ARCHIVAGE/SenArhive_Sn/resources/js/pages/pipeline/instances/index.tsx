import { Head, router, usePage } from '@inertiajs/react';
import {
    GitMerge, Plus, Eye, Clock, CheckCircle2, XCircle,
    AlertTriangle, FileText, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useState, useEffect, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Pipeline, PipelineInstance, Document, PaginatedData } from '@/types/models';

interface Props {
    instances: PaginatedData<PipelineInstance>;
    pipelines: Pick<Pipeline, 'id' | 'nom'>[];
    documents: Pick<Document, 'id' | 'titre' | 'numero_document'>[];
    filtre: 'tous' | 'mes_taches';
}

const STATUT_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.FC<{ className?: string }> }> = {
    en_attente:  { label: 'En attente',  variant: 'outline',     icon: Clock },
    en_cours:    { label: 'En cours',    variant: 'default',     icon: AlertTriangle },
    complete:    { label: 'Complété',    variant: 'default',     icon: CheckCircle2 },
    rejete:      { label: 'Rejeté',      variant: 'destructive', icon: XCircle },
    suspendu:    { label: 'Suspendu',    variant: 'secondary',   icon: Clock },
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Espaces Workflow', href: '/pipelines' },
    { title: 'Instances', href: '/pipelines/instances' },
];

export default function PipelineInstancesIndex({ instances, pipelines, documents, filtre }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const [showCreate, setShowCreate] = useState(false);
    const [pipelineId, setPipelineId] = useState('');
    const [documentId, setDocumentId] = useState('');
    const [commentaire, setCommentaire] = useState('');
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (props.flash?.success) toast.success(props.flash.success);
        if (props.flash?.error) toast.error(props.flash.error);
    }, [props.flash]);

    function submit(e: FormEvent) {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        router.post('/pipelines/instances', { pipeline_id: pipelineId, document_id: documentId, commentaire }, {
            preserveScroll: true,
            onSuccess: () => {
                setShowCreate(false);
                setPipelineId('');
                setDocumentId('');
                setCommentaire('');
            },
            onError: errs => setErrors(errs),
            onFinish: () => setProcessing(false),
        });
    }

    function formatDate(d: string) {
        return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    const { data, current_page, last_page } = instances;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Instances Pipeline" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => router.visit('/pipelines')}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <h1 className="text-2xl font-bold">Instances de pipeline</h1>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 ml-10">
                            Suivez la progression des documents dans les pipelines.
                        </p>
                    </div>
                    <Dialog open={showCreate} onOpenChange={setShowCreate}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Initier un pipeline
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Initier un pipeline sur un document</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <Label>Pipeline *</Label>
                                    <Select value={pipelineId} onValueChange={setPipelineId}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Sélectionner un pipeline..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {pipelines.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.pipeline_id && <p className="mt-1 text-sm text-destructive">{errors.pipeline_id}</p>}
                                </div>
                                <div>
                                    <Label>Document *</Label>
                                    <Select value={documentId} onValueChange={setDocumentId}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Sélectionner un document..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {documents.map(d => (
                                                <SelectItem key={d.id} value={d.id}>
                                                    {d.numero_document ? `[${d.numero_document}] ` : ''}{d.titre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.document_id && <p className="mt-1 text-sm text-destructive">{errors.document_id}</p>}
                                </div>
                                <div>
                                    <Label>Commentaire initial</Label>
                                    <Textarea
                                        className="mt-1"
                                        value={commentaire}
                                        onChange={e => setCommentaire(e.target.value)}
                                        rows={3}
                                        placeholder="Contexte ou instruction pour les intervenants..."
                                    />
                                </div>
                                <Button type="submit" disabled={processing} className="w-full">
                                    {processing ? 'Initialisation...' : 'Initier le pipeline'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Filtres */}
                <div className="flex gap-2 border-b pb-2">
                    <Button
                        variant={filtre === 'tous' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => router.get('/pipelines/instances', { filtre: 'tous' }, { preserveScroll: true })}
                    >
                        Toutes les instances
                    </Button>
                    <Button
                        variant={filtre === 'mes_taches' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => router.get('/pipelines/instances', { filtre: 'mes_taches' }, { preserveScroll: true })}
                    >
                        Mes tâches
                    </Button>
                </div>

                {/* Liste */}
                {data.length > 0 ? (
                    <>
                        <div className="space-y-3">
                            {data.map(inst => {
                                const cfg = STATUT_CONFIG[inst.statut] ?? STATUT_CONFIG.en_attente;
                                const Icon = cfg.icon;
                                const etapeCourante = inst.etape_courante;
                                return (
                                    <Card key={inst.id} className="hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={() => router.visit(`/pipelines/instances/${inst.id}`)}>
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-3 min-w-0">
                                                    <GitMerge className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                                                    <div className="min-w-0">
                                                        <p className="font-medium truncate">
                                                            {inst.document?.titre ?? 'Document'}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Pipeline : <span className="font-medium">{inst.pipeline?.nom}</span>
                                                        </p>
                                                        {etapeCourante?.etape && (
                                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                                Étape courante : <span className="font-medium text-foreground">{etapeCourante.etape.nom}</span>
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2 shrink-0">
                                                    <Badge variant={cfg.variant}>
                                                        <Icon className="mr-1 h-3 w-3" />
                                                        {cfg.label}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">{formatDate(inst.created_at)}</span>
                                                </div>
                                            </div>
                                            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                                                <span>Initié par : {inst.initiateur ? `${inst.initiateur.prenom} ${inst.initiateur.nom}` : '—'}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {last_page > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={current_page === 1}
                                    onClick={() => router.get('/pipelines/instances', { filtre, page: current_page - 1 }, { preserveScroll: true })}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm text-muted-foreground">Page {current_page} / {last_page}</span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={current_page === last_page}
                                    onClick={() => router.get('/pipelines/instances', { filtre, page: current_page + 1 }, { preserveScroll: true })}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-1 items-center justify-center text-center">
                        <div>
                            <FileText className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
                            <h3 className="text-lg font-medium">
                                {filtre === 'mes_taches' ? 'Aucune tâche en attente' : 'Aucune instance'}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {filtre === 'mes_taches'
                                    ? 'Aucun document ne vous est actuellement assigné dans un pipeline actif.'
                                    : 'Initiez un pipeline sur un document pour démarrer son traitement.'}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
