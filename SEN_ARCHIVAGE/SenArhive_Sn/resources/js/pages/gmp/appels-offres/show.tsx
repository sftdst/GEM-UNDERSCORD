import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    CalendarDays,
    FileCheck2,
    FilePlus,
    Inbox,
    Megaphone,
    Pencil,
    Plus,
    Shield,
    Trash2,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

// ── Types ──────────────────────────────────────────────────────────────────────

interface PieceRequise {
    id: string;
    libelle: string;
    description: string | null;
    formats_acceptes: string | null;
    taille_max_mo: number;
    obligatoire: boolean;
    ordre: number;
}

interface Soumission {
    id: string;
    reference_soumission: string;
    date_depot: string;
    montant_offre_ht: string;
    statut: string;
    alerte_offre_anormale: boolean;
    fournisseur?: { id: string; raison_sociale: string };
}

interface AppelOffre {
    id: string;
    numero_aao: string;
    objet: string;
    statut: string;
    date_cloture: string | null;
    pieces_requises: PieceRequise[];
    soumissions: Soumission[];
}

interface Props { ao: AppelOffre }

// ── Constantes ─────────────────────────────────────────────────────────────────

const FORMATS_PREDEFINIS = [
    { label: 'PDF uniquement',           value: 'pdf' },
    { label: 'PDF + Word',               value: 'pdf,doc,docx' },
    { label: 'PDF + Excel',              value: 'pdf,xls,xlsx' },
    { label: 'PDF + Word + Excel',       value: 'pdf,doc,docx,xls,xlsx' },
    { label: 'Images (JPG/PNG)',         value: 'jpg,jpeg,png' },
    { label: 'Tous documents courants',  value: 'pdf,doc,docx,xls,xlsx,jpg,jpeg,png' },
];

