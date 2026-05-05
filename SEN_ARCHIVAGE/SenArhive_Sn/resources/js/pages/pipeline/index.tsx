import { Head, router, usePage } from '@inertiajs/react';
import {
    GitMerge, Plus, Trash2, ToggleLeft, ToggleRight,
    CheckCircle2, AlertCircle, Users, Briefcase, ShieldCheck,
    Pencil, GripVertical,
} from 'lucide-react';
import { useState, useEffect, useRef, type FormEvent, type DragEvent } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Pipeline, PipelineEtape, Utilisateur, Service, Role } from '@/types/models';

interface EtapeForm {
    nom: string;
    description: string;
    type_acteur: 'utilisateur' | 'service' | 'role';
    acteur_id: string;
    annotation_obligatoire: boolean;
    fichier_requis: boolean;
    commentaire_requis: boolean;
}

interface Props {
    pipelines: Pipeline[];
    utilisateurs: Pick<Utilisateur, 'id' | 'nom' | 'prenom' | 'email'>[];
    services: Pick<Service, 'id' | 'nom' | 'code'>[];
    roles: Pick<Role, 'id' | 'nom'>[];
}

const STATUT_COLORS: Record<string, string> = {
    actif: 'default',
    inactif: 'secondary',
};

const TYPE_ACTEUR_ICON = {
    utilisateur: Users,
    service: Briefcase,
    role: ShieldCheck,
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Espaces Workflow', href: '/pipelines' },
];

function newEtape(): EtapeForm {
    return {
        nom: '',
        description: '',
        type_acteur: 'utilisateur',
        acteur_id: '',
        annotation_obligatoire: false,
        fichier_requis: false,
        commentaire_requis: false,
    };
}

function etapeFromTemplate(e: PipelineEtape): EtapeForm {
    return {
        nom: e.nom,
        description: e.description ?? '',
        type_acteur: e.type_acteur as EtapeForm['type_acteur'],
        acteur_id: e.acteur_id,
        annotation_obligatoire: e.annotation_obligatoire ?? false,
        fichier_requis: e.fichier_requis ?? false,
        commentaire_requis: e.commentaire_requis ?? false,
    };
}

// ─── Éditeur d'étapes avec drag & drop ──────────────────────────────────────

