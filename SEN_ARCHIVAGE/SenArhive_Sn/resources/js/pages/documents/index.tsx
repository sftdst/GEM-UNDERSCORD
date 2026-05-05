import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Archive, FileText, Grid3X3, List, Loader2, Upload, Search, Filter, Download, Trash2, MoreHorizontal, Share2, ScanLine, Mail, Send, GitMerge, FolderOpen, ChevronRight, ChevronLeft, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { useState, useEffect, useMemo, useRef, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Document, Tag, Categorie, Dossier, Utilisateur } from '@/types/models';

interface Props {
    documents: {
        data: Document[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        q?: string;
        dossier_id?: string;
        categorie_id?: string;
        extension?: string;
        statut?: string;
        numero_document?: string;
        date_document?: string;
    };
    tags: Tag[];
    categories: Categorie[];
    dossiers: Dossier[];
    utilisateurs: Utilisateur[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Documents', href: '/documents' },
];

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function extensionColor(ext: string): string {
    const colors: Record<string, string> = {
        pdf: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
        doc: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
        docx: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
        xls: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
        xlsx: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
        jpg: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
        png: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    };
    return colors[ext?.toLowerCase()] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
}

function getDossierPath(dossierId: string | null, dossiers: Dossier[]): Dossier[] {
    if (!dossierId) return [];
    const path: Dossier[] = [];
    let current = dossiers.find((d) => d.id === dossierId);
    while (current) {
        path.unshift(current);
        current = current.parent_id ? dossiers.find((d) => d.id === current!.parent_id) : undefined;
    }
    return path;
}

function getPageNumbers(current: number, last: number): (number | '...')[] {
    if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (current > 3) pages.push('...');
    for (let p = Math.max(2, current - 1); p <= Math.min(last - 1, current + 1); p++) {
        pages.push(p);
    }
    if (current < last - 2) pages.push('...');
    pages.push(last);
    return pages;
}

export default function DocumentsIndex({ documents, filters, categories, dossiers, utilisateurs }: Props) {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [searchQuery, setSearchQuery] = useState(filters.q ?? '');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(
        !!(filters.numero_document || filters.date_document || filters.dossier_id || filters.categorie_id || filters.extension || filters.statut)
    );
    const [filterNumero, setFilterNumero] = useState(filters.numero_document ?? '');
    const [filterDate, setFilterDate] = useState(filters.date_document ?? '');
    const [filterDossier, setFilterDossier] = useState(filters.dossier_id ?? '');
    const [filterCategorie, setFilterCategorie] = useState(filters.categorie_id ?? '');
    const [filterExtension, setFilterExtension] = useState(filters.extension ?? '');
    const [filterStatut, setFilterStatut] = useState(filters.statut ?? '');
    const [showUpload, setShowUpload] = useState(false);
    const [showBulkUpload, setShowBulkUpload] = useState(false);
    const [showScan, setShowScan] = useState(false);
    const [showShare, setShowShare] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isCompressing, setIsCompressing] = useState(false);
    const [showEmail, setShowEmail] = useState(false);
    const [emailDocId, setEmailDocId] = useState<string | null>(null);

    // Sélecteur de dossier en cascade (formulaire d'ajout)
    const [folderPath, setFolderPath] = useState<string[]>([]);
    const [isSuggestingNumero, setIsSuggestingNumero] = useState(false);
    const [numeroManuallyEdited, setNumeroManuallyEdited] = useState(false);

    const rootFolders = useMemo(
        () => (dossiers ?? []).filter((d) => !d.parent_id),
        [dossiers]
    );

    const today = new Date().toISOString().split('T')[0];

    const uploadForm = useForm<{
        fichier: File | null;
        titre: string;
        numero_document: string;
        date_document: string;
        description: string;
        date_archivage: string;
        dossier_id: string;
        categorie_id: string;
    }>({
        fichier: null,
        titre: '',
        numero_document: '',
        date_document: '',
        description: '',
        date_archivage: today,
        dossier_id: '',
        categorie_id: '',
    });

    // Ref toujours à jour vers le form courant (évite les closures obsolètes dans async)
    const uploadFormRef = useRef(uploadForm);
    uploadFormRef.current = uploadForm;

    function getFolderChildren(parentId: string) {
        return (dossiers ?? []).filter((d) => d.parent_id === parentId);
    }

    async function fetchSuggestedNumero(dossierId: string) {
        if (!dossierId) return;
        setIsSuggestingNumero(true);
        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
            const res = await fetch(`/documents/suggest-numero?dossier_id=${encodeURIComponent(dossierId)}`, {
                credentials: 'same-origin',
                headers: { 'X-CSRF-TOKEN': csrfToken, Accept: 'application/json' },
            });
            if (res.ok) {
                const json = await res.json();
                if (json.numero) {
                    uploadFormRef.current.setData('numero_document', json.numero);
                }
            }
        } catch {
            // silencieux
        } finally {
            setIsSuggestingNumero(false);
        }
    }

