import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Download, FolderPlus, Upload, FolderOpen, FileText, Inbox, Trash2, Search, X, Archive, QrCode, Printer, GitMerge, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Espace, Dossier, Document, Categorie } from '@/types/models';

interface Props {
    dossier: Dossier & { espace: Espace };
    sousDossiers: Dossier[];
    documents: Document[];
    ancestors: Dossier[];
    categories: Categorie[];
}

export default function DossierShow({ dossier, sousDossiers, documents, ancestors, categories }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Espaces', href: '/espaces' },
        { title: dossier.espace.nom, href: `/espaces/${dossier.espace.id}` },
        ...ancestors.map((a) => ({ title: a.nom, href: `/dossiers/${a.id}` })),
        { title: dossier.nom, href: `/dossiers/${dossier.id}` },
    ];

    const backHref = dossier.parent_id
        ? `/dossiers/${dossier.parent_id}`
        : `/espaces/${dossier.espace_id}`;

    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();

    useEffect(() => {
        if (props.flash?.success) toast.success(props.flash.success);
        if (props.flash?.error) toast.error(props.flash.error);
    }, [props.flash]);

    // ── Filtres ─────────────────────────────────────────────────────────────────
    const [filterDocNom, setFilterDocNom] = useState('');
    const [filterDocNumero, setFilterDocNumero] = useState('');
    const [filterDocDate, setFilterDocDate] = useState('');
    const [filterFolderNom, setFilterFolderNom] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const filteredSousDossiers = useMemo(() =>
        sousDossiers.filter((d) => {
            if (filterFolderNom && !d.nom.toLowerCase().includes(filterFolderNom.toLowerCase())) return false;
            return true;
        }),
        [sousDossiers, filterFolderNom]
    );

    const filteredDocuments = useMemo(() =>
        documents.filter((doc) => {
            if (filterDocNom && !doc.titre.toLowerCase().includes(filterDocNom.toLowerCase())) return false;
            if (filterDocNumero && !(doc.numero_document ?? '').toLowerCase().includes(filterDocNumero.toLowerCase())) return false;
            if (filterDocDate && doc.date_document?.slice(0, 10) !== filterDocDate) return false;
            return true;
        }),
        [documents, filterDocNom, filterDocNumero, filterDocDate]
    );

    const hasActiveFilter = filterDocNom || filterDocNumero || filterDocDate || filterFolderNom;

    // ── Pagination documents ─────────────────────────────────────────────────────
    const DOCS_PER_PAGE = 20;
    const [docPage, setDocPage] = useState(1);

    useEffect(() => { setDocPage(1); }, [filterDocNom, filterDocNumero, filterDocDate]);

    const docLastPage = Math.max(1, Math.ceil(filteredDocuments.length / DOCS_PER_PAGE));
    const pagedDocuments = useMemo(() =>
        filteredDocuments.slice((docPage - 1) * DOCS_PER_PAGE, docPage * DOCS_PER_PAGE),
        [filteredDocuments, docPage]
    );

    function clearFilters() {
        setFilterDocNom('');
        setFilterDocNumero('');
        setFilterDocDate('');
        setFilterFolderNom('');
    }

    // ── Sélection documents ──────────────────────────────────────────────────────
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    function toggleSelection(id: string) {
        setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
    }

    function toggleSelectAll() {
        if (selectedIds.length === filteredDocuments.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredDocuments.map((d) => d.id));
        }
    }

    function handleBulkDownload() {
        router.post('/documents/bulk-download', { document_ids: selectedIds }, {
            onSuccess: () => setSelectedIds([]),
        });
    }

    // ── Fusion documents ─────────────────────────────────────────────────────────
    const [showFusion, setShowFusion] = useState(false);
    const fusionForm = useForm({ titre: '', description: '', document_ids: [] as string[], dossier_id: dossier.id });

    const selectedDocs = useMemo(() => documents.filter((d) => selectedIds.includes(d.id)), [documents, selectedIds]);

    const selectedExtensions = useMemo(() =>
        [...new Set(selectedDocs.map((d) => d.extension?.toLowerCase()))],
        [selectedDocs]
    );

    const canFuse = selectedIds.length >= 2 && selectedExtensions.length === 1
        && ['pdf', 'txt', 'csv', 'log', 'md'].includes(selectedExtensions[0] ?? '');

    function openFusion() {
        fusionForm.setData('document_ids', selectedIds);
        fusionForm.setData('titre', '');
        fusionForm.setData('description', '');
        setShowFusion(true);
    }

    function submitFusion(e: React.FormEvent) {
        e.preventDefault();
        fusionForm.post('/documents/fusion', {
            onSuccess: () => { setShowFusion(false); setSelectedIds([]); fusionForm.reset(); },
        });
    }

    // ── Sélection sous-dossiers ──────────────────────────────────────────────────
    const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
    const [isZipping, setIsZipping] = useState(false);

    function toggleFolderSelection(id: string) {
        setSelectedFolderIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
    }

    function toggleSelectAllFolders() {
        if (selectedFolderIds.length === filteredSousDossiers.length) {
            setSelectedFolderIds([]);
        } else {
            setSelectedFolderIds(filteredSousDossiers.map((d) => d.id));
        }
    }

    function handleBulkFolderDelete() {
        if (!confirm(`Supprimer ${selectedFolderIds.length} sous-dossier(s) ? Cette action est irréversible.`)) return;
        router.post('/dossiers/bulk-destroy', { ids: selectedFolderIds }, {
            onSuccess: () => setSelectedFolderIds([]),
        });
    }

    async function handleBulkFolderZip() {
        if (isZipping || selectedFolderIds.length === 0) return;
        setIsZipping(true);
        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
            const res = await fetch('/dossiers/bulk-export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    Accept: 'application/zip, application/octet-stream',
                },
                body: JSON.stringify({ ids: selectedFolderIds }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                toast.error((data as { error?: string }).error ?? 'Erreur lors de la compression.');
                return;
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const disposition = res.headers.get('Content-Disposition') ?? '';
            const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            a.download = match ? match[1].replace(/['"]/g, '') : `dossiers_${Date.now()}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success('Archive ZIP téléchargée avec succès.');
        } catch {
            toast.error('Erreur réseau lors de la compression.');
        } finally {
            setIsZipping(false);
        }
    }

    // ── Création sous-dossier ────────────────────────────────────────────────────
    const [showCreateFolder, setShowCreateFolder] = useState(false);
    const folderForm = useForm({
        nom: '',
        description: '',
        espace_id: dossier.espace_id ?? '',
        parent_id: dossier.id,
    });

    function submitFolder(e: React.FormEvent) {
        e.preventDefault();
        folderForm.post('/dossiers', {
            onSuccess: () => {
                setShowCreateFolder(false);
                folderForm.reset();
            },
        });
    }

    // ── Import document unique ───────────────────────────────────────────────────
    const [showUpload, setShowUpload] = useState(false);
    const today = new Date().toISOString().split('T')[0];

    const uploadForm = useForm<{
        fichier: File | null;
        titre: string;
        numero_document: string;
        date_document: string;
        description: string;
        date_archivage: string;
        categorie_id: string;
        dossier_id: string;
    }>({
        fichier: null,
        titre: '',
        numero_document: '',
        date_document: '',
        description: '',
        date_archivage: today,
        categorie_id: '',
        dossier_id: dossier.id,
    });

    function submitUpload(e: React.FormEvent) {
        e.preventDefault();
        uploadForm.post('/documents', {
            forceFormData: true,
            onSuccess: () => {
                setShowUpload(false);
                uploadForm.reset();
            },
        });
    }

    // ── QR Code ──────────────────────────────────────────────────────────────────
    const [showQr, setShowQr] = useState(false);
    const qrSrc = `/dossiers/${dossier.id}/qr`;

    function handlePrintQr(d: Dossier) {
        const win = window.open('', '_blank', 'width=520,height=640');
        if (!win) return;
        win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>QR Code — ${d.nom}</title>
<style>
  body{margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui,sans-serif;background:#fff;}
  img{width:280px;height:280px;}
  h2{margin:1rem 0 .25rem;font-size:1.1rem;color:#1e293b;}
  p{color:#64748b;font-size:.8rem;margin:0 0 .25rem;}
  @media print{button{display:none}}
  button{margin-top:1.5rem;padding:.5rem 1.5rem;background:#6366f1;color:#fff;border:none;border-radius:.5rem;cursor:pointer;font-size:.9rem;}
</style></head><body>
<img src="${window.location.origin}/dossiers/${d.id}/qr" alt="QR Code ${d.nom}" />
<h2>${d.nom}</h2>
<p>${d.chemin ?? ''}</p>
<p style="color:#94a3b8;font-size:.7rem;">SenArhive — Scannez ce QR code pour consulter ce dossier</p>
<button onclick="window.print()">Imprimer</button>
</body></html>`);
        win.document.close();
    }


    // ── Import multiple ──────────────────────────────────────────────────────────
    const [showBulkUpload, setShowBulkUpload] = useState(false);
    const bulkForm = useForm<{ fichiers: File[]; dossier_id: string }>({
        fichiers: [],
        dossier_id: dossier.id,
    });

    function submitBulkUpload(e: React.FormEvent) {
        e.preventDefault();
        bulkForm.post('/documents/bulk-upload', {
            forceFormData: true,
            onSuccess: () => {
                setShowBulkUpload(false);
                bulkForm.reset();
            },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={dossier.nom} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href={backHref}>
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <FolderOpen className="h-8 w-8 text-primary" />
                        <div>
                            <h1 className="text-2xl font-bold">{dossier.nom}</h1>
                            {dossier.description && (
                                <p className="text-sm text-muted-foreground">{dossier.description}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* QR Code */}
                        <Dialog open={showQr} onOpenChange={setShowQr}>
                            <DialogTrigger asChild>
                                <Button variant="outline">
                                    <QrCode className="mr-2 h-4 w-4" />
                                    QR Code
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-sm">
                                <DialogHeader>
                                    <DialogTitle>QR Code — {dossier.nom}</DialogTitle>
                                </DialogHeader>
                                <div className="flex flex-col items-center gap-4 py-2">
                                    <img
                                        src={qrSrc}
                                        alt={`QR Code ${dossier.nom}`}
                                        className="h-60 w-60 rounded-lg border bg-white p-2"
                                    />
                                    <p className="text-center text-xs text-muted-foreground">
                                        Scannez ce QR code pour consulter l'arborescence et les documents de ce dossier.
                                    </p>
                                    <Button onClick={() => handlePrintQr(dossier)} className="w-full">
                                        <Printer className="mr-2 h-4 w-4" />
                                        Imprimer le QR Code
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <a href={`/dossiers/${dossier.id}/export`} download>
                            <Button variant="outline">
                                <Download className="mr-2 h-4 w-4" />
                                Exporter ZIP
                            </Button>
                        </a>

                        {/* Créer sous-dossier */}
                        <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
                            <DialogTrigger asChild>
                                <Button variant="outline">
                                    <FolderPlus className="mr-2 h-4 w-4" />
                                    Sous-dossier
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Créer un sous-dossier</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={submitFolder} className="space-y-4">
                                    <div>
                                        <Label>Nom</Label>
                                        <Input
                                            value={folderForm.data.nom}
                                            onChange={(e) => folderForm.setData('nom', e.target.value)}
                                            className="mt-1"
                                        />
                                        {folderForm.errors.nom && (
                                            <p className="mt-1 text-sm text-destructive">{folderForm.errors.nom}</p>
                                        )}
                                    </div>
                                    <div>
                                        <Label>Description</Label>
                                        <Input
                                            value={folderForm.data.description}
                                            onChange={(e) => folderForm.setData('description', e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    <Button type="submit" disabled={folderForm.processing} className="w-full">
                                        Créer
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>

                        {/* Import document unique */}
                        <Dialog open={showUpload} onOpenChange={setShowUpload}>
                            <DialogTrigger asChild>
                                <Button variant="outline">
                                    <Upload className="mr-2 h-4 w-4" />
                                    1 document
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>Importer un document</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={submitUpload} className="space-y-4">
                                    <div>
                                        <Label>Fichier</Label>
                                        <Input
                                            type="file"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0] ?? null;
                                                uploadForm.setData('fichier', file);
                                                if (file && !uploadForm.data.titre) {
                                                    uploadForm.setData('titre', file.name.replace(/\.[^/.]+$/, ''));
                                                }
                                            }}
                                            className="mt-1"
                                        />
                                        {uploadForm.errors.fichier && (
                                            <p className="mt-1 text-sm text-destructive">{uploadForm.errors.fichier}</p>
                                        )}
                                    </div>
                                    <div>
                                        <Label>Nom du document <span className="text-destructive">*</span></Label>
                                        <Input
                                            value={uploadForm.data.titre}
                                            onChange={(e) => uploadForm.setData('titre', e.target.value)}
                                            placeholder="Ex : Contrat de service 2024"
                                            className="mt-1"
                                        />
                                        {uploadForm.errors.titre && (
                                            <p className="mt-1 text-sm text-destructive">{uploadForm.errors.titre}</p>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Numéro de document</Label>
                                            <Input
                                                value={uploadForm.data.numero_document}
                                                onChange={(e) => uploadForm.setData('numero_document', e.target.value)}
                                                placeholder="Ex : DOC-2024-001"
                                                className="mt-1"
                                            />
                                            {uploadForm.errors.numero_document && (
                                                <p className="mt-1 text-sm text-destructive">{uploadForm.errors.numero_document}</p>
                                            )}
                                        </div>
                                        <div>
                                            <Label>Date du document</Label>
                                            <Input
                                                type="date"
                                                value={uploadForm.data.date_document}
                                                onChange={(e) => uploadForm.setData('date_document', e.target.value)}
                                                className="mt-1"
                                            />
                                            {uploadForm.errors.date_document && (
                                                <p className="mt-1 text-sm text-destructive">{uploadForm.errors.date_document}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Description</Label>
                                        <Input
                                            value={uploadForm.data.description}
                                            onChange={(e) => uploadForm.setData('description', e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label>Délai d'archivage</Label>
                                        <Input
                                            type="date"
                                            value={uploadForm.data.date_archivage}
                                            onChange={(e) => uploadForm.setData('date_archivage', e.target.value)}
                                            className="mt-1"
                                        />
                                        {uploadForm.errors.date_archivage && (
                                            <p className="mt-1 text-sm text-destructive">{uploadForm.errors.date_archivage}</p>
                                        )}
                                    </div>
                                    {categories.length > 0 && (
                                        <div>
                                            <Label>Catégorie</Label>
                                            <Select
                                                value={uploadForm.data.categorie_id}
                                                onValueChange={(v) => uploadForm.setData('categorie_id', v)}
                                            >
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue placeholder="Aucune" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories.map((c) => (
                                                        <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                    <Button type="submit" disabled={uploadForm.processing} className="w-full">
                                        {uploadForm.processing ? 'Envoi en cours...' : 'Importer'}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>

                        {/* Import multiple */}
                        <Dialog open={showBulkUpload} onOpenChange={setShowBulkUpload}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Importer plusieurs
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Importer plusieurs documents</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={submitBulkUpload} className="space-y-4">
                                    <div>
                                        <Label>Fichiers (max 20)</Label>
                                        <Input
                                            type="file"
                                            multiple
                                            onChange={(e) => {
                                                const files = Array.from(e.target.files ?? []);
                                                bulkForm.setData('fichiers', files);
                                            }}
                                            className="mt-1"
                                        />
                                        {bulkForm.errors.fichiers && (
                                            <p className="mt-1 text-sm text-destructive">{bulkForm.errors.fichiers}</p>
                                        )}
                                        {bulkForm.data.fichiers.length > 0 && (
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {bulkForm.data.fichiers.length} fichier(s) sélectionné(s)
                                            </p>
                                        )}
                                    </div>
                                    <Button type="submit" disabled={bulkForm.processing || bulkForm.data.fichiers.length === 0} className="w-full">
                                        {bulkForm.processing ? 'Import en cours...' : 'Importer'}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* ── Barre de filtres ──────────────────────────────────────────────── */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowFilters((v) => !v)}
                            className={showFilters ? 'bg-accent' : ''}
                        >
                            <Search className="mr-2 h-4 w-4" />
                            Filtres
                        </Button>
                        {hasActiveFilter && (
                            <Button variant="ghost" size="sm" onClick={clearFilters}>
                                <X className="mr-1 h-4 w-4" />
                                Effacer les filtres
                            </Button>
                        )}
                    </div>
                    {showFilters && (
                        <div className="flex flex-wrap gap-3 rounded-lg border bg-muted/30 p-3">
                            <div className="flex flex-col gap-1 min-w-[180px]">
                                <label className="text-xs font-medium text-muted-foreground">Nom du document</label>
                                <Input
                                    value={filterDocNom}
                                    onChange={(e) => setFilterDocNom(e.target.value)}
                                    placeholder="Rechercher..."
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div className="flex flex-col gap-1 min-w-[180px]">
                                <label className="text-xs font-medium text-muted-foreground">Numéro de document</label>
                                <Input
                                    value={filterDocNumero}
                                    onChange={(e) => setFilterDocNumero(e.target.value)}
                                    placeholder="Ex : DOC-2024-001"
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div className="flex flex-col gap-1 min-w-[160px]">
                                <label className="text-xs font-medium text-muted-foreground">Date du document</label>
                                <Input
                                    type="date"
                                    value={filterDocDate}
                                    onChange={(e) => setFilterDocDate(e.target.value)}
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div className="flex flex-col gap-1 min-w-[180px]">
                                <label className="text-xs font-medium text-muted-foreground">Nom du sous-dossier</label>
                                <Input
                                    value={filterFolderNom}
                                    onChange={(e) => setFilterFolderNom(e.target.value)}
                                    placeholder="Rechercher..."
                                    className="h-8 text-sm"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Toolbar sélection sous-dossiers */}
                {selectedFolderIds.length > 0 && (
                    <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
                        <Checkbox
                            checked={selectedFolderIds.length === filteredSousDossiers.length}
                            onCheckedChange={toggleSelectAllFolders}
                        />
                        <span className="text-sm font-medium">
                            {selectedFolderIds.length} sous-dossier{selectedFolderIds.length > 1 ? 's' : ''} sélectionné{selectedFolderIds.length > 1 ? 's' : ''}
                        </span>
                        <Button size="sm" variant="outline" onClick={handleBulkFolderZip} disabled={isZipping}>
                            {isZipping ? (
                                <><span className="mr-2 h-4 w-4 animate-spin inline-block border-2 border-current border-t-transparent rounded-full" />Compression...</>
                            ) : (
                                <><Archive className="mr-2 h-4 w-4" />Compresser en ZIP</>
                            )}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={handleBulkFolderDelete}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setSelectedFolderIds([])}>
                            Annuler
                        </Button>
                    </div>
                )}

                {/* Toolbar sélection documents */}
                {selectedIds.length > 0 && (
                    <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
                        <Checkbox
                            checked={selectedIds.length === filteredDocuments.length}
                            onCheckedChange={toggleSelectAll}
                        />
                        <span className="text-sm font-medium">
                            {selectedIds.length} document{selectedIds.length > 1 ? 's' : ''} sélectionné{selectedIds.length > 1 ? 's' : ''}
                        </span>
                        <Button size="sm" variant="outline" onClick={handleBulkDownload}>
                            <Download className="mr-2 h-4 w-4" />
                            Télécharger la sélection
                        </Button>
                        {canFuse && (
                            <Button size="sm" variant="outline" onClick={openFusion} className="border-violet-300 text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-400">
                                <GitMerge className="mr-2 h-4 w-4" />
                                Fusionner ({selectedExtensions[0]?.toUpperCase()})
                            </Button>
                        )}
                        {selectedIds.length >= 2 && !canFuse && selectedExtensions.length > 1 && (
                            <span className="text-xs text-muted-foreground">Sélectionnez des documents de même type pour fusionner</span>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
                            Annuler
                        </Button>
                    </div>
                )}

                {/* Dialog Fusion */}
                <Dialog open={showFusion} onOpenChange={setShowFusion}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <GitMerge className="h-5 w-5 text-violet-600" />
                                Fusionner {selectedIds.length} documents ({selectedExtensions[0]?.toUpperCase()})
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={submitFusion} className="space-y-4">
                            <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                                {selectedDocs.map((d) => (
                                    <div key={d.id} className="flex items-center gap-2 py-0.5">
                                        <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                                        <span className="truncate">{d.titre}</span>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <Label>Titre du document fusionné <span className="text-destructive">*</span></Label>
                                <Input
                                    value={fusionForm.data.titre}
                                    onChange={(e) => fusionForm.setData('titre', e.target.value)}
                                    placeholder="Ex : Rapport consolidé 2024"
                                    className="mt-1"
                                />
                                {fusionForm.errors.titre && (
                                    <p className="mt-1 text-sm text-destructive">{fusionForm.errors.titre}</p>
                                )}
                            </div>
                            <div>
                                <Label>Description <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
                                <Input
                                    value={fusionForm.data.description}
                                    onChange={(e) => fusionForm.setData('description', e.target.value)}
                                    placeholder="Description du document fusionné"
                                    className="mt-1"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Le document fusionné sera placé dans le dossier actuel. Les documents sources ne seront pas supprimés.
                            </p>
                            <Button type="submit" disabled={fusionForm.processing || !fusionForm.data.titre} className="w-full">
                                {fusionForm.processing ? 'Fusion en cours...' : 'Fusionner les documents'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Sous-dossiers */}
                {filteredSousDossiers.length > 0 && (
                    <div>
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="font-semibold">
                                Sous-dossiers
                                {filterFolderNom && (
                                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                                        ({filteredSousDossiers.length} résultat{filteredSousDossiers.length > 1 ? 's' : ''})
                                    </span>
                                )}
                            </h2>
                            {filteredSousDossiers.length > 1 && (
                                <Button variant="ghost" size="sm" onClick={toggleSelectAllFolders}>
                                    {selectedFolderIds.length === filteredSousDossiers.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                                </Button>
                            )}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {filteredSousDossiers.map((d) => (
                                <div key={d.id} className="relative">
                                    <div
                                        className="absolute left-2 top-2 z-10"
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFolderSelection(d.id); }}
                                    >
                                        <Checkbox
                                            checked={selectedFolderIds.includes(d.id)}
                                            onCheckedChange={() => toggleFolderSelection(d.id)}
                                        />
                                    </div>
                                    {/* Boutons actions (QR + ZIP) */}
                                    <div
                                        className="absolute right-2 top-2 z-10 flex items-center gap-0.5"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            title="Imprimer le QR Code"
                                            onClick={(e) => { e.preventDefault(); handlePrintQr(d); }}
                                            className="flex h-7 w-7 items-center justify-center rounded hover:bg-muted"
                                        >
                                            <QrCode className="h-3.5 w-3.5 text-muted-foreground" />
                                        </button>
                                        <a href={`/dossiers/${d.id}/export`} download title="Télécharger en ZIP">
                                            <Button variant="ghost" size="icon" className="h-7 w-7">
                                                <Archive className="h-3.5 w-3.5" />
                                            </Button>
                                        </a>
                                    </div>
                                    <Link href={`/dossiers/${d.id}`}>
                                        <Card className={`transition-colors hover:bg-accent ${selectedFolderIds.includes(d.id) ? 'ring-2 ring-primary' : ''}`}>
                                            <CardContent className="flex items-center gap-3 p-4 pl-8 pr-16">
                                                <FolderOpen className="h-8 w-8 text-primary" />
                                                <div>
                                                    <p className="font-medium">{d.nom}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {d.documents_count ?? 0} documents
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Documents */}
                {filteredDocuments.length > 0 && (
                    <div>
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="font-semibold">
                                Documents
                                {(filterDocNom || filterDocNumero || filterDocDate) && (
                                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                                        ({filteredDocuments.length} résultat{filteredDocuments.length > 1 ? 's' : ''})
                                    </span>
                                )}
                            </h2>
                            {filteredDocuments.length > 1 && (
                                <Button variant="ghost" size="sm" onClick={toggleSelectAll}>
                                    {selectedIds.length === filteredDocuments.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                                </Button>
                            )}
                        </div>
                        <div className="space-y-2">
                            {pagedDocuments.map((doc) => (
                                <div
                                    key={doc.id}
                                    className={`flex items-center gap-3 rounded-lg border p-3 hover:bg-accent ${selectedIds.includes(doc.id) ? 'bg-accent' : ''}`}
                                >
                                    <Checkbox
                                        checked={selectedIds.includes(doc.id)}
                                        onCheckedChange={() => toggleSelection(doc.id)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <Link
                                        href={`/documents/${doc.id}`}
                                        className="flex items-center gap-3 flex-1 min-w-0"
                                    >
                                        <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium truncate">{doc.titre}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {doc.extension?.toUpperCase()} &middot; {doc.taille_formatee}
                                                {doc.numero_document && (
                                                    <> &middot; <span className="font-mono">{doc.numero_document}</span></>
                                                )}
                                                {doc.date_document && (
                                                    <> &middot; {new Date(doc.date_document).toLocaleDateString('fr-FR')}</>
                                                )}
                                            </p>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                        {/* Pagination documents */}
                        <div className="flex flex-col items-center gap-2 pt-3 sm:flex-row sm:justify-between">
                            <p className="text-sm text-muted-foreground order-2 sm:order-1">
                                {filteredDocuments.length} document{filteredDocuments.length > 1 ? 's' : ''}
                                &nbsp;—&nbsp;Page {docPage} sur {docLastPage}
                            </p>
                            <div className="flex items-center gap-1 order-1 sm:order-2">
                                <Button variant="outline" size="icon" className="h-8 w-8"
                                    disabled={docPage <= 1} onClick={() => setDocPage(p => p - 1)}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                {Array.from({ length: docLastPage }, (_, i) => i + 1).map(p => (
                                    <Button key={p} variant={p === docPage ? 'default' : 'outline'}
                                        size="icon" className="h-8 w-8 text-xs" onClick={() => setDocPage(p)}>
                                        {p}
                                    </Button>
                                ))}
                                <Button variant="outline" size="icon" className="h-8 w-8"
                                    disabled={docPage >= docLastPage} onClick={() => setDocPage(p => p + 1)}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Résultats vides après filtre */}
                {hasActiveFilter && filteredSousDossiers.length === 0 && filteredDocuments.length === 0 && (
                    <div className="flex flex-1 items-center justify-center text-center">
                        <div>
                            <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
                            <h3 className="text-lg font-medium">Aucun résultat</h3>
                            <p className="text-muted-foreground">Aucun élément ne correspond aux filtres appliqués.</p>
                            <Button variant="ghost" className="mt-2" onClick={clearFilters}>Effacer les filtres</Button>
                        </div>
                    </div>
                )}

                {/* État vide (dossier vide) */}
                {!hasActiveFilter && sousDossiers.length === 0 && documents.length === 0 && (
                    <div className="flex flex-1 items-center justify-center text-center">
                        <div>
                            <Inbox className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
                            <h3 className="text-lg font-medium">Dossier vide</h3>
                            <p className="text-muted-foreground">
                                Ajoutez un sous-dossier ou importez un document pour commencer.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
