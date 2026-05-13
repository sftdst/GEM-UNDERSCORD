/* ── Détails d'un courrier ──────────────────────────────────────────────────── */

import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Download, Trash2, Send, Plus, Clock, User, FileText, MessageSquare, RefreshCw, Upload, ChevronDown, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Courrier, CourrierType, CourrierStatut, CourrierCommentaire, CourrierHistorique, CourrierDocument, Service, Utilisateur } from '@/types/models';

interface Props {
    courrier: Courrier;
    services: Service[];
    agents: Utilisateur[];
    statuts: CourrierStatut[];
    types: CourrierType[];
    autresCourriers: { id: string; numero: string; objet: string }[];
}

const URGENCE_COULEURS: Record<string, string> = {
    Normal: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    Urgent: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    TresUrgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const STATUT_COLORS: Record<string, string> = {
    RECU: '#6366f1',
    AFFECTE: '#f59e0b',
    EN_COURS: '#3b82f6',
    TRAITE: '#10b981',
    CLOTURE: '#6b7280',
};

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatRelativeDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return 'Hier';
    if (diff < 7) return `Il y a ${diff} jours`;
    return formatDate(dateStr);
}

export default function CourrierShow({ courrier, services, agents, statuts, types, autresCourriers }: Props) {
    const [activeTab, setActiveTab] = useState<'historique' | 'commentaires' | 'documents'>('historique');
    const [showAffecter, setShowAffecter] = useState(false);
    const [showTransferer, setShowTransferer] = useState(false);
    const [showStatut, setShowStatut] = useState(false);
    const [showUploadDoc, setShowUploadDoc] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const commentaireForm = useForm<{ contenu: string; courrier_id: string }>({ contenu: '', courrier_id: courrier.id });
    const affecterForm = useForm<{ agent_id: string; motif: string }>({ agent_id: '', motif: '' });
    const transfererForm = useForm<{ destinataire_id: string; motif: string }>({ destinataire_id: '', motif: '' });
    const statutForm = useForm<{ statut: string; motif: string }>({ statut: courrier.statut, motif: '' });

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [docDescription, setDocDescription] = useState('');

    function submitCommentaire() {
        commentaireForm.post('/courriers/commentaire', {
            preserveScroll: true,
            onSuccess: () => {
                commentaireForm.reset('contenu');
                toast.success('Commentaire ajouté');
            },
        });
    }

    function submitAffecter() {
        affecterForm.post(`/courriers/${courrier.id}/affecter`, {
            preserveScroll: true,
            onSuccess: () => {
                setShowAffecter(false);
                affecterForm.reset();
                toast.success('Courrier affecté');
            },
        });
    }

    function submitTransferer() {
        transfererForm.post(`/courriers/${courrier.id}/transferer`, {
            preserveScroll: true,
            onSuccess: () => {
                setShowTransferer(false);
                transfererForm.reset();
                toast.success('Courrier transféré');
            },
        });
    }

    function submitStatut() {
        statutForm.post(`/courriers/${courrier.id}/statut`, {
            preserveScroll: true,
            onSuccess: () => {
                setShowStatut(false);
                toast.success('Statut mis à jour');
            },
        });
    }

    function handleDocUpload(e: React.FormEvent) {
        e.preventDefault();
        const data = new FormData();
        data.append('description', docDescription);
        if (selectedFile) data.append('fichier', selectedFile);

        router.post(`/courriers/document/upload`, data, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setShowUploadDoc(false);
                setSelectedFile(null);
                setDocDescription('');
                toast.success('Document ajouté');
            },
        });
    }

    const currentIdx = autresCourriers.findIndex((c) => c.id === courrier.id);
    const prevCourrier = currentIdx > 0 ? autresCourriers[currentIdx - 1] : null;
    const nextCourrier = currentIdx < autresCourriers.length - 1 ? autresCourriers[currentIdx + 1] : null;
    const isEnRetard = courrier.est_en_retard && courrier.statut !== 'CLOTURE';

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Courriers', href: '/courriers' },
                { title: courrier.numero, href: `/courriers/${courrier.id}` },
            ]}
        >
            <Head title={`Courrier ${courrier.numero}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {isEnRetard && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800">
                        <AlertTriangle className="mb-1 inline h-4 w-4" />
                        <strong>En retard !</strong> Ce courrier a dépassé sa date d'échéance.
                        {courrier.jours_retard && <span className="ml-2 font-medium">{courrier.jours_retard} jour{courrier.jours_retard > 1 ? 's' : ''} de retard.</span>}
                    </div>
                )}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold">{courrier.numero}</h1>
                            <Badge style={{ backgroundColor: STATUT_COLORS[courrier.statut] ?? '#6b7280', color: '#fff' }} className="text-sm">
                                {courrier.statutCourrier?.nom ?? courrier.statut}
                            </Badge>
                            <Badge variant={courrier.type === 'ENT' ? 'secondary' : 'outline'}>
                                {courrier.type === 'ENT' ? 'Entrant' : 'Sortant'}
                            </Badge>
                            {courrier.urgence && <Badge className={URGENCE_COULEURS[courrier.urgence]}>{courrier.urgence}</Badge>}
                        </div>
                        <h2 className="mt-1 text-lg text-foreground">{courrier.objet}</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-1">
                            {prevCourrier ? (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/courriers/${prevCourrier.id}`}><ChevronDown className="h-4 w-4 rotate-90" /> {prevCourrier.numero}</Link>
                                </Button>
                            ) : <span />}
                            {nextCourrier ? (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/courriers/${nextCourrier.id}`}><ChevronDown className="h-4 w-4 -rotate-90" /> {nextCourrier.numero}</Link>
                                </Button>
                            ) : <span />}
                        </div>
                        <Dialog open={showStatut} onOpenChange={setShowStatut}>
                            <DialogTrigger asChild>
                                <Button variant="outline"><RefreshCw className="mr-2 h-4 w-4" />Changer statut</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader><DialogTitle>Changer le statut</DialogTitle></DialogHeader>
                                <form onSubmit={(e) => { e.preventDefault(); submitStatut(); }} className="space-y-4">
                                    <div>
                                        <Label>Statut actuel</Label>
                                        <div className="rounded-md border bg-muted px-3 py-2 text-sm">
                                            <Badge style={{ backgroundColor: STATUT_COLORS[courrier.statut] ?? '#6b7280' }}>{courrier.statutCourrier?.nom ?? courrier.statut}</Badge>
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="statut">Nouveau statut</Label>
                                        <Select value={statutForm.data.statut} onValueChange={(v) => statutForm.setData('statut', v)}>
                                            <SelectTrigger id="statut"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="RECU">Reçu</SelectItem>
                                                <SelectItem value="AFFECTE">Affecté</SelectItem>
                                                <SelectItem value="EN_COURS">En cours</SelectItem>
                                                <SelectItem value="TRAITE">Traité</SelectItem>
                                                <SelectItem value="CLOTURE">Clôturé</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="motif_statut">Motif (optionnel)</Label>
                                        <Textarea id="motif_statut" placeholder="Raison du changement de statut" value={statutForm.data.motif} onChange={(e) => statutForm.setData('motif', e.target.value)} rows={2} />
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <Button type="button" variant="outline" onClick={() => setShowStatut(false)}>Annuler</Button>
                                        <Button type="submit" disabled={statutForm.processing}>Appliquer</Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                        <Dialog open={showAffecter} onOpenChange={setShowAffecter}>
                            <DialogTrigger asChild>
                                <Button variant="outline"><User className="mr-2 h-4 w-4" />Affecter</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader><DialogTitle>Affecter à un agent</DialogTitle></DialogHeader>
                                <form onSubmit={(e) => { e.preventDefault(); submitAffecter(); }} className="space-y-4">
                                    <div>
                                        <Label htmlFor="agent_id">Agent</Label>
                                        <Select value={affecterForm.data.agent_id} onValueChange={(v) => affecterForm.setData('agent_id', v)}>
                                            <SelectTrigger id="agent_id"><SelectValue placeholder="Sélectionner un agent" /></SelectTrigger>
                                            <SelectContent>
                                                {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.prenom} {a.nom}{a.service ? ` — ${a.service?.nom}` : ''}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="affecter_motif">Motif (optionnel)</Label>
                                        <Textarea id="affecter_motif" value={affecterForm.data.motif} onChange={(e) => affecterForm.setData('motif', e.target.value)} rows={2} />
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <Button type="button" variant="outline" onClick={() => setShowAffecter(false)}>Annuler</Button>
                                        <Button type="submit" disabled={affecterForm.processing}>Affecter</Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                        <Dialog open={showTransferer} onOpenChange={setShowTransferer}>
                            <DialogTrigger asChild>
                                <Button variant="outline"><Send className="mr-2 h-4 w-4" />Transférer</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader><DialogTitle>Transférer le courrier</DialogTitle></DialogHeader>
                                <form onSubmit={(e) => { e.preventDefault(); submitTransferer(); }} className="space-y-4">
                                    <div>
                                        <Label htmlFor="destinataire_id">Destinataire</Label>
                                        <Select value={transfererForm.data.destinataire_id} onValueChange={(v) => transfererForm.setData('destinataire_id', v)}>
                                            <SelectTrigger id="destinataire_id"><SelectValue placeholder="Sélectionner un destinataire" /></SelectTrigger>
                                            <SelectContent>
                                                {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.prenom} {a.nom}{a.service ? ` — ${a.service?.nom}` : ''}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="transferer_motif">Motif *</Label>
                                        <Textarea id="transferer_motif" value={transfererForm.data.motif} onChange={(e) => transfererForm.setData('motif', e.target.value)} rows={2} required />
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <Button type="button" variant="outline" onClick={() => setShowTransferer(false)}>Annuler</Button>
                                        <Button type="submit" disabled={transfererForm.processing}>Transférer</Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                        <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}><Trash2 className="h-4 w-4 mr-1" /> Supprimer</Button>
                    </div>
                </div>

                <Tabs defaultValue="details" className="w-full" value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="details">Détails</TabsTrigger>
                        <TabsTrigger value="historique">Historique</TabsTrigger>
                        <TabsTrigger value="commentaires">
                            Commentaires
                            {courrier.commentaires && courrier.commentaires.length > 0 && <Badge variant="secondary" className="ml-2">{courrier.commentaires.length}</Badge>}
                        </TabsTrigger>
                        <TabsTrigger value="documents">
                            Documents
                            {courrier.documents && courrier.documents.length > 0 && <Badge variant="secondary" className="ml-2">{courrier.documents.length}</Badge>}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="details">
                        <div className="grid gap-6 lg:grid-cols-2">
                            <Card>
                                <CardHeader><CardTitle>Informations générales</CardTitle></CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="flex justify-between"><span className="text-muted-foreground">Numéro</span><span className="font-mono font-bold">{courrier.numero}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="font-medium">{courrier.type === 'ENT' ? 'Entrant' : 'Sortant'}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Objet</span><span className="font-medium">{courrier.objet}</span></div>
                                    {courrier.reference && <div className="flex justify-between"><span className="text-muted-foreground">Référence</span><span>{courrier.reference}</span></div>}
                                    {courrier.categorie && <div className="flex justify-between"><span className="text-muted-foreground">Catégorie</span><span>{courrier.categorie}</span></div>}
                                    {courrier.urgence && <div className="flex justify-between"><span className="text-muted-foreground">Urgence</span><Badge className={URGENCE_COULEURS[courrier.urgence]}>{courrier.urgence}</Badge></div>}
                                    {courrier.type === 'ENT' && courrier.expediteur_nom && (
                                        <>
                                            <div className="flex justify-between"><span className="text-muted-foreground">Expéditeur</span><span className="font-medium">{courrier.expediteur_nom}</span></div>
                                            {courrier.expediteur_organisation && <div className="flex justify-between"><span className="text-muted-foreground">Organisation</span><span>{courrier.expediteur_organisation}</span></div>}
                                            {courrier.expediteur_email && <div className="flex justify-between"><span className="text-muted-foreground">Email expéditeur</span><span>{courrier.expediteur_email}</span></div>}
                                        </>
                                    )}
                                    {courrier.type === 'SOR' && courrier.destinataire_nom && (
                                        <>
                                            <div className="flex justify-between"><span className="text-muted-foreground">Destinataire</span><span className="font-medium">{courrier.destinataire_nom}</span></div>
                                            {courrier.destinataire_organisation && <div className="flex justify-between"><span className="text-muted-foreground">Organisation</span><span>{courrier.destinataire_organisation}</span></div>}
                                            {courrier.destinataire_email && <div className="flex justify-between"><span className="text-muted-foreground">Email destinataire</span><span>{courrier.destinataire_email}</span></div>}
                                        </>
                                    )}
                                    {courrier.moyen_envoi && <div className="flex justify-between"><span className="text-muted-foreground">Moyen d'envoi</span><span>{courrier.moyen_envoi}</span></div>}
                                    {courrier.date_reception && <div className="flex justify-between"><span className="text-muted-foreground">Date réception</span><span>{formatDate(courrier.date_reception)}</span></div>}
                                    {courrier.date_envoi && <div className="flex justify-between"><span className="text-muted-foreground">Date envoi</span><span>{formatDate(courrier.date_envoi)}</span></div>}
                                    {courrier.date_echeance && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Date échéance</span>
                                            <span className={isEnRetard ? 'text-red-600 font-medium' : ''}>{formatDate(courrier.date_echeance)}</span>
                                        </div>
                                    )}
                                    {isEnRetard && <div className="flex justify-between"><span className="text-muted-foreground">Retard</span><span className="text-red-600 font-bold">{courrier.jours_retard} jour{courrier.jours_retard! > 1 ? 's' : ''}</span></div>}
                                    {courrier.typeCourrier && <div className="flex justify-between"><span className="text-muted-foreground">Type courrier</span><span>{courrier.typeCourrier.nom}</span></div>}
                                    {courrier.accuse_reception_genere && <div className="flex justify-between"><span className="text-muted-foreground">Accusé de réception</span><Badge variant="secondary">Généré</Badge></div>}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader><CardTitle>Métadonnées</CardTitle></CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    {courrier.service && <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span className="font-medium">{courrier.service.nom}</span></div>}
                                    {courrier.agent && <div className="flex justify-between"><span className="text-muted-foreground">Agent affecté</span><span className="font-medium">{courrier.agent.prenom} {courrier.agent.nom}</span></div>}
                                    {!courrier.agent && <div className="flex justify-between"><span className="text-muted-foreground">Agent affecté</span><span className="text-orange-500">Non affecté</span></div>}
                                    <div className="flex justify-between"><span className="text-muted-foreground">Statut</span><Badge style={{ backgroundColor: STATUT_COLORS[courrier.statut] ?? '#6b7280', color: '#fff' }}>{courrier.statutCourrier?.nom ?? courrier.statut}</Badge></div>
                                    {courrier.createur && <div className="flex justify-between"><span className="text-muted-foreground">Créé par</span><span className="font-medium">{courrier.createur.prenom} {courrier.createur.nom}</span></div>}
                                    <div className="flex justify-between"><span className="text-muted-foreground">Créé le</span><span>{formatDate(courrier.created_at)}</span></div>
                                    {courrier.observations && <div className="mt-4"><span className="text-muted-foreground">Observations</span><p className="mt-1 rounded-md bg-muted p-3 text-sm">{courrier.observations}</p></div>}
                                    {courrier.hash_sha256 && <div className="flex justify-between"><span className="text-muted-foreground">Hash SHA-256</span><code className="text-xs break-all text-muted-foreground">{courrier.hash_sha256}</code></div>}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="historique">
                        <Card>
                            <CardContent className="p-0">
                                {courrier.historiques && courrier.historiques.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Utilisateur</TableHead>
                                                <TableHead>Action</TableHead>
                                                <TableHead>Détails</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {courrier.historiques.map((h: CourrierHistorique) => (
                                                <TableRow key={h.id}>
                                                    <TableCell className="text-sm whitespace-nowrap">{formatDate(h.created_at)}</TableCell>
                                                    <TableCell className="text-sm">{h.utilisateur?.prenom} {h.utilisateur?.nom}</TableCell>
                                                    <TableCell className="text-sm">
                                                        <Badge variant={h.action === 'creation' ? 'default' : h.action === 'modification' ? 'secondary' : h.action === 'suppression' ? 'destructive' : 'outline'}>{h.action}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground max-w-md truncate">
                                                        {h.details && typeof h.details === 'object' ? JSON.stringify(h.details) : String(h.details ?? '—')}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="flex flex-1 items-center justify-center p-8">
                                        <div className="text-center text-muted-foreground">
                                            <Clock className="mx-auto mb-3 h-10 w-10" />
                                            <p>Aucun historique</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="commentaires">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex gap-3 mb-4">
                                    <Input
                                        placeholder="Ajouter un commentaire..."
                                        value={commentaireForm.data.contenu}
                                        onChange={(e) => commentaireForm.setData('contenu', e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitCommentaire(); } }}
                                        className="flex-1"
                                    />
                                    <Button onClick={() => submitCommentaire()} disabled={commentaireForm.processing || !commentaireForm.data.contenu.trim()}><Plus className="h-4 w-4 mr-1" /> Commenter</Button>
                                </div>

                                {courrier.commentaires && courrier.commentaires.length > 0 ? (
                                    <div className="space-y-4">
                                        {courrier.commentaires.map((c: CourrierCommentaire) => (
                                            <div key={c.id} className="rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                                            {(c.utilisateur?.prenom?.[0] ?? '')}{(c.utilisateur?.nom?.[0] ?? '')}
                                                        </div>
                                                        <span className="text-sm font-medium">{c.utilisateur?.prenom} {c.utilisateur?.nom}</span>
                                                        <span className="text-xs text-muted-foreground">{formatRelativeDate(c.created_at)}</span>
                                                    </div>
                                                </div>
                                                <p className="text-sm pl-9">{c.contenu}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-1 items-center justify-center p-8">
                                        <div className="text-center text-muted-foreground">
                                            <MessageSquare className="mx-auto mb-3 h-10 w-10" />
                                            <p className="text-sm">Aucun commentaire</p>
                                            <p className="text-xs">Soyez le premier à commenter ce courrier.</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="documents">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-base">Documents joints</CardTitle>
                                <Dialog open={showUploadDoc} onOpenChange={setShowUploadDoc}>
                                    <DialogTrigger asChild>
                                        <Button size="sm"><Upload className="mr-2 h-4 w-4" />Joindre un document</Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md">
                                        <DialogHeader><DialogTitle>Joindre un document</DialogTitle></DialogHeader>
                                        <form onSubmit={handleDocUpload} className="space-y-4">
                                            <div>
                                                <Label>Fichier</Label>
                                                <input type="file" accept="application/pdf,image/*,.doc,.docx,.xlsx,.xls,.csv" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} className="mt-1 block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-primary/20" />
                                            </div>
                                            <div>
                                                <Label htmlFor="doc_description">Description (optionnel)</Label>
                                                <Input id="doc_description" value={docDescription} onChange={(e) => setDocDescription(e.target.value)} placeholder="Description du document" />
                                            </div>
                                            <div className="flex gap-2 justify-end">
                                                <Button type="button" variant="outline" onClick={() => setShowUploadDoc(false)}>Annuler</Button>
                                                <Button type="submit" disabled={!selectedFile}>Joindre</Button>
                                            </div>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent className="p-0">
                                {courrier.documents && courrier.documents.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Fichier</TableHead>
                                                <TableHead>Taille</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {courrier.documents.map((doc: CourrierDocument) => (
                                                <TableRow key={doc.id} className="hover:bg-muted/50">
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                                            <div>
                                                                <p className="text-sm font-medium">{doc.nom_fichier_original}</p>
                                                                <p className="text-xs text-muted-foreground">{doc.mime_type?.toUpperCase() ?? 'FILE'} • {(doc.taille_octets / 1024).toFixed(1)} Ko</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">{(doc.taille_octets / 1024).toFixed(1)} Ko</TableCell>
                                                    <TableCell className="text-sm">{formatDate(doc.created_at)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="sm" asChild>
                                                            <Link href={`/courriers/document/${doc.id}/telecharger`}><Download className="h-4 w-4" /></Link>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="flex flex-1 items-center justify-center p-8">
                                        <div className="text-center text-muted-foreground">
                                            <FileText className="mx-auto mb-3 h-10 w-10" />
                                            <p className="text-sm">Aucun document</p>
                                            <p className="text-xs">Joignez des documents à ce courrier.</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                    <DialogContent>
                        <DialogHeader><DialogTitle className="flex items-center gap-2 text-destructive"><Trash2 className="h-5 w-5" />Confirmer la suppression</DialogTitle></DialogHeader>
                        <p className="py-4">
                            Êtes-vous sûr de vouloir supprimer le courrier <strong>{courrier.numero}</strong> — <em>{courrier.objet}</em> ?
                            <br /><span className="text-sm text-destructive">Cette action est irréversible. Tous les documents et commentaires associés seront supprimés.</span>
                        </p>
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Annuler</Button>
                            <Button variant="destructive" onClick={() => router.delete(`/courriers/${courrier.id}`)}>Supprimer définitivement</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}