    function selectRootFolder(v: string) {
        setFolderPath(v ? [v] : []);
        uploadFormRef.current.setData('dossier_id', v);
        if (v && !numeroManuallyEdited) {
            void fetchSuggestedNumero(v);
        } else if (!v && !numeroManuallyEdited) {
            uploadFormRef.current.setData('numero_document', '');
        }
    }

    function selectSubFolder(level: number, parentId: string, v: string) {
        if (v) {
            setFolderPath([...folderPath.slice(0, level + 1), v]);
            uploadFormRef.current.setData('dossier_id', v);
            if (!numeroManuallyEdited) void fetchSuggestedNumero(v);
        } else {
            setFolderPath(folderPath.slice(0, level + 1));
            uploadFormRef.current.setData('dossier_id', parentId);
            if (!numeroManuallyEdited) void fetchSuggestedNumero(parentId);
        }
    }

    const emailForm = useForm({ destinataire: '', message: '' });

    function openEmailDialog(docId: string) {
        setEmailDocId(docId);
        setShowEmail(true);
    }

    function submitEmail(e: React.FormEvent) {
        e.preventDefault();
        if (!emailDocId) return;
        emailForm.post(`/documents/${emailDocId}/email`, {
            preserveScroll: true,
            onSuccess: () => {
                setShowEmail(false);
                setEmailDocId(null);
                emailForm.reset();
            },
        });
    }
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();

    useEffect(() => {
        if (props.flash?.success) toast.success(props.flash.success);
        if (props.flash?.error) toast.error(props.flash.error);
    }, [props.flash]);

    const scanForm = useForm<{
        fichier: File | null;
        titre: string;
        description: string;
        dossier_id: string;
        categorie_id: string;
    }>({
        fichier: null,
        titre: '',
        description: '',
        dossier_id: '',
        categorie_id: '',
    });

    const shareForm = useForm<{
        document_ids: string[];
        peut_telecharger: string;
        type_acces: 'public' | 'restreint';
        utilisateur_ids: string[];
        expire_le: string;
        max_telechargements: string;
        mot_de_passe: string;
    }>({
        document_ids: [],
        peut_telecharger: 'true',
        type_acces: 'public',
        utilisateur_ids: [],
        expire_le: '',
        max_telechargements: '',
        mot_de_passe: '',
    });

    function toggleSelection(id: string) {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    }

    function toggleSelectAll() {
        if (selectedIds.length === documents.data.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(documents.data.map((d) => d.id));
        }
    }

