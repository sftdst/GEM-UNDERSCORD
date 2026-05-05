import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Download, MessageSquare, Clock, Share2, Trash2, ScanText, Eye, Pencil, Camera, Mail, Send, Bot, AlertTriangle, Loader2, User, Sparkles, RotateCcw, GitMerge, Plus, ExternalLink, PenTool } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import OfficePreview from '@/components/document-preview/office-preview';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Document, Categorie, Tag, Dossier, Pipeline, PipelineInstance } from '@/types/models';

interface Props {
    document: Document;
    categories: Categorie[];
    tags: Tag[];
    dossiers: Dossier[];
    pipelines: Pick<Pipeline, 'id' | 'nom' | 'description' | 'type_document'>[];
    pipeline_instances: PipelineInstance[];
}

function formatDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const PREVIEWABLE_IMAGES = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
const PREVIEWABLE_TEXT = ['txt', 'csv', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'php', 'py'];
const EDITABLE_DOCUMENTS = ['docx', 'xlsx', 'xls', 'doc', 'txt'];

function canPreview(ext: string): 'pdf' | 'image' | 'text' | 'office' | 'ocr' | null {
    const e = ext.toLowerCase();
    if (e === 'pdf') return 'pdf';
    if (PREVIEWABLE_IMAGES.includes(e)) return 'image';
    if (PREVIEWABLE_TEXT.includes(e)) return 'text';
    if (EDITABLE_DOCUMENTS.includes(e)) return 'office';
    return null;
}

function computeFolderPath(dossiers: Dossier[], targetId: string): string[] {
    const path: string[] = [];
    let current = dossiers.find((d) => d.id === targetId);
    while (current) {
        path.unshift(current.id);
        const parentId = current.parent_id;
        current = parentId ? dossiers.find((d) => d.id === parentId) : undefined;
    }
    return path;
}

const STATUT_PIPELINE_COLORS: Record<string, string> = {
    en_attente: 'bg-yellow-100 text-yellow-800',
    en_cours: 'bg-blue-100 text-blue-800',
    complete: 'bg-green-100 text-green-800',
    rejete: 'bg-red-100 text-red-800',
    suspendu: 'bg-gray-100 text-gray-700',
};

const STATUT_PIPELINE_LABELS: Record<string, string> = {
    en_attente: 'En attente',
    en_cours: 'En cours',
    complete: 'Terminé',
    rejete: 'Rejeté',
    suspendu: 'Suspendu',
};