function EtapesEditor({
    etapes,
    setEtapes,
    utilisateurs,
    services,
    roles,
    errors,
}: {
    etapes: EtapeForm[];
    setEtapes: React.Dispatch<React.SetStateAction<EtapeForm[]>>;
    utilisateurs: Props['utilisateurs'];
    services: Props['services'];
    roles: Props['roles'];
    errors: Record<string, string>;
}) {
    const dragIdx = useRef<number | null>(null);
    const [dragOver, setDragOver] = useState<number | null>(null);

    function getActeurOptions(typeActeur: EtapeForm['type_acteur']) {
        if (typeActeur === 'utilisateur') return utilisateurs.map(u => ({ id: u.id, label: `${u.prenom} ${u.nom}` }));
        if (typeActeur === 'service') return services.map(s => ({ id: s.id, label: s.nom }));
        return roles.map(r => ({ id: r.id, label: r.nom }));
    }

    function updateEtape<K extends keyof EtapeForm>(i: number, field: K, value: EtapeForm[K]) {
        setEtapes(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e));
    }

    function handleDragStart(e: DragEvent, i: number) {
        dragIdx.current = i;
        e.dataTransfer.effectAllowed = 'move';
    }

    function handleDragOver(e: DragEvent, i: number) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOver(i);
    }

    function handleDrop(e: DragEvent, i: number) {
        e.preventDefault();
        const from = dragIdx.current;
        if (from === null || from === i) { setDragOver(null); return; }
        setEtapes(prev => {
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(i, 0, moved);
            return next;
        });
        dragIdx.current = null;
        setDragOver(null);
    }

    return (
        <div className="space-y-3">
            {etapes.map((etape, i) => {
                const ActeurIcon = TYPE_ACTEUR_ICON[etape.type_acteur];
                const options = getActeurOptions(etape.type_acteur);
                return (
                    <div
                        key={i}
                        draggable
                        onDragStart={e => handleDragStart(e, i)}
                        onDragOver={e => handleDragOver(e, i)}
                        onDrop={e => handleDrop(e, i)}
                        onDragEnd={() => { dragIdx.current = null; setDragOver(null); }}
                        className={`rounded-lg border p-4 space-y-3 transition-all ${dragOver === i ? 'border-primary bg-primary/5 scale-[1.01]' : 'bg-card'}`}
                    >
                        <div className="flex items-center gap-2">
                            <div className="cursor-grab active:cursor-grabbing text-muted-foreground">
                                <GripVertical className="h-4 w-4" />
                            </div>
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-bold">
                                {i + 1}
                            </span>
                            <Input
                                className="flex-1"
                                placeholder="Nom de la tâche / étape *"
                                value={etape.nom}
                                onChange={e => updateEtape(i, 'nom', e.target.value)}
                            />
                            <Button type="button" variant="ghost" size="icon"
                                onClick={() => setEtapes(prev => prev.filter((_, idx) => idx !== i))}
                                disabled={etapes.length === 1}
                                title="Supprimer cette étape"
                            >
                                <Trash2 className={`h-4 w-4 ${etapes.length === 1 ? 'text-muted-foreground' : 'text-destructive'}`} />
                            </Button>
                        </div>

                        <div>
                            <Label className="text-xs text-muted-foreground">Description de la tâche (optionnel)</Label>
                            <Textarea
                                className="mt-1 text-sm"
                                rows={2}
                                placeholder="Décrire ce que doit faire le responsable à cette étape..."
                                value={etape.description}
                                onChange={e => updateEtape(i, 'description', e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label className="text-xs text-muted-foreground">Type d'acteur</Label>
                                <Select
                                    value={etape.type_acteur}
                                    onValueChange={v => {
                                        updateEtape(i, 'type_acteur', v as EtapeForm['type_acteur']);
                                        updateEtape(i, 'acteur_id', '');
                                    }}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="utilisateur"><Users className="inline h-3 w-3 mr-1" />Utilisateur</SelectItem>
                                        <SelectItem value="service"><Briefcase className="inline h-3 w-3 mr-1" />Service</SelectItem>
                                        <SelectItem value="role"><ShieldCheck className="inline h-3 w-3 mr-1" />Rôle</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">
                                    <ActeurIcon className="inline h-3 w-3 mr-1" />
                                    {etape.type_acteur === 'utilisateur' ? 'Utilisateur' : etape.type_acteur === 'service' ? 'Service' : 'Rôle'}
                                </Label>
                                <Select value={etape.acteur_id} onValueChange={v => updateEtape(i, 'acteur_id', v)}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Sélectionner..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {options.map(o => (
                                            <SelectItem key={String(o.id)} value={String(o.id)}>{o.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 pt-1">
                            {([
                                ['annotation_obligatoire', 'Annotation requise'],
                                ['fichier_requis', 'Fichier requis'],
                                ['commentaire_requis', 'Commentaire requis'],
                            ] as [keyof EtapeForm, string][]).map(([field, label]) => (
                                <div key={field} className="flex items-center gap-2">
                                    <Checkbox
                                        id={`${field}-${i}`}
                                        checked={!!etape[field]}
                                        onCheckedChange={v => updateEtape(i, field, !!v as EtapeForm[typeof field])}
                                    />
                                    <Label htmlFor={`${field}-${i}`} className="text-xs cursor-pointer">{label}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
            {errors.etapes && <p className="text-sm text-destructive">{errors.etapes}</p>}
        </div>
    );
}

// ─── Champs méta ─────────────────────────────────────────────────────────────

function PipelineMetaFields({ nom, setNom, description, setDescription, typeDocument, setTypeDocument, errors }: {
    nom: string; setNom: (v: string) => void;
    description: string; setDescription: (v: string) => void;
    typeDocument: string; setTypeDocument: (v: string) => void;
    errors: Record<string, string>;
}) {
    return (
        <>
            <div>
                <Label>Nom du pipeline *</Label>
                <Input className="mt-1" value={nom} onChange={e => setNom(e.target.value)} placeholder="Ex: Validation juridique" />
                {errors.nom && <p className="mt-1 text-sm text-destructive">{errors.nom}</p>}
            </div>
            <div>
                <Label>Description</Label>
                <Textarea className="mt-1" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
            </div>
            <div>
                <Label>Type de document concerné</Label>
                <Input className="mt-1" value={typeDocument} onChange={e => setTypeDocument(e.target.value)} placeholder="Ex: contrat, rapport, facture..." />
            </div>
        </>
    );
}

// ─── Page principale ─────────────────────────────────────────────────────────

export default function PipelineIndex({ pipelines, utilisateurs, services, roles }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();

    // Création
    const [showCreate, setShowCreate] = useState(false);
    const [nom, setNom] = useState('');
    const [description, setDescription] = useState('');
    const [typeDocument, setTypeDocument] = useState('');
    const [etapes, setEtapes] = useState<EtapeForm[]>([newEtape()]);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Édition
    const [editPipeline, setEditPipeline] = useState<Pipeline | null>(null);
    const [editNom, setEditNom] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editTypeDocument, setEditTypeDocument] = useState('');
    const [editEtapes, setEditEtapes] = useState<EtapeForm[]>([newEtape()]);
    const [editProcessing, setEditProcessing] = useState(false);
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (props.flash?.success) toast.success(props.flash.success);
        if (props.flash?.error) toast.error(props.flash.error);
    }, [props.flash]);

    function openEdit(p: Pipeline) {
        setEditPipeline(p);
        setEditNom(p.nom);
        setEditDescription(p.description ?? '');
        setEditTypeDocument(p.type_document ?? '');
        setEditEtapes(p.etapes && p.etapes.length > 0 ? p.etapes.map(etapeFromTemplate) : [newEtape()]);
        setEditErrors({});
    }

    function submitCreate(e: FormEvent) {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        router.post('/pipelines', { nom, description, type_document: typeDocument, etapes }, {
            preserveScroll: true,
            onSuccess: () => {
                setShowCreate(false);
                setNom(''); setDescription(''); setTypeDocument(''); setEtapes([newEtape()]);
            },
            onError: errs => setErrors(errs),
            onFinish: () => setProcessing(false),
        });
    }

    function submitEdit(e: FormEvent) {
        e.preventDefault();
        if (!editPipeline) return;
        setEditProcessing(true);
        setEditErrors({});
        router.put(`/pipelines/${editPipeline.id}`, {
            nom: editNom,
            description: editDescription,
            type_document: editTypeDocument,
            etapes: editEtapes,
        }, {
            preserveScroll: true,
            onSuccess: () => setEditPipeline(null),
            onError: errs => setEditErrors(errs),
            onFinish: () => setEditProcessing(false),
        });
    }

    function toggleStatut(p: Pipeline) {
        router.put(`/pipelines/${p.id}`, { statut: p.statut === 'actif' ? 'inactif' : 'actif' }, { preserveScroll: true });
    }

    function deletePipeline(p: Pipeline) {
        if (confirm(`Supprimer le pipeline "${p.nom}" ?`)) {
            router.delete(`/pipelines/${p.id}`, { preserveScroll: true });
        }
    }

    function formatDate(d: string) {
        return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Espaces Workflow" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Espaces Workflow</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Configurez des workflows multi-étapes pour la circulation des documents.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => router.visit('/pipelines/instances')}>
                            Voir les instances
                        </Button>
                        <Dialog open={showCreate} onOpenChange={setShowCreate}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nouveau pipeline
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Créer un pipeline</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={submitCreate} className="space-y-5">
                                    <PipelineMetaFields nom={nom} setNom={setNom} description={description} setDescription={setDescription} typeDocument={typeDocument} setTypeDocument={setTypeDocument} errors={errors} />

                                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label className="text-base font-semibold">Tâches / Étapes *</Label>
                                                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                                    <GripVertical className="h-3 w-3" />
                                                    Glissez pour réordonner — chaque étape est assignée à un acteur
                                                </p>
                                            </div>
                                            <Button type="button" variant="outline" size="sm" onClick={() => setEtapes(prev => [...prev, newEtape()])}>
                                                <Plus className="mr-1 h-3 w-3" /> Ajouter une tâche
                                            </Button>
                                        </div>
                                        <EtapesEditor etapes={etapes} setEtapes={setEtapes} utilisateurs={utilisateurs} services={services} roles={roles} errors={errors} />
                                    </div>

                                    <Button type="submit" disabled={processing} className="w-full">
                                        {processing ? 'Création...' : 'Créer le pipeline'}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Liste des pipelines */}
                {pipelines.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {pipelines.map(p => (
                            <Card key={p.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <GitMerge className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                                            <div className="min-w-0">
                                                <CardTitle className="text-base leading-tight">{p.nom}</CardTitle>
                                                {p.type_document && (
                                                    <p className="text-xs text-muted-foreground mt-0.5">Type : {p.type_document}</p>
                                                )}
                                            </div>
                                        </div>
                                        <Badge variant={STATUT_COLORS[p.statut] as 'default' | 'secondary'} className="shrink-0">
                                            {p.statut === 'actif' ? (
                                                <><CheckCircle2 className="mr-1 h-3 w-3" />Actif</>
                                            ) : (
                                                <><AlertCircle className="mr-1 h-3 w-3" />Inactif</>
                                            )}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {p.description && (
                                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{p.description}</p>
                                    )}

                                    {/* Aperçu des étapes */}
                                    {p.etapes && p.etapes.length > 0 && (
                                        <div className="mb-3 space-y-1 rounded-lg bg-muted/40 p-2">
                                            {p.etapes.slice(0, 3).map((e, idx) => {
                                                const EtapeIcon = TYPE_ACTEUR_ICON[e.type_acteur as keyof typeof TYPE_ACTEUR_ICON] ?? Users;
                                                return (
                                                    <div key={e.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">{idx + 1}</span>
                                                        <EtapeIcon className="h-3 w-3 shrink-0" />
                                                        <span className="truncate font-medium text-foreground">{e.nom}</span>
                                                    </div>
                                                );
                                            })}
                                            {p.etapes.length > 3 && (
                                                <p className="text-xs text-muted-foreground pl-5">+{p.etapes.length - 3} autres étapes</p>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                                        <span>{p.etapes_count ?? 0} étape(s)</span>
                                        <span>&middot;</span>
                                        <span>{p.instances_count ?? 0} instance(s)</span>
                                        <span>&middot;</span>
                                        <span>{formatDate(p.created_at)}</span>
                                    </div>

                                    <div className="flex gap-1 flex-wrap">
                                        <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                                            <Pencil className="mr-1 h-3.5 w-3.5" />Modifier
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => toggleStatut(p)}>
                                            {p.statut === 'actif'
                                                ? <><ToggleRight className="mr-1 h-3.5 w-3.5" />Désactiver</>
                                                : <><ToggleLeft className="mr-1 h-3.5 w-3.5" />Activer</>
                                            }
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deletePipeline(p)}>
                                            <Trash2 className="mr-1 h-3.5 w-3.5" />Supprimer
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-1 items-center justify-center text-center">
                        <div>
                            <GitMerge className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
                            <h3 className="text-lg font-medium">Aucun pipeline configuré</h3>
                            <p className="text-muted-foreground text-sm mt-1">
                                Créez votre premier pipeline pour orchestrer la circulation des documents entre services.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Dialog édition */}
            <Dialog open={!!editPipeline} onOpenChange={v => { if (!v) setEditPipeline(null); }}>
                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Modifier le pipeline — {editPipeline?.nom}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitEdit} className="space-y-5">
                        <PipelineMetaFields nom={editNom} setNom={setEditNom} description={editDescription} setDescription={setEditDescription} typeDocument={editTypeDocument} setTypeDocument={setEditTypeDocument} errors={editErrors} />

                        {editPipeline && (editPipeline.instances_count ?? 0) > 0 && (
                            <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
                                <strong>Attention :</strong> Ce pipeline a {editPipeline.instances_count} instance(s).
                                Les étapes ne peuvent être modifiées que si aucune instance n'est active.
                            </div>
                        )}

                        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-base font-semibold">Tâches / Étapes *</Label>
                                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                        <GripVertical className="h-3 w-3" />
                                        Glissez pour réordonner — chaque étape est assignée à un acteur
                                    </p>
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={() => setEditEtapes(prev => [...prev, newEtape()])}>
                                    <Plus className="mr-1 h-3 w-3" /> Ajouter une tâche
                                </Button>
                            </div>
                            <EtapesEditor etapes={editEtapes} setEtapes={setEditEtapes} utilisateurs={utilisateurs} services={services} roles={roles} errors={editErrors} />
                        </div>

                        <div className="flex gap-2">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setEditPipeline(null)}>
                                Annuler
                            </Button>
                            <Button type="submit" disabled={editProcessing} className="flex-1">
                                {editProcessing ? 'Enregistrement...' : 'Enregistrer'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