    async function handleBulkDownload() {
        if (isCompressing || selectedIds.length === 0) return;
        setIsCompressing(true);
        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
            const res = await fetch('/documents/bulk-download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    Accept: 'application/zip, application/octet-stream',
                },
                body: JSON.stringify({ document_ids: selectedIds }),
            });
            if (!res.ok) {
                toast.error('Erreur lors de la compression des fichiers.');
                return;
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const disposition = res.headers.get('Content-Disposition') ?? '';
            const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            a.download = match ? match[1].replace(/['"]/g, '') : `documents_${Date.now()}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setSelectedIds([]);
            toast.success('Archive ZIP téléchargée avec succès.');
        } catch {
            toast.error('Erreur réseau lors de la compression.');
        } finally {
            setIsCompressing(false);
        }
    }

    function openShare() {
        shareForm.setData('document_ids', selectedIds);
        setShowShare(true);
    }

    function handleShare(e: FormEvent) {
        e.preventDefault();
        shareForm.post('/partage/bulk', {
            onSuccess: () => {
                setShowShare(false);
                setSelectedIds([]);
                shareForm.reset();
            },
        });
    }

    // ── Fusion documents ─────────────────────────────────────────────────────────
    const [showFusion, setShowFusion] = useState(false);
    const fusionForm = useForm({ titre: '', description: '', document_ids: [] as string[], dossier_id: '' });

    const selectedDocs = useMemo(
        () => documents.data.filter((d) => selectedIds.includes(d.id)),
        [documents.data, selectedIds]
    );

    const selectedExtensions = useMemo(
        () => [...new Set(selectedDocs.map((d) => d.extension?.toLowerCase()))],
        [selectedDocs]
    );

    // Groupement des documents par dossier (clé = dossier_id ou '__none__')
    const groupedDocs = useMemo(() => {
        const groups = new Map<string, Document[]>();
        for (const doc of documents.data) {
            const key = doc.dossier_id ?? '__none__';
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(doc);
        }
        return groups;
    }, [documents.data]);

    // Groupes pliés (Set des clés de groupe repliés)
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

    function toggleGroup(key: string) {
        setCollapsedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    }

    function collapseAll() {
        setCollapsedGroups(new Set(groupedDocs.keys()));
    }

    function expandAll() {
        setCollapsedGroups(new Set());
    }

    function goToPage(page: number) {
        const params: Record<string, string> = { page: String(page) };
        if (searchQuery) params.q = searchQuery;
        if (filterNumero) params.numero_document = filterNumero;
        if (filterDate) params.date_document = filterDate;
        if (filterDossier) params.dossier_id = filterDossier;
        if (filterCategorie) params.categorie_id = filterCategorie;
        if (filterExtension) params.extension = filterExtension;
        if (filterStatut) params.statut = filterStatut;
        router.get('/documents', params, { preserveState: true });
    }

    const canFuse = selectedIds.length >= 2 && selectedExtensions.length === 1
        && ['pdf', 'txt', 'csv', 'log', 'md'].includes(selectedExtensions[0] ?? '');

    function openFusion() {
        fusionForm.setData('document_ids', selectedIds);
        fusionForm.setData('titre', '');
        fusionForm.setData('description', '');
        fusionForm.setData('dossier_id', selectedDocs[0]?.dossier_id ?? '');
        setShowFusion(true);
    }

    function submitFusion(e: FormEvent) {
        e.preventDefault();
        fusionForm.post('/documents/fusion', {
            onSuccess: () => { setShowFusion(false); setSelectedIds([]); fusionForm.reset(); },
        });
    }

    function handleScan(e: FormEvent) {
        e.preventDefault();
        scanForm.post('/documents/scan', {
            forceFormData: true,
            onSuccess: () => {
                setShowScan(false);
                scanForm.reset();
            },
        });
    }

    function handleSearch(e: FormEvent) {
        e.preventDefault();
        const params: Record<string, string> = {};
        if (searchQuery) params.q = searchQuery;
        if (filterNumero) params.numero_document = filterNumero;
        if (filterDate) params.date_document = filterDate;
        if (filterDossier) params.dossier_id = filterDossier;
        if (filterCategorie) params.categorie_id = filterCategorie;
        if (filterExtension) params.extension = filterExtension;
        if (filterStatut) params.statut = filterStatut;
        router.get('/documents', params, { preserveState: true });
    }

    function clearFilters() {
        setSearchQuery('');
        setFilterNumero('');
        setFilterDate('');
        setFilterDossier('');
        setFilterCategorie('');
        setFilterExtension('');
        setFilterStatut('');
        router.get('/documents', {}, { preserveState: false });
    }

    function handleUpload(e: FormEvent) {
        e.preventDefault();
        uploadForm.post('/documents', {
            forceFormData: true,
            onSuccess: () => {
                setShowUpload(false);
                setFolderPath([]);
                setNumeroManuallyEdited(false);
                uploadForm.reset();
            },
        });
    }

    const bulkForm = useForm<{ fichiers: File[]; dossier_id: string; categorie_id: string }>({
        fichiers: [],
        dossier_id: '',
        categorie_id: '',
    });

    function handleBulkUpload(e: FormEvent) {
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
            <Head title="Documents" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:p-6">
                {/* Toolbar */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <form onSubmit={handleSearch} className="flex flex-col gap-2 flex-1">
                        <div className="flex gap-2 max-w-2xl">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Rechercher des documents..."
                                    className="pl-9"
                                />
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                title="Filtres avancés"
                                onClick={() => setShowAdvancedFilters((v) => !v)}
                                className={showAdvancedFilters ? 'bg-accent' : ''}
                            >
                                <Filter className="h-4 w-4" />
                            </Button>
                            <Button type="submit" variant="default" size="sm">
                                <Search className="mr-1 h-4 w-4" />
                                Rechercher
                            </Button>
                            {(searchQuery || filterNumero || filterDate || filterDossier || filterCategorie || filterExtension || filterStatut) && (
                                <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                                    Effacer
                                </Button>
                            )}
                        </div>
                        {showAdvancedFilters && (
                            <div className="flex flex-wrap gap-3 rounded-lg border bg-muted/30 p-3">
                                <div className="flex flex-col gap-1 min-w-[180px]">
                                    <label className="text-xs font-medium text-muted-foreground">Numéro de document</label>
                                    <Input
                                        value={filterNumero}
                                        onChange={(e) => setFilterNumero(e.target.value)}
                                        placeholder="ex: DOC-2024-001"
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div className="flex flex-col gap-1 min-w-[160px]">
                                    <label className="text-xs font-medium text-muted-foreground">Date du document</label>
                                    <Input
                                        type="date"
                                        value={filterDate}
                                        onChange={(e) => setFilterDate(e.target.value)}
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div className="flex flex-col gap-1 min-w-[180px]">
                                    <label className="text-xs font-medium text-muted-foreground">Dossier</label>
                                    <Select
                                        value={filterDossier || '__all__'}
                                        onValueChange={(v) => setFilterDossier(v === '__all__' ? '' : v)}
                                    >
                                        <SelectTrigger className="h-8 text-sm">
                                            <SelectValue placeholder="Tous les dossiers" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__all__">Tous les dossiers</SelectItem>
                                            {dossiers?.map((d) => (
                                                <SelectItem key={d.id} value={d.id}>{d.nom}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-1 min-w-[160px]">
                                    <label className="text-xs font-medium text-muted-foreground">Catégorie</label>
                                    <Select
                                        value={filterCategorie || '__all__'}
                                        onValueChange={(v) => setFilterCategorie(v === '__all__' ? '' : v)}
                                    >
                                        <SelectTrigger className="h-8 text-sm">
                                            <SelectValue placeholder="Toutes" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__all__">Toutes</SelectItem>
                                            {categories?.map((c) => (
                                                <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-1 min-w-[120px]">
                                    <label className="text-xs font-medium text-muted-foreground">Extension</label>
                                    <Input
                                        value={filterExtension}
                                        onChange={(e) => setFilterExtension(e.target.value)}
                                        placeholder="ex: pdf, docx"
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div className="flex flex-col gap-1 min-w-[140px]">
                                    <label className="text-xs font-medium text-muted-foreground">Statut</label>
                                    <Select
                                        value={filterStatut || '__all__'}
                                        onValueChange={(v) => setFilterStatut(v === '__all__' ? '' : v)}
                                    >
                                        <SelectTrigger className="h-8 text-sm">
                                            <SelectValue placeholder="Tous" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__all__">Tous</SelectItem>
                                            <SelectItem value="actif">Actif</SelectItem>
                                            <SelectItem value="archive">Archivé</SelectItem>
                                            <SelectItem value="en_attente">En attente</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                    </form>

                    <div className="flex gap-2">
                        <div className="flex rounded-lg border">
                            <Button
                                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                                size="icon"
                                className="rounded-r-none"
                                onClick={() => setViewMode('list')}
                            >
                                <List className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                                size="icon"
                                className="rounded-l-none"
                                onClick={() => setViewMode('grid')}
                            >
                                <Grid3X3 className="h-4 w-4" />
                            </Button>
                        </div>

                        <Dialog open={showScan} onOpenChange={setShowScan}>
                            <DialogTrigger asChild>
                                <Button variant="outline">
                                    <ScanLine className="mr-2 h-4 w-4" />
                                    Scanner (OCR)
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>Scanner un document (OCR)</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleScan} className="space-y-4">
                                    <div>
                                        <Label htmlFor="scan-fichier">Image ou PDF a scanner</Label>
                                        <Input
                                            id="scan-fichier"
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.tiff,.bmp,.gif,.pdf"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0] ?? null;
                                                scanForm.setData('fichier', file);
                                                if (file && !scanForm.data.titre) {
                                                    scanForm.setData('titre', file.name.replace(/\.[^/.]+$/, ''));
                                                }
                                            }}
                                            className="mt-1"
                                        />
                                        {scanForm.errors.fichier && (
                                            <p className="mt-1 text-sm text-destructive">{scanForm.errors.fichier}</p>
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor="scan-titre">Titre</Label>
                                        <Input
                                            id="scan-titre"
                                            value={scanForm.data.titre}
                                            onChange={(e) => scanForm.setData('titre', e.target.value)}
                                            className="mt-1"
                                        />
                                        {scanForm.errors.titre && (
                                            <p className="mt-1 text-sm text-destructive">{scanForm.errors.titre}</p>
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor="scan-description">Description</Label>
                                        <Input
                                            id="scan-description"
                                            value={scanForm.data.description}
                                            onChange={(e) => scanForm.setData('description', e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Dossier</Label>
                                            <Select
                                                value={scanForm.data.dossier_id}
                                                onValueChange={(v) => scanForm.setData('dossier_id', v)}
                                            >
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue placeholder="Aucun" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {dossiers?.map((d) => (
                                                        <SelectItem key={d.id} value={d.id}>{d.nom}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Categorie</Label>
                                            <Select
                                                value={scanForm.data.categorie_id}
                                                onValueChange={(v) => scanForm.setData('categorie_id', v)}
                                            >
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue placeholder="Aucune" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories?.map((c) => (
                                                        <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <Button type="submit" disabled={scanForm.processing || !scanForm.data.fichier} className="w-full">
                                        {scanForm.processing ? 'Traitement OCR en cours...' : 'Scanner et importer'}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={showBulkUpload} onOpenChange={setShowBulkUpload}>
                            <DialogTrigger asChild>
                                <Button variant="outline">
                                    <Upload className="mr-2 h-4 w-4" />
                                    Importer plusieurs
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>Importer plusieurs documents</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleBulkUpload} className="space-y-4">
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
                                                {bulkForm.data.fichiers.length} fichier(s) selectionne(s)
                                            </p>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Dossier</Label>
                                            <Select
                                                value={bulkForm.data.dossier_id}
                                                onValueChange={(v) => bulkForm.setData('dossier_id', v)}
                                            >
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue placeholder="Aucun" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {dossiers?.map((d) => (
                                                        <SelectItem key={d.id} value={d.id}>{d.nom}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Categorie</Label>
                                            <Select
                                                value={bulkForm.data.categorie_id}
                                                onValueChange={(v) => bulkForm.setData('categorie_id', v)}
                                            >
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue placeholder="Aucune" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories?.map((c) => (
                                                        <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <Button type="submit" disabled={bulkForm.processing || bulkForm.data.fichiers.length === 0} className="w-full">
                                        {bulkForm.processing ? 'Import en cours...' : 'Importer'}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={showUpload} onOpenChange={(v) => { setShowUpload(v); if (!v) { setFolderPath([]); setNumeroManuallyEdited(false); uploadForm.reset(); } }}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Ajouter
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>Ajouter un document</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleUpload} className="space-y-4">
                                    <div>
                                        <Label htmlFor="fichier">Fichier</Label>
                                        <Input
                                            id="fichier"
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
                                        <Label htmlFor="titre">Nom du document <span className="text-destructive">*</span></Label>
                                        <Input
                                            id="titre"
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
                                            <Label htmlFor="numero_document">
                                                Numéro de document
                                                {isSuggestingNumero && (
                                                    <span className="ml-2 text-xs text-muted-foreground">génération...</span>
                                                )}
                                                {!isSuggestingNumero && uploadForm.data.numero_document && !numeroManuallyEdited && (
                                                    <span className="ml-2 text-xs text-blue-500">suggéré</span>
                                                )}
                                            </Label>
                                            <Input
                                                id="numero_document"
                                                value={uploadForm.data.numero_document}
                                                onChange={(e) => {
                                                    setNumeroManuallyEdited(true);
                                                    uploadForm.setData('numero_document', e.target.value);
                                                }}
                                                placeholder="Ex : DOC-2024-001"
                                                className="mt-1"
                                            />
                                            {uploadForm.errors.numero_document && (
                                                <p className="mt-1 text-sm text-destructive">{uploadForm.errors.numero_document}</p>
                                            )}
                                        </div>
                                        <div>
                                            <Label htmlFor="date_document">Date du document</Label>
                                            <Input
                                                id="date_document"
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
                                        <Label htmlFor="description">Description</Label>
                                        <Input
                                            id="description"
                                            value={uploadForm.data.description}
                                            onChange={(e) => uploadForm.setData('description', e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="date_archivage">Délai d'archivage</Label>
                                        <Input
                                            id="date_archivage"
                                            type="date"
                                            value={uploadForm.data.date_archivage}
                                            onChange={(e) => uploadForm.setData('date_archivage', e.target.value)}
                                            className="mt-1"
                                        />
                                        {uploadForm.errors.date_archivage && (
                                            <p className="mt-1 text-sm text-destructive">{uploadForm.errors.date_archivage}</p>
                                        )}
                                    </div>
                                    {/* Sélection dossier en cascade */}
                                    <div className="space-y-2">
                                        <div>
                                            <Label>Dossier</Label>
                                            <Select
                                                value={folderPath[0] ?? ''}
                                                onValueChange={(v) => selectRootFolder(v)}
                                            >
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue placeholder="Aucun dossier" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {rootFolders.map((d) => (
                                                        <SelectItem key={d.id} value={d.id}>{d.nom}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {folderPath.map((parentId, level) => {
                                            const children = getFolderChildren(parentId);
                                            if (children.length === 0) return null;
                                            const parentName = dossiers?.find((d) => d.id === parentId)?.nom ?? '';
                                            return (
                                                <div key={`level-${level + 1}`}>
                                                    <Label className="text-xs text-muted-foreground">
                                                        Sous-dossier de «&nbsp;{parentName}&nbsp;»
                                                    </Label>
                                                    <Select
                                                        value={folderPath[level + 1] ?? ''}
                                                        onValueChange={(v) => selectSubFolder(level, parentId, v)}
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
                                            value={uploadForm.data.categorie_id}
                                            onValueChange={(v) => uploadForm.setData('categorie_id', v)}
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Aucune" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories?.map((c) => (
                                                    <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button type="submit" disabled={uploadForm.processing} className="w-full">
                                        {uploadForm.processing ? 'Envoi en cours...' : 'Envoyer'}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Selection Toolbar */}
                {selectedIds.length > 0 && (
                    <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
                        <Checkbox
                            checked={selectedIds.length === documents.data.length}
                            onCheckedChange={toggleSelectAll}
                        />
                        <span className="text-sm font-medium">
                            {selectedIds.length} document{selectedIds.length > 1 ? 's' : ''} selectionne{selectedIds.length > 1 ? 's' : ''}
                        </span>
                        <Button size="sm" variant="outline" onClick={handleBulkDownload} disabled={isCompressing}>
                            {isCompressing ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Archive className="mr-2 h-4 w-4" />
                            )}
                            {isCompressing ? 'Compression...' : 'Compresser en ZIP'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={openShare}>
                            <Share2 className="mr-2 h-4 w-4" />
                            Partager la selection
                        </Button>
                        {canFuse && (
                            <Button size="sm" variant="outline" onClick={openFusion} className="border-violet-300 text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-400">
                                <GitMerge className="mr-2 h-4 w-4" />
                                Fusionner ({selectedExtensions[0]?.toUpperCase()})
                            </Button>
                        )}
                        {selectedIds.length >= 2 && !canFuse && selectedExtensions.length > 1 && (
                            <span className="text-xs text-muted-foreground">Même type requis pour fusionner</span>
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
                            <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground max-h-32 overflow-y-auto">
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
                            <div>
                                <Label>Dossier de destination</Label>
                                <Select
                                    value={fusionForm.data.dossier_id}
                                    onValueChange={(v) => fusionForm.setData('dossier_id', v)}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Aucun dossier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {dossiers?.map((d) => (
                                            <SelectItem key={d.id} value={d.id}>{d.nom}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Les documents sources ne seront pas supprimés.
                            </p>
                            <Button type="submit" disabled={fusionForm.processing || !fusionForm.data.titre} className="w-full">
                                {fusionForm.processing ? 'Fusion en cours...' : 'Fusionner les documents'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Documents List/Grid */}
                {documents.data.length > 0 ? (
                    viewMode === 'list' ? (
                        <div className="space-y-4">
                            {/* Boutons Tout plier / Tout déplier */}
                            {groupedDocs.size > 1 && (
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={expandAll}>
                                        <ChevronDown className="mr-1 h-3 w-3" />
                                        Tout déplier
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={collapseAll}>
                                        <ChevronsUpDown className="mr-1 h-3 w-3" />
                                        Tout plier
                                    </Button>
                                </div>
                            )}
                            {Array.from(groupedDocs.entries()).map(([groupKey, docs]) => {
                                const path = groupKey === '__none__'
                                    ? []
                                    : getDossierPath(groupKey, dossiers ?? []);
                                const isCollapsed = collapsedGroups.has(groupKey);
                                return (
                                    <div key={groupKey} className="rounded-lg border overflow-hidden">
                                        {/* En-tête de rupture cliquable */}
                                        <button
                                            type="button"
                                            onClick={() => toggleGroup(groupKey)}
                                            className="flex w-full items-center gap-2 bg-muted/40 px-3 py-2 border-b hover:bg-muted/70 transition-colors text-left"
                                        >
                                            <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} />
                                            <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                                            {path.length === 0 ? (
                                                <span className="text-sm font-medium text-muted-foreground italic">Sans dossier</span>
                                            ) : (
                                                <div className="flex items-center gap-1 text-sm font-medium flex-wrap">
                                                    {path.map((d, i) => (
                                                        <span key={d.id} className="flex items-center gap-1">
                                                            {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
                                                            <span className={i === path.length - 1 ? 'text-foreground font-semibold' : 'text-muted-foreground'}>
                                                                {d.nom}
                                                            </span>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <Badge variant="secondary" className="ml-auto shrink-0 text-xs">
                                                {docs.length} doc{docs.length > 1 ? 's' : ''}
                                            </Badge>
                                        </button>
                                        {/* Lignes documents (masquées si plié) */}
                                        {!isCollapsed && <div className="divide-y">
                                            {docs.map((doc) => (
                                                <div
                                                    key={doc.id}
                                                    className="flex items-center justify-between p-3 transition-colors hover:bg-accent"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <Checkbox
                                                            checked={selectedIds.includes(doc.id)}
                                                            onCheckedChange={() => toggleSelection(doc.id)}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <Link href={`/documents/${doc.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                                                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${extensionColor(doc.extension)}`}>
                                                                {doc.extension?.toUpperCase()}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="truncate font-medium">{doc.titre}</p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {doc.numero_document && (
                                                                        <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded mr-1">{doc.numero_document}</span>
                                                                    )}
                                                                    {doc.taille_formatee} &middot; v{doc.version_courante}
                                                                    {doc.createur && ` · ${doc.createur.prenom} ${doc.createur.nom}`}
                                                                    {doc.date_document && ` · ${formatDate(doc.date_document)}`}
                                                                </p>
                                                            </div>
                                                        </Link>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {doc.tags?.map((tag) => (
                                                            <Badge key={tag.id} variant="outline" style={{ borderColor: tag.couleur ?? undefined }}>
                                                                {tag.nom}
                                                            </Badge>
                                                        ))}
                                                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                                                            {doc.created_at && formatDate(doc.created_at)}
                                                        </span>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem asChild>
                                                                    <a href={`/documents/${doc.id}/download`}>
                                                                        <Download className="mr-2 h-4 w-4" />
                                                                        Telecharger
                                                                    </a>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        openEmailDialog(doc.id);
                                                                    }}
                                                                >
                                                                    <Mail className="mr-2 h-4 w-4" />
                                                                    Envoyer par email
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="text-destructive"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        router.delete(`/documents/${doc.id}`);
                                                                    }}
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Supprimer
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Array.from(groupedDocs.entries()).map(([groupKey, docs]) => {
                                const path = groupKey === '__none__'
                                    ? []
                                    : getDossierPath(groupKey, dossiers ?? []);
                                return (
                                    <div key={groupKey}>
                                        {/* En-tête de rupture */}
                                        <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                                            <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                                            {path.length === 0 ? (
                                                <span className="text-sm font-medium text-muted-foreground italic">Sans dossier</span>
                                            ) : (
                                                <div className="flex items-center gap-1 text-sm font-medium flex-wrap">
                                                    {path.map((d, i) => (
                                                        <span key={d.id} className="flex items-center gap-1">
                                                            {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
                                                            <span className={i === path.length - 1 ? 'text-foreground font-semibold' : 'text-muted-foreground'}>
                                                                {d.nom}
                                                            </span>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <Badge variant="secondary" className="ml-auto shrink-0 text-xs">
                                                {docs.length} doc{docs.length > 1 ? 's' : ''}
                                            </Badge>
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                            {docs.map((doc) => (
                                                <div key={doc.id} className="relative">
                                                    <div className="absolute top-2 left-2 z-10">
                                                        <Checkbox
                                                            checked={selectedIds.includes(doc.id)}
                                                            onCheckedChange={() => toggleSelection(doc.id)}
                                                        />
                                                    </div>
                                                    <Link href={`/documents/${doc.id}`}>
                                                        <Card className="transition-colors hover:bg-accent">
                                                            <CardContent className="p-4">
                                                                <div className={`mb-3 flex h-20 items-center justify-center rounded-lg text-lg font-bold ${extensionColor(doc.extension)}`}>
                                                                    {doc.extension?.toUpperCase()}
                                                                </div>
                                                                <h3 className="truncate font-medium">{doc.titre}</h3>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {doc.taille_formatee} &middot; v{doc.version_courante}
                                                                </p>
                                                                <div className="mt-2 flex flex-wrap gap-1">
                                                                    {doc.tags?.slice(0, 3).map((tag) => (
                                                                        <Badge key={tag.id} variant="outline" className="text-xs">
                                                                            {tag.nom}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    </Link>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                ) : (
                    <div className="flex flex-1 items-center justify-center">
                        <div className="text-center">
                            <FileText className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
                            <h3 className="text-lg font-medium">Aucun document</h3>
                            <p className="mt-1 text-muted-foreground">
                                {filters.q ? 'Aucun resultat pour votre recherche.' : 'Commencez par ajouter un document.'}
                            </p>
                            <Button className="mt-4" onClick={() => setShowUpload(true)}>
                                <Upload className="mr-2 h-4 w-4" />
                                Ajouter un document
                            </Button>
                        </div>
                    </div>
                )}

                {/* Pagination */}
                {documents.total > 0 && (
                    <div className="flex flex-col items-center gap-2 pt-2 sm:flex-row sm:justify-between">
                        <p className="text-sm text-muted-foreground order-2 sm:order-1">
                            {documents.total} document{documents.total > 1 ? 's' : ''} au total
                            &nbsp;—&nbsp;Page {documents.current_page} sur {documents.last_page}
                        </p>
                        <div className="flex items-center gap-1 order-1 sm:order-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                disabled={documents.current_page <= 1}
                                onClick={() => goToPage(documents.current_page - 1)}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            {getPageNumbers(documents.current_page, documents.last_page).map((p, i) =>
                                p === '...' ? (
                                    <span key={`ellipsis-${i}`} className="px-1 text-sm text-muted-foreground select-none">…</span>
                                ) : (
                                    <Button
                                        key={p}
                                        variant={p === documents.current_page ? 'default' : 'outline'}
                                        size="icon"
                                        className="h-8 w-8 text-xs"
                                        onClick={() => goToPage(p as number)}
                                    >
                                        {p}
                                    </Button>
                                )
                            )}
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                disabled={documents.current_page >= documents.last_page}
                                onClick={() => goToPage(documents.current_page + 1)}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Dialog Partage */}
            <Dialog open={showShare} onOpenChange={setShowShare}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            Partager {selectedIds.length} document{selectedIds.length > 1 ? 's' : ''}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleShare} className="space-y-4">
                        {/* Type d'accès */}
                        <div>
                            <Label>Type d'acces</Label>
                            <Select
                                value={shareForm.data.type_acces}
                                onValueChange={(v: 'public' | 'restreint') => {
                                    shareForm.setData('type_acces', v);
                                    if (v === 'public') shareForm.setData('utilisateur_ids', []);
                                }}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="public">Public — tout le monde avec le lien</SelectItem>
                                    <SelectItem value="restreint">Restreint — utilisateurs identifies uniquement</SelectItem>
                                </SelectContent>
                            </Select>
                            {shareForm.data.type_acces === 'restreint' && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Seuls les utilisateurs selectionnes pourront acceder au document (connexion requise).
                                </p>
                            )}
                        </div>

                        {/* Sélection des utilisateurs (si restreint) */}
                        {shareForm.data.type_acces === 'restreint' && (
                            <div>
                                <Label>Utilisateurs autorises</Label>
                                <div className="mt-1 max-h-48 overflow-y-auto rounded-md border p-2 space-y-1">
                                    {utilisateurs.length === 0 ? (
                                        <p className="text-sm text-muted-foreground py-2 text-center">
                                            Aucun autre utilisateur dans l'organisation.
                                        </p>
                                    ) : (
                                        utilisateurs.map((u) => {
                                            const checked = shareForm.data.utilisateur_ids.includes(u.id);
                                            return (
                                                <label
                                                    key={u.id}
                                                    className="flex items-center gap-2 rounded px-2 py-1 cursor-pointer hover:bg-muted"
                                                >
                                                    <Checkbox
                                                        checked={checked}
                                                        onCheckedChange={(c) => {
                                                            const ids = shareForm.data.utilisateur_ids;
                                                            shareForm.setData(
                                                                'utilisateur_ids',
                                                                c ? [...ids, u.id] : ids.filter((i) => i !== u.id)
                                                            );
                                                        }}
                                                    />
                                                    <span className="text-sm">
                                                        {u.prenom} {u.nom}
                                                        <span className="ml-1 text-xs text-muted-foreground">{u.email}</span>
                                                    </span>
                                                </label>
                                            );
                                        })
                                    )}
                                </div>
                                {shareForm.data.utilisateur_ids.length > 0 && (
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {shareForm.data.utilisateur_ids.length} utilisateur{shareForm.data.utilisateur_ids.length > 1 ? 's' : ''} selectionne{shareForm.data.utilisateur_ids.length > 1 ? 's' : ''}
                                    </p>
                                )}
                            </div>
                        )}

                        <div>
                            <Label>Permission de telechargement</Label>
                            <Select
                                value={shareForm.data.peut_telecharger}
                                onValueChange={(v) => shareForm.setData('peut_telecharger', v)}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">Autoriser le telechargement</SelectItem>
                                    <SelectItem value="false">Consultation uniquement</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="share-expire">Date d'expiration (optionnel)</Label>
                            <Input
                                id="share-expire"
                                type="datetime-local"
                                value={shareForm.data.expire_le}
                                onChange={(e) => shareForm.setData('expire_le', e.target.value)}
                                className="mt-1"
                            />
                            {shareForm.errors.expire_le && (
                                <p className="mt-1 text-sm text-destructive">{shareForm.errors.expire_le}</p>
                            )}
                        </div>
                        <div>
                            <Label htmlFor="share-max">Limite de telechargements (optionnel)</Label>
                            <Input
                                id="share-max"
                                type="number"
                                min={1}
                                value={shareForm.data.max_telechargements}
                                onChange={(e) => shareForm.setData('max_telechargements', e.target.value)}
                                placeholder="Illimite"
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="share-pwd">Mot de passe (optionnel)</Label>
                            <Input
                                id="share-pwd"
                                type="password"
                                value={shareForm.data.mot_de_passe}
                                onChange={(e) => shareForm.setData('mot_de_passe', e.target.value)}
                                placeholder="Laisser vide pour aucun mot de passe"
                                className="mt-1"
                            />
                            {shareForm.errors.mot_de_passe && (
                                <p className="mt-1 text-sm text-destructive">{shareForm.errors.mot_de_passe}</p>
                            )}
                        </div>
                        <Button type="submit" disabled={shareForm.processing} className="w-full">
                            {shareForm.processing ? 'Creation des liens...' : `Creer ${selectedIds.length} lien${selectedIds.length > 1 ? 's' : ''} de partage`}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dialog Email */}
            <Dialog open={showEmail} onOpenChange={(open) => { setShowEmail(open); if (!open) emailForm.reset(); }}>
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
                            <textarea
                                placeholder="Ajoutez un message pour le destinataire..."
                                value={emailForm.data.message}
                                onChange={(e) => emailForm.setData('message', e.target.value)}
                                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                                rows={3}
                            />
                        </div>
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
        </AppLayout>
    );
}