const STATUTS_SOUM = [
    { value: 'deposee',      label: 'Déposée',      cls: 'bg-slate-50 text-slate-600 border-slate-200' },
    { value: 'conforme',     label: 'Conforme',     cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    { value: 'non_conforme', label: 'Non conforme', cls: 'bg-red-50 text-red-600 border-red-200' },
    { value: 'retenue',      label: 'Retenue',      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { value: 'eliminee',     label: 'Éliminée',     cls: 'bg-gray-100 text-gray-500 border-gray-200' },
];

function statutSoumCls(s: string) { return STATUTS_SOUM.find(x => x.value === s)?.cls ?? ''; }
function statutSoumLabel(s: string) { return STATUTS_SOUM.find(x => x.value === s)?.label ?? s; }

function fmtMontant(val: string) {
    const n = Number(val);
    if (!n) return '—';
    return new Intl.NumberFormat('fr-SN', { maximumFractionDigits: 0 }).format(n) + ' FCFA';
}

function fmtDate(val: string | null) {
    if (!val) return '—';
    return new Date(val).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Modal pièce requise ────────────────────────────────────────────────────────

interface PieceFormFields {
    libelle: string;
    description: string;
    formats_acceptes: string;
    taille_max_mo: string;
    obligatoire: boolean;
    ordre: string;
}

function PieceModal({
    aoId,
    piece,
    onClose,
}: {
    aoId: string;
    piece?: PieceRequise | null;
    onClose: () => void;
}) {
    const editing = !!piece;
    const { data, setData, post, put, processing, errors, reset } = useForm<PieceFormFields>({
        libelle:          piece?.libelle          ?? '',
        description:      piece?.description      ?? '',
        formats_acceptes: piece?.formats_acceptes ?? 'pdf',
        taille_max_mo:    String(piece?.taille_max_mo ?? 10),
        obligatoire:      piece?.obligatoire       ?? true,
        ordre:            String(piece?.ordre ?? 0),
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            put(`/gmp/appels-offres/${aoId}/pieces/${piece!.id}`, { onSuccess: () => { reset(); onClose(); } });
        } else {
            post(`/gmp/appels-offres/${aoId}/pieces`, { onSuccess: () => { reset(); onClose(); } });
        }
    }

    const sel = 'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring';

    return (
        <form onSubmit={submit} className="space-y-4">
            {/* Libellé */}
            <div className="space-y-1.5">
                <Label htmlFor="libelle">Libellé du document <span className="text-destructive">*</span></Label>
                <Input id="libelle" value={data.libelle} onChange={e => setData('libelle', e.target.value)} placeholder="Ex: Offre technique" autoFocus />
                {errors.libelle && <p className="text-xs text-destructive">{errors.libelle}</p>}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
                <Label htmlFor="description">Description / instructions</Label>
                <textarea
                    id="description"
                    rows={2}
                    value={data.description}
                    onChange={e => setData('description', e.target.value)}
                    placeholder="Précisions pour le soumissionnaire…"
                    className="flex min-h-[56px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
            </div>

            {/* Formats + Taille */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="formats_acceptes">Formats acceptés</Label>
                    <select id="formats_acceptes" value={data.formats_acceptes} onChange={e => setData('formats_acceptes', e.target.value)} className={sel}>
                        {FORMATS_PREDEFINIS.map(f => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                    </select>
                    <p className="text-[11px] text-muted-foreground">Valeur : <code className="font-mono">{data.formats_acceptes}</code></p>
                    {errors.formats_acceptes && <p className="text-xs text-destructive">{errors.formats_acceptes}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="taille_max_mo">Taille maximale (Mo) <span className="text-destructive">*</span></Label>
                    <Input id="taille_max_mo" type="number" min="1" max="500" value={data.taille_max_mo} onChange={e => setData('taille_max_mo', e.target.value)} />
                    {errors.taille_max_mo && <p className="text-xs text-destructive">{errors.taille_max_mo}</p>}
                </div>
            </div>

            {/* Obligatoire + Ordre */}
            <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2.5 pt-5">
                    <input
                        id="obligatoire"
                        type="checkbox"
                        checked={data.obligatoire}
                        onChange={e => setData('obligatoire', e.target.checked)}
                        className="h-4 w-4 rounded border-input accent-primary"
                    />
                    <Label htmlFor="obligatoire" className="cursor-pointer">
                        <span className="flex items-center gap-1.5">
                            <Shield className="h-3.5 w-3.5 text-primary" />
                            Document obligatoire
                        </span>
                    </Label>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="ordre">Ordre d'affichage</Label>
                    <Input id="ordre" type="number" min="0" value={data.ordre} onChange={e => setData('ordre', e.target.value)} />
                </div>
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
                <Button type="submit" disabled={processing}>
                    {processing ? 'Enregistrement…' : editing ? 'Mettre à jour' : 'Ajouter le document'}
                </Button>
            </DialogFooter>
        </form>
    );
}

// ── Page principale ────────────────────────────────────────────────────────────

export default function AppelOffreShow({ ao }: Props) {
    const [modal, setModal] = useState<'create' | PieceRequise | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'GMP', href: '/gmp' },
        { title: "Appels d'offres", href: '/gmp/appels-offres' },
        { title: ao.numero_aao, href: `/gmp/appels-offres/${ao.id}` },
    ];

    function deletePiece(piece: PieceRequise) {
        if (!confirm(`Supprimer "${piece.libelle}" ?`)) return;
        router.delete(`/gmp/appels-offres/${ao.id}/pieces/${piece.id}`);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`AO — ${ao.numero_aao}`} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">

                {/* Retour + Titre */}
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" asChild className="shrink-0">
                        <Link href="/gmp/appels-offres"><ArrowLeft className="h-4 w-4" /></Link>
                    </Button>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
                        <Megaphone className="h-5 w-5 text-violet-600" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="truncate text-xl font-bold tracking-tight">{ao.numero_aao}</h1>
                        <p className="truncate text-sm text-muted-foreground">{ao.objet}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-3 shrink-0">
                        {ao.date_cloture && (
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <CalendarDays className="h-3.5 w-3.5" />
                                Clôture : {fmtDate(ao.date_cloture)}
                            </span>
                        )}
                    </div>
                </div>

                {/* ── Section Pièces requises ── */}
                <section className="rounded-xl border bg-card">
                    <div className="flex items-center justify-between border-b px-5 py-4">
                        <div className="flex items-center gap-2.5">
                            <FileCheck2 className="h-4 w-4 text-primary" />
                            <h2 className="font-semibold">Documents requis des soumissionnaires</h2>
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                {ao.pieces_requises.length}
                            </span>
                        </div>
                        <Button size="sm" onClick={() => setModal('create')}>
                            <Plus className="mr-1.5 h-3.5 w-3.5" />Ajouter un document
                        </Button>
                    </div>

                    {ao.pieces_requises.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 py-12 text-center">
                            <FilePlus className="h-10 w-10 text-muted-foreground/25" />
                            <p className="text-sm font-medium">Aucun document requis défini</p>
                            <p className="text-xs text-muted-foreground">Définissez les pièces que le soumissionnaire devra fournir.</p>
                            <Button variant="outline" size="sm" onClick={() => setModal('create')}>
                                <Plus className="mr-1.5 h-3.5 w-3.5" />Ajouter le premier document
                            </Button>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/30 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    <th className="px-5 py-3 text-left w-6">#</th>
                                    <th className="px-5 py-3 text-left">Document</th>
                                    <th className="px-5 py-3 text-left">Formats acceptés</th>
                                    <th className="px-5 py-3 text-center">Taille max</th>
                                    <th className="px-5 py-3 text-center">Obligation</th>
                                    <th className="w-20 px-5 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {ao.pieces_requises.map((piece, i) => (
                                    <tr key={piece.id} className="group hover:bg-muted/20 transition-colors">
                                        <td className="px-5 py-3 text-xs text-muted-foreground tabular-nums">{i + 1}</td>
                                        <td className="px-5 py-3">
                                            <p className="font-medium">{piece.libelle}</p>
                                            {piece.description && (
                                                <p className="mt-0.5 text-xs text-muted-foreground">{piece.description}</p>
                                            )}
                                        </td>
                                        <td className="px-5 py-3">
                                            {piece.formats_acceptes ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {piece.formats_acceptes.split(',').map(f => (
                                                        <span key={f} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] uppercase">{f.trim()}</span>
                                                    ))}
                                                </div>
                                            ) : <span className="text-xs text-muted-foreground">Tous types</span>}
                                        </td>
                                        <td className="px-5 py-3 text-center text-xs">{piece.taille_max_mo} Mo</td>
                                        <td className="px-5 py-3 text-center">
                                            {piece.obligatoire ? (
                                                <Badge variant="outline" className="text-[11px] bg-red-50 text-red-600 border-red-200">
                                                    <Shield className="mr-1 h-3 w-3" />Obligatoire
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[11px] bg-slate-50 text-slate-500 border-slate-200">
                                                    Facultatif
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" className="h-7 w-7" title="Modifier" onClick={() => setModal(piece)}>
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" title="Supprimer" onClick={() => deletePiece(piece)}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </section>

                {/* ── Section Soumissions reçues ── */}
                <section className="rounded-xl border bg-card">
                    <div className="flex items-center gap-2.5 border-b px-5 py-4">
                        <Inbox className="h-4 w-4 text-violet-600" />
                        <h2 className="font-semibold">Soumissions reçues</h2>
                        <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-700">
                            {ao.soumissions.length}
                        </span>
                    </div>

                    {ao.soumissions.length === 0 ? (
                        <div className="py-10 text-center">
                            <p className="text-sm text-muted-foreground">Aucune soumission reçue pour l'instant.</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/30 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    <th className="px-5 py-3 text-left">Référence</th>
                                    <th className="px-5 py-3 text-left">Fournisseur</th>
                                    <th className="px-5 py-3 text-left">Dépôt</th>
                                    <th className="px-5 py-3 text-right">Montant HT</th>
                                    <th className="px-5 py-3 text-left">Statut</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {ao.soumissions.map(s => (
                                    <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                                        <td className="px-5 py-3">
                                            <span className="font-mono text-xs">{s.reference_soumission}</span>
                                            {s.alerte_offre_anormale && <AlertTriangle className="ml-1.5 inline h-3.5 w-3.5 text-amber-500" />}
                                        </td>
                                        <td className="px-5 py-3 text-xs font-medium">{s.fournisseur?.raison_sociale ?? '—'}</td>
                                        <td className="px-5 py-3 text-xs">{fmtDate(s.date_depot)}</td>
                                        <td className="px-5 py-3 text-right tabular-nums text-xs">{fmtMontant(s.montant_offre_ht)}</td>
                                        <td className="px-5 py-3">
                                            <Badge variant="outline" className={`text-[11px] ${statutSoumCls(s.statut)}`}>
                                                {statutSoumLabel(s.statut)}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </section>

            </div>

            {/* Modal pièce requise */}
            <Dialog open={modal !== null} onOpenChange={open => !open && setModal(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {modal === 'create'
                                ? <><Plus className="h-4 w-4 text-primary" />Ajouter un document requis</>
                                : <><Pencil className="h-4 w-4" />Modifier le document requis</>
                            }
                        </DialogTitle>
                    </DialogHeader>
                    {modal !== null && (
                        <PieceModal
                            key={modal === 'create' ? 'create' : (modal as PieceRequise).id}
                            aoId={ao.id}
                            piece={modal === 'create' ? null : modal as PieceRequise}
                            onClose={() => setModal(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
