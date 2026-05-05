import { Head, router, usePage } from '@inertiajs/react';
import {
    CheckCircle2, XCircle, Clock, AlertTriangle, ChevronLeft,
    MessageSquare, Paperclip, History, User, Briefcase, ShieldCheck,
    RotateCcw, Send, FileText, RefreshCw, Star, UserCog, PenTool,
} from 'lucide-react';
import { useState, useEffect, useRef, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { PipelineInstance, PipelineEtapeInstance, PipelineHistorique, Utilisateur, Service, Role } from '@/types/models';

interface UtilisateurCourant {
    id: string;
    service_id: string | null;
    role_id: string | null;
}

interface Props {
    instance: PipelineInstance;
    peutTraiter: boolean;
    utilisateur_courant: UtilisateurCourant;
    utilisateurs: Pick<Utilisateur, 'id' | 'nom' | 'prenom'>[];
    services: Pick<Service, 'id' | 'nom'>[];
    roles: Pick<Role, 'id' | 'nom'>[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUT_ETAPE: Record<string, { label: string; color: string; icon: React.FC<{ className?: string }> }> = {
    en_attente:          { label: 'En attente',          color: 'text-muted-foreground', icon: Clock },
    en_cours:            { label: 'En cours',            color: 'text-blue-600',         icon: AlertTriangle },
    valide:              { label: 'Validé',              color: 'text-green-600',        icon: CheckCircle2 },
    rejete:              { label: 'Rejeté',              color: 'text-red-600',          icon: XCircle },
    retour_modification: { label: 'Retour modification', color: 'text-orange-500',       icon: RotateCcw },
    complete:            { label: 'Complété',            color: 'text-green-700',        icon: CheckCircle2 },
};

const STATUT_INSTANCE: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    en_attente: { label: 'En attente', variant: 'outline' },
    en_cours:   { label: 'En cours',   variant: 'default' },
    complete:   { label: 'Complété',   variant: 'default' },
    rejete:     { label: 'Rejeté',     variant: 'destructive' },
    suspendu:   { label: 'Suspendu',   variant: 'secondary' },
};

const ACTION_LABELS: Record<string, string> = {
    initiation:          'Initiation',
    validation:          'Validation',
    rejet:               'Rejet',
    rejet_final:         'Rejet définitif',
    annotation:          'Annotation',
    transition:          'Transition d\'étape',
    completion:          'Complétion',
    demande_correction:  'Demande de correction',
};

const TYPE_ACTEUR_ICON = {
    utilisateur: User,
    service: Briefcase,
    role: ShieldCheck,
};

function formatDate(d: string) {
    return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Composant Étape ─────────────────────────────────────────────────────────

function EtapeCard({ etapeInst, isCourante, peutTraiter, instanceId, estMaTache, utilisateurs, services, roles }: {
    etapeInst: PipelineEtapeInstance;
    isCourante: boolean;
    peutTraiter: boolean;
    instanceId: string;
    estMaTache: boolean;
    utilisateurs: Pick<{ id: string; nom: string; prenom: string }, 'id' | 'nom' | 'prenom'>[];
    services: Pick<{ id: string; nom: string }, 'id' | 'nom'>[];
    roles: Pick<{ id: string; nom: string }, 'id' | 'nom'>[];
}) {
    const etape = etapeInst.etape;
    const cfg = STATUT_ETAPE[etapeInst.statut] ?? STATUT_ETAPE.en_attente;
    const Icon = cfg.icon;
    // Afficher l'icône de l'acteur effectif (override en priorité)
    const effectifType = etapeInst.acteur_effectif_type ?? etape?.type_acteur ?? 'utilisateur';
    const ActeurIcon = TYPE_ACTEUR_ICON[effectifType as keyof typeof TYPE_ACTEUR_ICON] ?? User;
    const isTraitable = ['en_attente', 'en_cours', 'retour_modification'].includes(etapeInst.statut);

    return (
        <div className={`relative rounded-lg border p-4 transition-all ${isCourante ? 'border-primary shadow-sm bg-primary/5' : estMaTache ? 'border-amber-300 bg-amber-50/50' : 'bg-card'}`}>
            {isCourante && (
                <div className="absolute -left-1.5 top-4 h-3 w-3 rounded-full bg-primary animate-pulse" />
            )}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${isCourante ? 'border-primary' : 'border-border'}`}>
                        <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm">{etapeInst.ordre}. {etape?.nom ?? 'Étape'}</p>
                            {estMaTache && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                    <Star className="h-2.5 w-2.5" />Ma tâche
                                </span>
                            )}
                        </div>
                        {etape?.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{etape.description}</p>
                        )}
                        {etape?.signature_requise && (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 mt-1">
                                <PenTool className="mr-1 h-3 w-3" /> Signature requise
                            </span>
                        )}
                        {/* Responsable assigné — nom résolu */}
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                            <ActeurIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground capitalize">{effectifType} :</span>
                            <span className="font-semibold text-foreground">
                                {etapeInst.acteur_effectif_nom || etape?.acteur_nom || '—'}
                            </span>
                            {etapeInst.acteur_type_override && (
                                <span className="rounded bg-blue-100 px-1 py-0.5 text-xs text-blue-700">réassigné</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant="outline" className={`text-xs ${cfg.color}`}>
                        {cfg.label}
                    </Badge>
                    {etapeInst.traite_le && (
                        <p className="text-xs text-muted-foreground">{formatDate(etapeInst.traite_le)}</p>
                    )}
                    {/* Bouton réassigner (visible si l'étape est traitable) */}
                    {isTraitable && (
                        <ReassignerDialog etapeInst={etapeInst} utilisateurs={utilisateurs} services={services} roles={roles} />
                    )}
                </div>
            </div>

            {/* Commentaire / motif rejet */}
            {etapeInst.commentaire && (
                <div className="mt-3 rounded bg-muted px-3 py-2 text-sm">
                    <p className="text-xs text-muted-foreground mb-1 font-medium">Commentaire</p>
                    {etapeInst.commentaire}
                </div>
            )}
            {etapeInst.motif_rejet && (
                <div className="mt-3 rounded bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm">
                    <p className="text-xs text-destructive mb-1 font-medium">Motif de rejet</p>
                    {etapeInst.motif_rejet}
                </div>
            )}

            {/* Annotations */}
            {etapeInst.annotations && etapeInst.annotations.length > 0 && (
                <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Annotations ({etapeInst.annotations.length})</p>
                    {etapeInst.annotations.map(ann => (
                        <div key={ann.id} className="rounded bg-muted/50 px-3 py-2 text-xs">
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">{ann.utilisateur ? `${ann.utilisateur.prenom} ${ann.utilisateur.nom}` : '—'}</span>
                                <span className="text-muted-foreground">{formatDate(ann.created_at)}</span>
                            </div>
                            <p>{ann.texte}</p>
                            {ann.nom_fichier_original && (
                                <p className="mt-1 flex items-center gap-1 text-primary">
                                    <Paperclip className="h-3 w-3" />{ann.nom_fichier_original}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Actions pour l'étape courante */}
            {isCourante && peutTraiter && (
                <ActionsEtape etapeInst={etapeInst} instanceId={instanceId} />
            )}
        </div>
    );
}

// ─── Réassignation d'une étape ────────────────────────────────────────────────

function ReassignerDialog({ etapeInst, utilisateurs, services, roles }: {
    etapeInst: PipelineEtapeInstance;
    utilisateurs: Pick<{ id: string; nom: string; prenom: string }, 'id' | 'nom' | 'prenom'>[];
    services: Pick<{ id: string; nom: string }, 'id' | 'nom'>[];
    roles: Pick<{ id: string; nom: string }, 'id' | 'nom'>[];
}) {
    const [open, setOpen] = useState(false);
    const [typeActeur, setTypeActeur] = useState<'utilisateur' | 'service' | 'role'>(
        etapeInst.acteur_effectif_type ?? 'utilisateur'
    );
    const [acteurId, setActeurId] = useState(etapeInst.acteur_effectif_id ?? '');
    const [processing, setProcessing] = useState(false);

    function getOptions() {
        if (typeActeur === 'utilisateur') return utilisateurs.map(u => ({ id: u.id, label: `${u.prenom} ${u.nom}` }));
        if (typeActeur === 'service') return services.map(s => ({ id: s.id, label: s.nom }));
        return roles.map(r => ({ id: r.id, label: r.nom }));
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!acteurId) return;
        setProcessing(true);
        router.post(`/pipelines/etapes/${etapeInst.id}/reassigner`, { type_acteur: typeActeur, acteur_id: acteurId }, {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
            onFinish: () => setProcessing(false),
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground">
                    <UserCog className="h-3 w-3 mr-1" />Réassigner
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserCog className="h-5 w-5" />Réassigner l'étape
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Choisissez le nouveau responsable pour l'étape <strong>{etapeInst.etape?.nom}</strong>.
                    </p>
                    <div>
                        <Label>Type de responsable</Label>
                        <Select value={typeActeur} onValueChange={v => { setTypeActeur(v as typeof typeActeur); setActeurId(''); }}>
                            <SelectTrigger className="mt-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="utilisateur"><User className="inline h-3 w-3 mr-1" />Utilisateur</SelectItem>
                                <SelectItem value="service"><Briefcase className="inline h-3 w-3 mr-1" />Service</SelectItem>
                                <SelectItem value="role"><ShieldCheck className="inline h-3 w-3 mr-1" />Rôle</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Responsable *</Label>
                        <Select value={acteurId} onValueChange={setActeurId}>
                            <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Sélectionner..." />
                            </SelectTrigger>
                            <SelectContent>
                                {getOptions().map(o => (
                                    <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Annuler</Button>
                        <Button type="submit" disabled={processing || !acteurId} className="flex-1">
                            {processing ? 'Réassignation...' : 'Confirmer'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ─── Panneau d'actions ────────────────────────────────────────────────────────

function ActionsEtape({ etapeInst, instanceId }: { etapeInst: PipelineEtapeInstance; instanceId: string }) {
    const [showValider, setShowValider] = useState(false);
    const [showRejeter, setShowRejeter] = useState(false);
    const [showAnnoter, setShowAnnoter] = useState(false);
    const [showCorrection, setShowCorrection] = useState(false);
    const [commentaire, setCommentaire] = useState('');
    const [motif, setMotif] = useState('');
    const [texteAnnotation, setTexteAnnotation] = useState('');
    const [fichier, setFichier] = useState<File | null>(null);
    const [fichierValidation, setFichierValidation] = useState<File | null>(null);
    const [commentaireCorrection, setCommentaireCorrection] = useState('');
    const [processing, setProcessing] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    function soumettre(action: 'valider' | 'rejeter' | 'annoter' | 'correction') {
        setProcessing(true);
        setActionError(null);
        const url = action === 'annoter'
            ? `/pipelines/etapes/${etapeInst.id}/annoter`
            : action === 'valider'
            ? `/pipelines/instances/${instanceId}/valider`
            : action === 'rejeter'
            ? `/pipelines/instances/${instanceId}/rejeter`
            : `/pipelines/instances/${instanceId}/correction`;

        const data: Record<string, string | File | null> = {};
        if (action === 'valider') {
            data.commentaire = commentaire;
            if (fichierValidation) data.fichier = fichierValidation;
        }
        if (action === 'rejeter') data.motif = motif;
        if (action === 'annoter') { data.texte = texteAnnotation; if (fichier) data.fichier = fichier; }
        if (action === 'correction') data.commentaire = commentaireCorrection;

        router.post(url, data as Record<string, string>, {
            preserveScroll: true,
            forceFormData: action === 'annoter' || action === 'valider',
            onSuccess: () => {
                setShowValider(false);
                setShowRejeter(false);
                setShowAnnoter(false);
                setShowCorrection(false);
                setCommentaire('');
                setMotif('');
                setTexteAnnotation('');
                setFichier(null);
                setFichierValidation(null);
                setCommentaireCorrection('');
                setActionError(null);
            },
            onError: (errors) => {
                const msg = Object.values(errors)[0];
                setActionError(typeof msg === 'string' ? msg : 'Une erreur est survenue.');
            },
            onFinish: () => setProcessing(false),
        });
    }

    function ErrorBanner() {
        if (!actionError) return null;
        return (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {actionError}
            </div>
        );
    }

    return (
        <div className="mt-4 pt-3 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">Actions disponibles</p>
            <div className="flex flex-wrap gap-2">
                {/* Valider */}
                <Dialog open={showValider} onOpenChange={v => { setShowValider(v); if (!v) setActionError(null); }}>
                    <DialogTrigger asChild>
                        <Button size="sm" variant="default">
                            <CheckCircle2 className="mr-1 h-4 w-4" />Valider
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Valider cette étape</DialogTitle></DialogHeader>
                        <div className="space-y-4">
                            <ErrorBanner />
                            <div>
                                <Label>Commentaire {etapeInst.etape?.commentaire_requis ? '*' : '(optionnel)'}</Label>
                                <Textarea className="mt-1" value={commentaire} onChange={e => setCommentaire(e.target.value)} rows={3} placeholder="Votre commentaire de validation..." />
                            </div>
                            {etapeInst.etape?.fichier_requis && (
                                <div>
                                    <Label className="flex items-center gap-1">
                                        <Paperclip className="h-3.5 w-3.5" />
                                        Fichier joint *
                                    </Label>
                                    <p className="text-xs text-muted-foreground mb-1">Un fichier est obligatoire pour valider cette étape.</p>
                                    <Input
                                        type="file"
                                        className="mt-1"
                                        onChange={e => setFichierValidation(e.target.files?.[0] ?? null)}
                                    />
                                </div>
                            )}
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowValider(false); setActionError(null); setFichierValidation(null); }}>Annuler</Button>
                                <Button
                                    onClick={() => soumettre('valider')}
                                    disabled={processing || (etapeInst.etape?.fichier_requis === true && !fichierValidation)}
                                    className="flex-1"
                                >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    {processing ? 'Validation...' : 'Confirmer'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Rejeter */}
                <Dialog open={showRejeter} onOpenChange={v => { setShowRejeter(v); if (!v) setActionError(null); }}>
                    <DialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                            <XCircle className="mr-1 h-4 w-4" />Rejeter
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Rejeter cette étape</DialogTitle></DialogHeader>
                        <div className="space-y-4">
                            <ErrorBanner />
                            <div>
                                <Label>Motif de rejet *</Label>
                                <Textarea className="mt-1" value={motif} onChange={e => setMotif(e.target.value)} rows={4} placeholder="Expliquez la raison du rejet (minimum 10 caractères)..." />
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {motif.length}/10 caractères minimum — le document sera retourné à l'étape précédente.
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowRejeter(false); setActionError(null); }}>Annuler</Button>
                                <Button onClick={() => soumettre('rejeter')} disabled={processing || motif.length < 10} variant="destructive" className="flex-1">
                                    <XCircle className="mr-2 h-4 w-4" />
                                    {processing ? 'Rejet...' : 'Confirmer'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Annoter */}
                <Dialog open={showAnnoter} onOpenChange={v => { setShowAnnoter(v); if (!v) setActionError(null); }}>
                    <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                            <MessageSquare className="mr-1 h-4 w-4" />Annoter
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Ajouter une annotation</DialogTitle></DialogHeader>
                        <div className="space-y-4">
                            <ErrorBanner />
                            <div>
                                <Label>Texte de l'annotation *</Label>
                                <Textarea className="mt-1" value={texteAnnotation} onChange={e => setTexteAnnotation(e.target.value)} rows={4} placeholder="Votre annotation, imputation, remarque..." />
                            </div>
                            <div>
                                <Label>Fichier joint (optionnel)</Label>
                                <Input ref={fileRef} type="file" className="mt-1" onChange={e => setFichier(e.target.files?.[0] ?? null)} />
                            </div>
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowAnnoter(false); setActionError(null); }}>Annuler</Button>
                                <Button onClick={() => soumettre('annoter')} disabled={processing || !texteAnnotation} className="flex-1">
                                    <Send className="mr-2 h-4 w-4" />
                                    {processing ? 'Envoi...' : 'Ajouter'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Demander correction */}
                <Dialog open={showCorrection} onOpenChange={v => { setShowCorrection(v); if (!v) setActionError(null); }}>
                    <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                            <RefreshCw className="mr-1 h-4 w-4" />Demander correction
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Demander une correction</DialogTitle></DialogHeader>
                        <div className="space-y-4">
                            <ErrorBanner />
                            <div>
                                <Label>Détail de la correction demandée *</Label>
                                <Textarea className="mt-1" value={commentaireCorrection} onChange={e => setCommentaireCorrection(e.target.value)} rows={4} placeholder="Décrivez ce qui doit être corrigé..." />
                                <p className="mt-1 text-xs text-muted-foreground">{commentaireCorrection.length}/5 caractères minimum</p>
                            </div>
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowCorrection(false); setActionError(null); }}>Annuler</Button>
                                <Button onClick={() => soumettre('correction')} disabled={processing || commentaireCorrection.length < 5} variant="outline" className="flex-1">
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    {processing ? 'Envoi...' : 'Envoyer'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}

// ─── Page principale ──────────────────────────────────────────────────────────

function isAssigneeToMe(etapeInst: PipelineEtapeInstance, u: UtilisateurCourant): boolean {
    // Utilise les champs effectifs (override en priorité)
    const type = etapeInst.acteur_effectif_type ?? etapeInst.etape?.type_acteur;
    const id   = etapeInst.acteur_effectif_id ?? etapeInst.etape?.acteur_id;
    if (!type || !id) return false;
    if (type === 'utilisateur') return id === u.id;
    if (type === 'service') return id === u.service_id;
    if (type === 'role') return id === u.role_id;
    return false;
}

export default function PipelineInstanceShow({ instance, peutTraiter, utilisateur_courant, utilisateurs, services, roles }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();

    useEffect(() => {
        if (props.flash?.success) toast.success(props.flash.success);
        if (props.flash?.error) toast.error(props.flash.error);
    }, [props.flash]);

    const cfgInstance = STATUT_INSTANCE[instance.statut] ?? STATUT_INSTANCE.en_attente;

    const mesTaches = (instance.etape_instances ?? []).filter(e => isAssigneeToMe(e, utilisateur_courant));

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Espaces Workflow', href: '/pipelines' },
        { title: 'Instances', href: '/pipelines/instances' },
        { title: instance.document?.titre ?? 'Instance', href: `/pipelines/instances/${instance.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Pipeline — ${instance.document?.titre ?? 'Instance'}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <Button variant="ghost" size="icon" onClick={() => router.visit('/pipelines/instances')}>
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold leading-tight">
                                {instance.document?.titre ?? 'Document'}
                            </h1>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Pipeline : <span className="font-medium text-foreground">{instance.pipeline?.nom}</span>
                            </p>
                            {instance.commentaire_init && (
                                <p className="text-sm text-muted-foreground mt-1 italic">"{instance.commentaire_init}"</p>
                            )}
                        </div>
                    </div>
                    <div className="shrink-0">
                        <Badge variant={cfgInstance.variant} className="text-sm px-3 py-1">
                            {cfgInstance.label}
                        </Badge>
                        {instance.initiateur && (
                            <p className="text-xs text-muted-foreground mt-1 text-right">
                                Initié par {instance.initiateur.prenom} {instance.initiateur.nom}
                            </p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Colonne gauche : étapes */}
                    <div className="lg:col-span-2 space-y-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Progression du pipeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {/* Barre de progression */}
                                {instance.etape_instances && instance.etape_instances.length > 0 && (
                                    <>
                                        <div className="mb-4">
                                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                                <span>Avancement</span>
                                                <span>
                                                    {instance.etape_instances.filter(e => ['valide', 'complete'].includes(e.statut)).length}
                                                    /{instance.etape_instances.length} étapes
                                                </span>
                                            </div>
                                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-primary transition-all"
                                                    style={{
                                                        width: `${(instance.etape_instances.filter(e => ['valide', 'complete'].includes(e.statut)).length / instance.etape_instances.length) * 100}%`
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Timeline des étapes */}
                                        <div className="relative space-y-4 pl-4">
                                            {/* Ligne verticale */}
                                            <div className="absolute left-3.5 top-3 bottom-3 w-0.5 bg-border" />
                                            {instance.etape_instances.map(etapeInst => (
                                                <EtapeCard
                                                    key={etapeInst.id}
                                                    etapeInst={etapeInst}
                                                    isCourante={etapeInst.id === instance.etape_courante_id}
                                                    peutTraiter={peutTraiter}
                                                    instanceId={instance.id}
                                                    estMaTache={isAssigneeToMe(etapeInst, utilisateur_courant)}
                                                    utilisateurs={utilisateurs}
                                                    services={services}
                                                    roles={roles}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Colonne droite : historique + infos */}
                    <div className="space-y-4">
                        {/* Info document */}
                        {instance.document && (
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">Document</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm space-y-1">
                                    <p className="font-medium">{instance.document.titre}</p>
                                    {instance.document.numero_document && (
                                        <p className="text-muted-foreground">N° {instance.document.numero_document}</p>
                                    )}
                                    <p className="text-muted-foreground">{instance.document.extension?.toUpperCase()}</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-2 w-full"
                                        onClick={() => router.visit(`/documents/${instance.document_id}`)}
                                    >
                                        Voir le document
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {/* Mes tâches dans ce pipeline */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Star className="h-4 w-4 text-amber-500" />
                                    Mes tâches
                                    <Badge variant={mesTaches.length > 0 ? 'default' : 'secondary'} className="ml-auto text-xs">
                                        {mesTaches.length}
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {mesTaches.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">Aucune étape ne vous est assignée dans ce pipeline.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {mesTaches.map(t => {
                                            const cfg = STATUT_ETAPE[t.statut] ?? STATUT_ETAPE.en_attente;
                                            const Icon = cfg.icon;
                                            const isCourante = t.id === instance.etape_courante_id;
                                            return (
                                                <div key={t.id} className={`rounded-lg border px-3 py-2 text-xs ${isCourante ? 'border-primary bg-primary/5' : 'bg-muted/40'}`}>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="font-medium">{t.ordre}. {t.etape?.nom ?? 'Étape'}</span>
                                                        <span className={`flex items-center gap-1 ${cfg.color}`}>
                                                            <Icon className="h-3 w-3" />{cfg.label}
                                                        </span>
                                                    </div>
                                                    {isCourante && peutTraiter && (
                                                        <p className="mt-1 text-amber-600 font-medium">→ En attente de votre action</p>
                                                    )}
                                                    {t.traite_le && (
                                                        <p className="mt-0.5 text-muted-foreground">Traité le {formatDate(t.traite_le)}</p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Historique */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <History className="h-4 w-4" />
                                    Historique complet
                                    <Badge variant="secondary" className="ml-auto text-xs">
                                        {instance.historique?.length ?? 0}
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {instance.historique && instance.historique.length > 0 ? (
                                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                                        {[...instance.historique].reverse().map((h: PipelineHistorique) => (
                                            <div key={h.id} className="text-xs border-l-2 border-border pl-3 py-0.5">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <span className="font-semibold">{ACTION_LABELS[h.action] ?? h.action}</span>
                                                    <span className="text-muted-foreground">{formatDate(h.created_at)}</span>
                                                </div>
                                                {h.utilisateur && (
                                                    <p className="text-muted-foreground">
                                                        {h.utilisateur.prenom} {h.utilisateur.nom}
                                                    </p>
                                                )}
                                                {(h.ancien_statut || h.nouveau_statut) && (
                                                    <p className="text-muted-foreground">
                                                        {h.ancien_statut && <span>{h.ancien_statut} → </span>}
                                                        <span className="font-medium text-foreground">{h.nouveau_statut}</span>
                                                    </p>
                                                )}
                                                {h.commentaire && (
                                                    <p className="mt-0.5 italic text-muted-foreground line-clamp-2">"{h.commentaire}"</p>
                                                )}
                                                {h.etape_instance?.etape && (
                                                    <p className="mt-0.5 text-muted-foreground">Étape : {h.etape_instance.etape.nom}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground">Aucun historique.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