export default function DocumentShow({ document: doc, categories, tags: allTags, dossiers, pipelines, pipeline_instances }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Documents', href: '/documents' },
        { title: doc.titre, href: `/documents/${doc.id}` },
    ];

    const { props } = usePage<{ flash?: { success?: string; error?: string }; auth: { user: { id: string } } }>();
    const [isOcrRunning, setIsOcrRunning] = useState(false);

    useEffect(() => {
        if (props.flash?.success) toast.success(props.flash.success);
        if (props.flash?.error) toast.error(props.flash.error);
    }, [props.flash]);

    const commentForm = useForm({ contenu: '', document_id: doc.id, parent_id: '' });
    const versionForm = useForm<{ fichier: File | null; commentaire: string }>({ fichier: null, commentaire: '' });
    const [showShare, setShowShare] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [showScan, setShowScan] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showEmail, setShowEmail] = useState(false);
    const [showSign, setShowSign] = useState(false);
    const [signatureData, setSignatureData] = useState('');
    const [referenceExterne, setReferenceExterne] = useState('');
    const [signProcessing, setSignProcessing] = useState(false);

    const [showInitPipeline, setShowInitPipeline] = useState(false);
    const [selectedPipelineId, setSelectedPipelineId] = useState('');
    const [initPipelineProcessing, setInitPipelineProcessing] = useState(false);

    function submitInitPipeline(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedPipelineId) return;
        setInitPipelineProcessing(true);
        router.post('/pipelines/instances', { pipeline_id: selectedPipelineId, document_id: doc.id }, {
            preserveScroll: true,
            onSuccess: () => {
                setShowInitPipeline(false);
                setSelectedPipelineId('');
            },
            onFinish: () => setInitPipelineProcessing(false),
        });
    }

    const emailForm = useForm({ destinataire: '', message: '' });

    function submitEmail(e: React.FormEvent) {
        e.preventDefault();
        emailForm.post(`/documents/${doc.id}/email`, {
            preserveScroll: true,
            onSuccess: () => {
                setShowEmail(false);
                emailForm.reset();
            },
        });
    }

    const shareForm = useForm({
        document_id: doc.id,
        peut_telecharger: true,
        expire_le: '',
        max_telechargements: '',
        mot_de_passe: '',
    });

    const editRootFolders = useMemo(() => dossiers.filter((d) => !d.parent_id), [dossiers]);
    function getEditFolderChildren(parentId: string) {
        return dossiers.filter((d) => d.parent_id === parentId);
    }
    const [editFolderPath, setEditFolderPath] = useState<string[]>(() =>
        doc.dossier_id ? computeFolderPath(dossiers, doc.dossier_id) : []
    );

    function selectEditRootFolder(v: string) {
        setEditFolderPath(v ? [v] : []);
        editForm.setData('dossier_id', v);
    }

    function selectEditSubFolder(level: number, parentId: string, v: string) {
        if (v) {
            setEditFolderPath([...editFolderPath.slice(0, level + 1), v]);
            editForm.setData('dossier_id', v);
        } else {
            setEditFolderPath(editFolderPath.slice(0, level + 1));
            editForm.setData('dossier_id', parentId);
        }
    }

    const editForm = useForm({
        titre: doc.titre,
        numero_document: doc.numero_document ?? '',
        date_document: doc.date_document ? doc.date_document.split('T')[0] : '',
        description: doc.description ?? '',
        categorie_id: doc.categorie_id ?? '',
        date_archivage: doc.date_archivage ? doc.date_archivage.split('T')[0] : '',
        dossier_id: doc.dossier_id ?? '',
        tags: doc.tags?.map((t) => t.id) ?? [],
    });

    const scanForm = useForm<{ fichier: File | null; titre: string; description: string; categorie_id: string; tags: string[] }>({
        fichier: null,
        titre: '',
        description: '',
        categorie_id: '',
        tags: [],
    });

    function submitShare(e: React.FormEvent) {
        e.preventDefault();
        shareForm.post('/partage', {
            preserveScroll: true,
            onSuccess: () => {
                setShowShare(false);
                shareForm.reset();
            },
        });
    }

    function submitEdit(e: React.FormEvent) {
        e.preventDefault();
        editForm.put(`/documents/${doc.id}`, {
            preserveScroll: true,
            onSuccess: () => setShowEdit(false),
        });
    }

    function submitScan(e: React.FormEvent) {
        e.preventDefault();
        scanForm.post('/documents/scan', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setShowScan(false);
                scanForm.reset();
            },
        });
    }

    function submitComment(e: React.FormEvent) {
        e.preventDefault();
        commentForm.post('/commentaires', { preserveScroll: true, onSuccess: () => commentForm.reset('contenu') });
    }

    function submitVersion(e: React.FormEvent) {
        e.preventDefault();
        versionForm.post(`/documents/${doc.id}/versions`, { forceFormData: true, preserveScroll: true, onSuccess: () => versionForm.reset() });
    }

    function submitSign(e: React.FormEvent) {
        e.preventDefault();
        setSignProcessing(true);

        router.post(`/documents/${doc.id}/sign`, {
            signature_data: signatureData,
            reference_externe: referenceExterne,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setShowSign(false);
                setSignatureData('');
                setReferenceExterne('');
            },
            onFinish: () => setSignProcessing(false),
        });
    }

    function toggleTag(tagId: string) {
        const current = editForm.data.tags;
        if (current.includes(tagId)) {
            editForm.setData('tags', current.filter((id) => id !== tagId));
        } else {
            editForm.setData('tags', [...current, tagId]);
        }
    }

    function toggleScanTag(tagId: string) {
        const current = scanForm.data.tags;
        if (current.includes(tagId)) {
            scanForm.setData('tags', current.filter((id) => id !== tagId));
        } else {
            scanForm.setData('tags', [...current, tagId]);
        }
    }

    const previewType = canPreview(doc.extension);
    const previewUrl = `/documents/${doc.id}/preview`;
    const officePreviewUrl = `/documents/${doc.id}/editor/preview`;
    const hasSigned = !!doc.signatures?.some((s) => s.utilisateur_id === props.auth?.user?.id);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={doc.titre} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                        <Link href="/documents">
                            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">{doc.titre}</h1>
                            <p className="text-muted-foreground">
                                {doc.nom_fichier_original} &middot; {doc.taille_formatee} &middot; v{doc.version_courante}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {previewType && (
                            <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
                                <Eye className="mr-2 h-4 w-4" />{showPreview ? 'Masquer' : 'Visualiser'}
                            </Button>
                        )}
                        {previewType === 'office' && (
                            <a href={`/documents/${doc.id}/edit`}>
                                <Button variant="outline">
                                    <Pencil className="mr-2 h-4 w-4" />Éditer le contenu
                                </Button>
                            </a>
                        )}
                        <a href={`/documents/${doc.id}/download`}>
                            <Button variant="outline"><Download className="mr-2 h-4 w-4" />Telecharger</Button>
                        </a>
                        <Button variant="outline" onClick={() => {
                            editForm.setData({
                                titre: doc.titre,
                                numero_document: doc.numero_document ?? '',
                                date_document: doc.date_document ? doc.date_document.split('T')[0] : '',
                                description: doc.description ?? '',
                                categorie_id: doc.categorie_id ?? '',
                                date_archivage: doc.date_archivage ? doc.date_archivage.split('T')[0] : '',
                                dossier_id: doc.dossier_id ?? '',
                                tags: doc.tags?.map((t) => t.id) ?? [],
                            });
                            setEditFolderPath(doc.dossier_id ? computeFolderPath(dossiers, doc.dossier_id) : []);
                            setShowEdit(true);
                        }}>
                            <Pencil className="mr-2 h-4 w-4" />Modifier infos
                        </Button>
                        <Button variant="outline" disabled={isOcrRunning} onClick={() => {
                            setIsOcrRunning(true);
                            router.post(`/documents/${doc.id}/ocr`, {}, {
                                preserveScroll: true,
                                onFinish: () => setIsOcrRunning(false),
                            });
                        }}>
                            {isOcrRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanText className="mr-2 h-4 w-4" />}
                            {isOcrRunning ? 'OCR en cours...' : 'Lancer OCR'}
                        </Button>
                        <Button variant="outline" onClick={() => setShowScan(true)}>
                            <Camera className="mr-2 h-4 w-4" />Scan + OCR
                        </Button>
                        <Button variant="outline" onClick={() => setShowEmail(true)}>
                            <Mail className="mr-2 h-4 w-4" />Envoyer par email
                        </Button>
                        {doc.signatures && doc.signatures.length > 0 && (
                            <Badge className="px-2 py-1 text-xs">Signé {doc.signatures.length} fois</Badge>
                        )}
                        {!hasSigned && (
                            <Dialog open={showSign} onOpenChange={setShowSign}>
                                <DialogTrigger asChild>
                                    <Button variant="outline">
                                        <PenTool className="mr-2 h-4 w-4" />Signer
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Signer électroniquement</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={submitSign} className="space-y-4">
                                        <div>
                                            <Label>Référence (optionnelle)</Label>
                                            <Input
                                                type="text"
                                                value={referenceExterne}
                                                onChange={(e) => setReferenceExterne(e.target.value)}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label>Données de signature (optionnel, par exemple hash)</Label>
                                            <Textarea
                                                value={signatureData}
                                                onChange={(e) => setSignatureData(e.target.value)}
                                                className="mt-1 h-28"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button type="button" variant="outline" onClick={() => setShowSign(false)}>
                                                Annuler
                                            </Button>
                                            <Button type="submit" disabled={signProcessing}>
                                                {signProcessing ? 'Signature en cours...' : 'Signer'}
                                            </Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        )}
                        {hasSigned && (
                            <Badge className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700">Vous avez déjà signé</Badge>
                        )}
                        <Dialog open={showShare} onOpenChange={setShowShare}>
                            <DialogTrigger asChild>
                                <Button variant="outline">
                                    <Share2 className="mr-2 h-4 w-4" />Partager
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Partager ce document</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={submitShare} className="space-y-4">
                                    <div>
                                        <Label>Date d'expiration (optionnel)</Label>
                                        <Input
                                            type="datetime-local"
                                            value={shareForm.data.expire_le}
                                            onChange={(e) => shareForm.setData('expire_le', e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label>Nombre max de telechargements (optionnel)</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={shareForm.data.max_telechargements}
                                            onChange={(e) => shareForm.setData('max_telechargements', e.target.value)}
                                            className="mt-1"
                                            placeholder="Illimite"
                                        />
                                    </div>
                                    <div>
                                        <Label>Mot de passe (optionnel)</Label>
                                        <Input
                                            type="text"
                                            value={shareForm.data.mot_de_passe}
                                            onChange={(e) => shareForm.setData('mot_de_passe', e.target.value)}
                                            className="mt-1"
                                            placeholder="Laisser vide pour aucun"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="peut_telecharger"
                                            checked={shareForm.data.peut_telecharger}
                                            onCheckedChange={(checked) => shareForm.setData('peut_telecharger', !!checked)}
                                        />
                                        <Label htmlFor="peut_telecharger">Autoriser le telechargement</Label>
                                    </div>
                                    <Button type="submit" disabled={shareForm.processing} className="w-full">
                                        Generer le lien de partage
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                        <Button variant="destructive" size="icon" onClick={() => {
                            if (confirm('Supprimer ce document ?')) router.delete(`/documents/${doc.id}`);
                        }}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Document Preview */}
                {showPreview && previewType && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Eye className="h-4 w-4" />Apercu du document</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {previewType === 'pdf' && (
                                <iframe
                                    src={previewUrl}
                                    className="w-full rounded-lg border"
                                    style={{ height: '70vh' }}
                                    title="Apercu PDF"
                                />
                            )}
                            {previewType === 'image' && (
                                <div className="flex justify-center">
                                    <img
                                        src={previewUrl}
                                        alt={doc.titre}
                                        className="max-h-[70vh] rounded-lg object-contain"
                                    />
                                </div>
                            )}
                            {previewType === 'text' && (
                                <TextPreview url={previewUrl} />
                            )}
                            {previewType === 'office' && (
                                <OfficePreview url={officePreviewUrl} />
                            )}
                        </CardContent>
                    </Card>
                )}

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Description */}
                        {doc.description && (
                            <Card>
                                <CardHeader><CardTitle>Description</CardTitle></CardHeader>
                                <CardContent><p>{doc.description}</p></CardContent>
                            </Card>
                        )}

                        {/* Texte extrait (OCR) */}
                        {doc.texte_extrait && (
                            <Card>
                                <CardHeader><CardTitle className="flex items-center gap-2"><ScanText className="h-4 w-4" />Texte extrait (OCR)</CardTitle></CardHeader>
                                <CardContent>
                                    <pre className="whitespace-pre-wrap text-sm max-h-96 overflow-y-auto bg-muted p-4 rounded-lg">{doc.texte_extrait}</pre>
                                </CardContent>
                            </Card>
                        )}

                        {/* Interroger le document avec l'IA */}
                        <DocumentAiPanel doc={doc} />

                        {/* Versions */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center gap-2"><Clock className="h-4 w-4" />Versions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {doc.versions?.map((v) => (
                                    <div key={v.id} className="flex items-center justify-between rounded-lg border p-3">
                                        <div>
                                            <p className="font-medium">Version {v.numero_version}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {v.nom_fichier} {v.commentaire && `- ${v.commentaire}`}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{formatDate(v.created_at)}</p>
                                        </div>
                                    </div>
                                ))}
                                <Separator />
                                <form onSubmit={submitVersion} className="space-y-3">
                                    <Label>Nouvelle version</Label>
                                    <Input type="file" onChange={(e) => versionForm.setData('fichier', e.target.files?.[0] ?? null)} />
                                    <Input placeholder="Commentaire (optionnel)" value={versionForm.data.commentaire} onChange={(e) => versionForm.setData('commentaire', e.target.value)} />
                                    <Button type="submit" size="sm" disabled={versionForm.processing || !versionForm.data.fichier}>Ajouter version</Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Comments */}
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-4 w-4" />Commentaires ({doc.commentaires?.length ?? 0})</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                {doc.commentaires?.filter(c => !c.parent_id).map((c) => (
                                    <div key={c.id} className="rounded-lg border p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-medium text-sm">{c.utilisateur?.prenom} {c.utilisateur?.nom}</span>
                                            <span className="text-xs text-muted-foreground">{formatDate(c.created_at)}</span>
                                            {c.est_resolu && <Badge variant="secondary">Resolu</Badge>}
                                        </div>
                                        <p className="text-sm">{c.contenu}</p>
                                        {c.reponses?.map((r) => (
                                            <div key={r.id} className="ml-4 mt-2 border-l-2 pl-3">
                                                <span className="text-sm font-medium">{r.utilisateur?.prenom} {r.utilisateur?.nom}</span>
                                                <p className="text-sm">{r.contenu}</p>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                                <form onSubmit={submitComment} className="flex gap-2">
                                    <Input placeholder="Ajouter un commentaire..." value={commentForm.data.contenu} onChange={(e) => commentForm.setData('contenu', e.target.value)} className="flex-1" />
                                    <Button type="submit" size="sm" disabled={commentForm.processing || !commentForm.data.contenu}>Envoyer</Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span>{doc.extension?.toUpperCase()}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Taille</span><span>{doc.taille_formatee}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Statut</span><Badge variant="secondary">{doc.statut}</Badge></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Version</span><span>{doc.version_courante}</span></div>
                                {doc.numero_document && <div className="flex justify-between"><span className="text-muted-foreground">N° document</span><span className="font-medium">{doc.numero_document}</span></div>}
                                {doc.date_document && <div className="flex justify-between"><span className="text-muted-foreground">Date document</span><span>{new Date(doc.date_document).toLocaleDateString('fr-FR')}</span></div>}
                                {doc.createur && <div className="flex justify-between"><span className="text-muted-foreground">Cree par</span><span>{doc.createur.prenom} {doc.createur.nom}</span></div>}
                                {doc.created_at && <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{formatDate(doc.created_at)}</span></div>}
                                {doc.dossier && <div className="flex justify-between"><span className="text-muted-foreground">Dossier</span><Link href={`/dossiers/${doc.dossier.id}`} className="text-primary hover:underline">{doc.dossier.nom}</Link></div>}
                                {doc.categorie && <div className="flex justify-between"><span className="text-muted-foreground">Categorie</span><span>{doc.categorie.nom}</span></div>}
                                {doc.date_archivage && <div className="flex justify-between"><span className="text-muted-foreground">Archivage</span><span>{new Date(doc.date_archivage).toLocaleDateString('fr-FR')}</span></div>}
                            </CardContent>
                        </Card>

                        {doc.tags && doc.tags.length > 0 && (
                            <Card>
                                <CardHeader><CardTitle>Tags</CardTitle></CardHeader>
                                <CardContent className="flex flex-wrap gap-2">
                                    {doc.tags.map((tag) => (
                                        <Badge key={tag.id} variant="outline" style={{ borderColor: tag.couleur ?? undefined }}>{tag.nom}</Badge>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Pipelines */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <GitMerge className="h-4 w-4" />Pipelines
                                    </CardTitle>
                                    {pipelines.length > 0 && (
                                        <Button variant="outline" size="sm" onClick={() => setShowInitPipeline(true)}>
                                            <Plus className="h-3 w-3 mr-1" />Initier
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {pipeline_instances.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        {pipelines.length === 0
                                            ? 'Aucun pipeline actif configuré.'
                                            : 'Ce document n\'est dans aucun pipeline.'}
                                    </p>
                                ) : (
                                    pipeline_instances.map((inst) => (
                                        <div key={inst.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                                            <div className="min-w-0">
                                                <p className="font-medium truncate">{inst.pipeline?.nom ?? '—'}</p>
                                                <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${STATUT_PIPELINE_COLORS[inst.statut] ?? 'bg-muted text-muted-foreground'}`}>
                                                    {STATUT_PIPELINE_LABELS[inst.statut] ?? inst.statut}
                                                </span>
                                            </div>
                                            <Link href={`/pipelines/instances/${inst.id}`}>
                                                <Button variant="ghost" size="icon" className="shrink-0">
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                </Button>
                                            </Link>
                                        </div>
                                    ))
                                )}
                                {pipeline_instances.length === 0 && pipelines.length > 0 && (
                                    <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setShowInitPipeline(true)}>
                                        <Plus className="h-3 w-3 mr-1" />Initier un pipeline
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={showEdit} onOpenChange={(v) => {
                setShowEdit(v);
                if (!v) setEditFolderPath(doc.dossier_id ? computeFolderPath(dossiers, doc.dossier_id) : []);
            }}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Modifier le document</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitEdit} className="space-y-4">
                        <div>
                            <Label>Nom du document <span className="text-destructive">*</span></Label>
                            <Input
                                value={editForm.data.titre}
                                onChange={(e) => editForm.setData('titre', e.target.value)}
                                placeholder="Ex : Contrat de service 2024"
                                className="mt-1"
                            />
                            {editForm.errors.titre && <p className="text-sm text-destructive mt-1">{editForm.errors.titre}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Numéro de document</Label>
                                <Input
                                    value={editForm.data.numero_document}
                                    onChange={(e) => editForm.setData('numero_document', e.target.value)}
                                    placeholder="Ex : DOC-2024-001"
                                    className="mt-1"
                                />
                                {editForm.errors.numero_document && <p className="text-sm text-destructive mt-1">{editForm.errors.numero_document}</p>}
                            </div>
                            <div>
                                <Label>Date du document</Label>
                                <Input
                                    type="date"
                                    value={editForm.data.date_document}
                                    onChange={(e) => editForm.setData('date_document', e.target.value)}
                                    className="mt-1"
                                />
                                {editForm.errors.date_document && <p className="text-sm text-destructive mt-1">{editForm.errors.date_document}</p>}
                            </div>
                        </div>
                        <div>
                            <Label>Description</Label>
                            <Textarea
                                value={editForm.data.description}
                                onChange={(e) => editForm.setData('description', e.target.value)}
                                className="mt-1"
                                rows={3}
                            />
                        </div>
                        <div>
                            <Label>Délai d'archivage</Label>
                            <Input
                                type="date"
                                value={editForm.data.date_archivage}
                                onChange={(e) => editForm.setData('date_archivage', e.target.value)}
                                className="mt-1"
                            />
                            {editForm.errors.date_archivage && <p className="text-sm text-destructive mt-1">{editForm.errors.date_archivage}</p>}
                        </div>
                        {/* Sélection dossier en cascade */}
                        <div className="space-y-2">
                            <div>
                                <Label>Dossier</Label>
                                <Select
                                    value={editFolderPath[0] || '__none__'}
                                    onValueChange={(v) => selectEditRootFolder(v === '__none__' ? '' : v)}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Aucun dossier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Aucun dossier</SelectItem>
                                        {editRootFolders.map((d) => (
                                            <SelectItem key={d.id} value={d.id}>{d.nom}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {editFolderPath.map((parentId, level) => {
                                const children = getEditFolderChildren(parentId);
                                if (children.length === 0) return null;
                                const parentName = dossiers.find((d) => d.id === parentId)?.nom ?? '';
                                return (
                                    <div key={`edit-level-${level + 1}`}>
                                        <Label className="text-xs text-muted-foreground">
                                            Sous-dossier de «&nbsp;{parentName}&nbsp;»
                                        </Label>
                                        <Select
                                            value={editFolderPath[level + 1] ?? ''}
                                            onValueChange={(v) => selectEditSubFolder(level, parentId, v)}
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder={`Rester dans "${parentName}"`} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {children.map((d) => (
                                                    <SelectItem key={d.id} value={d.id}>{d.nom}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                );
                            })}
                        </div>
                        <div>
                            <Label>Catégorie</Label>
                            <Select
                                value={editForm.data.categorie_id || '__none__'}
                                onValueChange={(v) => editForm.setData('categorie_id', v === '__none__' ? '' : v)}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Aucune catégorie" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">Aucune catégorie</SelectItem>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>{cat.nom}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Tags</Label>
                            <div className="mt-1 flex flex-wrap gap-2">
                                {allTags.map((tag) => (
                                    <Badge
                                        key={tag.id}
                                        variant={editForm.data.tags.includes(tag.id) ? 'default' : 'outline'}
                                        className="cursor-pointer"
                                        style={{ borderColor: tag.couleur ?? undefined }}
                                        onClick={() => toggleTag(tag.id)}
                                    >
                                        {tag.nom}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button type="button" variant="outline" onClick={() => setShowEdit(false)}>Annuler</Button>
                            <Button type="submit" disabled={editForm.processing}>Enregistrer</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Scan + OCR Dialog */}
            <Dialog open={showScan} onOpenChange={setShowScan}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Scanner un document (OCR automatique)</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitScan} className="space-y-4">
                        <div>
                            <Label>Fichier scan (image ou PDF)</Label>
                            <Input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => scanForm.setData('fichier', e.target.files?.[0] ?? null)}
                                className="mt-1"
                            />
                            {scanForm.errors.fichier && <p className="text-sm text-destructive mt-1">{scanForm.errors.fichier}</p>}
                            <p className="text-xs text-muted-foreground mt-1">
                                Formats acceptes : JPG, PNG, TIFF, BMP, GIF, PDF. L'OCR sera lance automatiquement.
                            </p>
                        </div>
                        <div>
                            <Label>Titre</Label>
                            <Input
                                value={scanForm.data.titre}
                                onChange={(e) => scanForm.setData('titre', e.target.value)}
                                className="mt-1"
                                placeholder="Titre du document scanne"
                            />
                            {scanForm.errors.titre && <p className="text-sm text-destructive mt-1">{scanForm.errors.titre}</p>}
                        </div>
                        <div>
                            <Label>Description (optionnel)</Label>
                            <Textarea
                                value={scanForm.data.description}
                                onChange={(e) => scanForm.setData('description', e.target.value)}
                                className="mt-1"
                                rows={2}
                            />
                        </div>
                        <div>
                            <Label>Categorie</Label>
                            <select
                                value={scanForm.data.categorie_id}
                                onChange={(e) => scanForm.setData('categorie_id', e.target.value)}
                                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="">Aucune categorie</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.nom}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Label>Tags</Label>
                            <div className="mt-1 flex flex-wrap gap-2">
                                {allTags.map((tag) => (
                                    <Badge
                                        key={tag.id}
                                        variant={scanForm.data.tags.includes(tag.id) ? 'default' : 'outline'}
                                        className="cursor-pointer"
                                        style={{ borderColor: tag.couleur ?? undefined }}
                                        onClick={() => toggleScanTag(tag.id)}
                                    >
                                        {tag.nom}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <Button type="submit" disabled={scanForm.processing || !scanForm.data.fichier || !scanForm.data.titre} className="w-full">
                            {scanForm.processing ? 'Upload et OCR en cours...' : 'Uploader et lancer OCR'}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Email Dialog */}
            <Dialog open={showEmail} onOpenChange={setShowEmail}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5" />Envoyer par email
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitEmail} className="space-y-4">
                        <div>
                            <Label>Email du destinataire</Label>
                            <Input
                                type="email"
                                placeholder="exemple@domaine.com"
                                value={emailForm.data.destinataire}
                                onChange={(e) => emailForm.setData('destinataire', e.target.value)}
                                className="mt-1"
                            />
                            {emailForm.errors.destinataire && (
                                <p className="text-sm text-destructive mt-1">{emailForm.errors.destinataire}</p>
                            )}
                        </div>
                        <div>
                            <Label>Message personnalisé (optionnel)</Label>
                            <Textarea
                                placeholder="Ajoutez un message pour le destinataire..."
                                value={emailForm.data.message}
                                onChange={(e) => emailForm.setData('message', e.target.value)}
                                className="mt-1"
                                rows={3}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Le document « {doc.titre} » sera joint en pièce jointe.
                        </p>
                        <div className="flex gap-2 justify-end">
                            <Button type="button" variant="outline" onClick={() => setShowEmail(false)}>
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                disabled={emailForm.processing || !emailForm.data.destinataire}
                                className="bg-[oklch(0.65_0.19_45)] hover:bg-[oklch(0.55_0.19_45)] text-white"
                            >
                                <Send className="mr-2 h-4 w-4" />
                                {emailForm.processing ? 'Envoi...' : 'Envoyer'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Initier un pipeline */}
            <Dialog open={showInitPipeline} onOpenChange={setShowInitPipeline}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <GitMerge className="h-5 w-5" />Initier un pipeline
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitInitPipeline} className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Choisissez un pipeline pour faire circuler <strong>{doc.titre}</strong> à travers les étapes de validation.
                        </p>
                        <div>
                            <Label>Pipeline *</Label>
                            <Select value={selectedPipelineId} onValueChange={setSelectedPipelineId}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Sélectionner un pipeline..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {pipelines.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            <span className="font-medium">{p.nom}</span>
                                            {p.type_document && <span className="ml-1 text-muted-foreground text-xs">({p.type_document})</span>}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button type="button" variant="outline" onClick={() => setShowInitPipeline(false)}>Annuler</Button>
                            <Button type="submit" disabled={initPipelineProcessing || !selectedPipelineId}>
                                {initPipelineProcessing ? 'Initiation...' : 'Initier le pipeline'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

function TextPreview({ url }: { url: string }) {
    const [content, setContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(url)
            .then((res) => res.text())
            .then((text) => {
                setContent(text);
                setLoading(false);
            })
            .catch(() => {
                setContent('Impossible de charger le fichier.');
                setLoading(false);
            });
    }, [url]);

    if (loading) return <p className="text-muted-foreground">Chargement...</p>;
    return <pre className="whitespace-pre-wrap text-sm max-h-[70vh] overflow-y-auto bg-muted p-4 rounded-lg">{content}</pre>;
}

// ─── Panel IA ─────────────────────────────────────────────────────────────────

interface AiMessage {
    role: 'user' | 'assistant';
    content: string;
}

function DocumentAiPanel({ doc }: { doc: Document }) {
    const [question, setQuestion] = useState('');
    const [history, setHistory] = useState<AiMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isOcrRunning, setIsOcrRunning] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll vers le bas quand l'historique change
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, loading]);

    async function handleAsk(e: React.FormEvent) {
        e.preventDefault();
        const q = question.trim();
        if (!q || loading) return;

        const csrf = window.document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

        setQuestion('');
        setError(null);
        setHistory((prev) => [...prev, { role: 'user', content: q }]);
        setLoading(true);

        try {
            const res = await fetch(`/documents/${doc.id}/ask`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf,
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    question: q,
                    history: history.map((h) => ({ role: h.role, content: h.content })),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error ?? 'Une erreur est survenue.');
                setHistory((prev) => prev.slice(0, -1));
                return;
            }

            setHistory((prev) => [...prev, { role: 'assistant', content: data.reponse }]);
        } catch {
            setError('Erreur réseau. Vérifiez votre connexion.');
            setHistory((prev) => prev.slice(0, -1));
        } finally {
            setLoading(false);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }

    const hasTexte = Boolean(doc.texte_extrait);

    return (
        <Card className="border-indigo-100">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-indigo-600" />
                    </div>
                    Interroger ce document avec l'IA
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                    Posez n'importe quelle question sur le contenu de ce document.
                </p>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Avertissement si pas de texte extrait */}
                {!hasTexte && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm">
                        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                        <div>
                            <p className="font-medium text-amber-800">Texte du document non extrait</p>
                            <p className="text-amber-700 text-xs mt-0.5">
                                L'IA n'a accès qu'aux métadonnées. Lancez l'OCR pour obtenir des réponses basées sur le contenu réel du document.
                            </p>
                            <button
                                onClick={() => {
                                    setIsOcrRunning(true);
                                    router.post(`/documents/${doc.id}/ocr`, {}, {
                                        preserveScroll: true,
                                        onFinish: () => setIsOcrRunning(false),
                                    });
                                }}
                                disabled={isOcrRunning}
                                className="mt-2 flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-900 underline underline-offset-2 disabled:opacity-50"
                            >
                                {isOcrRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <ScanText className="w-3 h-3" />}
                                {isOcrRunning ? 'OCR en cours...' : "Lancer l'OCR maintenant"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Historique de la conversation */}
                {history.length > 0 && (
                    <div className="space-y-3 max-h-[420px] overflow-y-auto rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                        {history.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                                        <Bot className="w-3.5 h-3.5 text-indigo-600" />
                                    </div>
                                )}
                                <div
                                    className={`rounded-2xl px-3.5 py-2.5 text-sm max-w-[85%] leading-relaxed ${
                                        msg.role === 'user'
                                            ? 'bg-indigo-600 text-white rounded-tr-sm'
                                            : 'bg-white border border-slate-100 text-slate-800 rounded-tl-sm shadow-sm'
                                    }`}
                                >
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                </div>
                                {msg.role === 'user' && (
                                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                                        <User className="w-3.5 h-3.5 text-slate-500" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Indicateur de chargement */}
                        {loading && (
                            <div className="flex gap-2.5 justify-start">
                                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                    <Bot className="w-3.5 h-3.5 text-indigo-600" />
                                </div>
                                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                                    <span className="text-xs text-slate-400">L'IA analyse le document…</span>
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>
                )}

                {/* Erreur */}
                {error && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        {error}
                    </div>
                )}

                {/* Champ de saisie */}
                <form onSubmit={handleAsk} className="flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder={hasTexte ? 'Posez votre question sur ce document…' : 'Posez une question (métadonnées seulement)…'}
                        disabled={loading}
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 disabled:opacity-50"
                    />
                    <Button
                        type="submit"
                        size="sm"
                        disabled={loading || !question.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3"
                    >
                        {loading
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Send className="w-4 h-4" />
                        }
                    </Button>
                </form>

                {/* Suggestions de questions */}
                {history.length === 0 && hasTexte && (
                    <div className="flex flex-wrap gap-1.5">
                        {[
                            'De quoi parle ce document ?',
                            'Quelles sont les informations clés ?',
                            'Résume ce document en 3 points.',
                            'Quelles sont les dates mentionnées ?',
                        ].map((suggestion) => (
                            <button
                                key={suggestion}
                                type="button"
                                onClick={() => setQuestion(suggestion)}
                                className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors border border-indigo-100"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}

                {/* Effacer la conversation */}
                {history.length > 0 && !loading && (
                    <button
                        type="button"
                        onClick={() => { setHistory([]); setError(null); }}
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <RotateCcw className="w-3 h-3" />
                        Nouvelle conversation
                    </button>
                )}
            </CardContent>
        </Card>
    );
}
