import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Download, FolderPlus, FolderOpen, FileText, Trash2, Search, X, Archive, QrCode, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Espace, Dossier, Document } from '@/types/models';

interface Props { espace: Espace; dossiers: Dossier[]; documents: Document[]; }

export default function EspaceShow({ espace, dossiers, documents }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Espaces', href: '/espaces' },
        { title: espace.nom, href: `/espaces/${espace.id}` },
    ];

    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();

    useEffect(() => {
        if (props.flash?.success) toast.success(props.flash.success);
        if (props.flash?.error) toast.error(props.flash.error);
    }, [props.flash]);

    // ── Filtres ─────────────────────────────────────────────────────────────────
    const [filterFolderNom, setFilterFolderNom] = useState('');
    const [filterDocNom, setFilterDocNom] = useState('');
    const [filterDocNumero, setFilterDocNumero] = useState('');
    const [filterDocDate, setFilterDocDate] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const filteredDossiers = useMemo(() =>
        dossiers.filter((d) => {
            if (filterFolderNom && !d.nom.toLowerCase().includes(filterFolderNom.toLowerCase())) return false;
            return true;
        }),
        [dossiers, filterFolderNom]
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

    const hasActiveFilter = filterFolderNom || filterDocNom || filterDocNumero || filterDocDate;

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
        setFilterFolderNom('');
        setFilterDocNom('');
        setFilterDocNumero('');
        setFilterDocDate('');
    }

    // ── QR Code impression ────────────────────────────────────────────────────────
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

    // ── Création dossier ──────────────────────────────────────────────────────────
    const [showCreate, setShowCreate] = useState(false);
    const form = useForm({ nom: '', description: '', espace_id: espace.id, parent_id: '' });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/dossiers', { onSuccess: () => { setShowCreate(false); form.reset(); } });
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

    // ── Sélection dossiers ───────────────────────────────────────────────────────
    const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
    const [isZipping, setIsZipping] = useState(false);

    function toggleFolderSelection(id: string) {
        setSelectedFolderIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
    }

    function toggleSelectAllFolders() {
        if (selectedFolderIds.length === filteredDossiers.length) {
            setSelectedFolderIds([]);
        } else {
            setSelectedFolderIds(filteredDossiers.map((d) => d.id));
        }
    }

    function handleBulkFolderDelete() {
        if (!confirm(`Supprimer ${selectedFolderIds.length} dossier(s) ? Cette action est irréversible.`)) return;
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={espace.nom} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/espaces"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: espace.couleur ?? '#ff7631' }}>
                            <FolderOpen className="h-5 w-5 text-white" />
                        </div>
                        <div><h1 className="text-2xl font-bold">{espace.nom}</h1>{espace.description && <p className="text-sm text-muted-foreground">{espace.description}</p>}</div>
                    </div>
                    <Dialog open={showCreate} onOpenChange={setShowCreate}>
                        <DialogTrigger asChild><Button><FolderPlus className="mr-2 h-4 w-4" />Nouveau dossier</Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Créer un dossier</DialogTitle></DialogHeader>
                            <form onSubmit={submit} className="space-y-4">
                                <div><Label>Nom</Label><Input value={form.data.nom} onChange={(e) => form.setData('nom', e.target.value)} className="mt-1" /></div>
                                <div><Label>Description</Label><Input value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} className="mt-1" /></div>
                                <Button type="submit" disabled={form.processing} className="w-full">Créer</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
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
                                <label className="text-xs font-medium text-muted-foreground">Nom du dossier</label>
                                <Input
                                    value={filterFolderNom}
                                    onChange={(e) => setFilterFolderNom(e.target.value)}
                                    placeholder="Rechercher un dossier..."
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div className="flex flex-col gap-1 min-w-[180px]">
                                <label className="text-xs font-medium text-muted-foreground">Nom du document</label>
                                <Input
                                    value={filterDocNom}
                                    onChange={(e) => setFilterDocNom(e.target.value)}
                                    placeholder="Rechercher un document..."
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
                        </div>
                    )}
                </div>

                {/* Toolbar sélection dossiers */}
                {selectedFolderIds.length > 0 && (
                    <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
                        <Checkbox
                            checked={selectedFolderIds.length === filteredDossiers.length}
                            onCheckedChange={toggleSelectAllFolders}
                        />
                        <span className="text-sm font-medium">
                            {selectedFolderIds.length} dossier{selectedFolderIds.length > 1 ? 's' : ''} sélectionné{selectedFolderIds.length > 1 ? 's' : ''}
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
                        <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
                            Annuler
                        </Button>
                    </div>
                )}

                {/* Dossiers */}
                {filteredDossiers.length > 0 && (
                    <div>
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="font-semibold">
                                Dossiers
                                {filterFolderNom && (
                                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                                        ({filteredDossiers.length} résultat{filteredDossiers.length > 1 ? 's' : ''})
                                    </span>
                                )}
                            </h2>
                            {filteredDossiers.length > 1 && (
                                <Button variant="ghost" size="sm" onClick={toggleSelectAllFolders}>
                                    {selectedFolderIds.length === filteredDossiers.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                                </Button>
                            )}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {filteredDossiers.map((d) => (
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
                                    {/* Boutons actions (ZIP + QR) */}
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
                                        <a
                                            href={`/dossiers/${d.id}/export`}
                                            download
                                            title="Télécharger en ZIP"
                                        >
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
                                                    <p className="text-xs text-muted-foreground">{d.documents_count ?? 0} documents</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Documents hors dossiers */}
                {filteredDocuments.length > 0 && (
                    <div>
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="font-semibold">
                                Documents (hors dossiers)
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
                                        <div className="min-w-0">
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
                {hasActiveFilter && filteredDossiers.length === 0 && filteredDocuments.length === 0 && (
                    <div className="flex flex-1 items-center justify-center text-center">
                        <div>
                            <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
                            <h3 className="text-lg font-medium">Aucun résultat</h3>
                            <p className="text-muted-foreground">Aucun élément ne correspond aux filtres appliqués.</p>
                            <Button variant="ghost" className="mt-2" onClick={clearFilters}>Effacer les filtres</Button>
                        </div>
                    </div>
                )}

                {/* État vide (espace vide) */}
                {!hasActiveFilter && dossiers.length === 0 && documents.length === 0 && (
                    <div className="flex flex-1 items-center justify-center text-center">
                        <div>
                            <FolderOpen className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
                            <h3 className="text-lg font-medium">Espace vide</h3>
                            <p className="text-muted-foreground">Commencez par créer un dossier.</p>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
