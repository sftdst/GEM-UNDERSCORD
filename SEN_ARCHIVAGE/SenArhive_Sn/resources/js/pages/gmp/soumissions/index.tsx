import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    CalendarDays,
    ExternalLink,
    FileCheck2,
    FileUp,
    Inbox,
    Pencil,
    Plus,
    Search,
    Shield,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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

interface AppelOffre {
    id: string;
    numero_aao: string;
    objet: string;
    statut: string;
    date_cloture: string | null;
    pieces_requises: PieceRequise[];
}

interface Fournisseur { id: string; raison_sociale: string }

interface Soumission {
    id: string;
    reference_soumission: string;
    date_depot: string;
    montant_offre_ht: string;
    montant_offre_ttc: string;
    delai_execution_propose: number | null;
    statut: string;
    score_technique: string | null;
    score_financier: string | null;
    score_global: string | null;
    motif_elimination: string | null;
    alerte_offre_anormale: boolean;
    appel_offre_id: string;
    fournisseur_id: string;
    appel_offre?: AppelOffre;
    fournisseur?: Fournisseur;
}

interface Props {
    soumissions: { data: Soumission[]; total: number };
    appels_offres: AppelOffre[];
    fournisseurs: Fournisseur[];
    filters: { search?: string; statut?: string; appel_offre_id?: string };
}

// ── Constantes ─────────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'GMP', href: '/gmp' },
    { title: 'Passation', href: '/gmp/appels-offres' },
    { title: 'Soumissions', href: '/gmp/soumissions' },
];

const STATUTS = [
    { value: 'deposee',      label: 'Déposée',      cls: 'bg-slate-50 text-slate-600 border-slate-200' },
    { value: 'conforme',     label: 'Conforme',     cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    { value: 'non_conforme', label: 'Non conforme', cls: 'bg-red-50 text-red-600 border-red-200' },
    { value: 'retenue',      label: 'Retenue',      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { value: 'eliminee',     label: 'Éliminée',     cls: 'bg-gray-100 text-gray-500 border-gray-200' },
];

function statutCls(s: string)   { return STATUTS.find(x => x.value === s)?.cls ?? ''; }
function statutLabel(s: string) { return STATUTS.find(x => x.value === s)?.label ?? s.replace(/_/g, ' '); }

function fmtMontant(val: string | null) {
    if (!val || Number(val) === 0) return '—';
    return new Intl.NumberFormat('fr-SN', { maximumFractionDigits: 0 }).format(Number(val)) + ' FCFA';
}
function fmtDate(val: string | null) {
    if (!val) return '—';
    return new Date(val).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtScore(val: string | null) {
    const n = Number(val);
    return isNaN(n) || val === null ? '—' : n.toFixed(2);
}

// ── Champ upload de fichier ────────────────────────────────────────────────────

function FileField({
    piece,
    file,
    onChange,
    error,
}: {
    piece: PieceRequise;
    file: File | null;
    onChange: (f: File | null) => void;
    error?: string;
}) {
    const ref = useRef<HTMLInputElement>(null);
    const formats = piece.formats_acceptes
        ? piece.formats_acceptes.split(',').map(f => `.${f.trim()}`).join(',')
        : undefined;

    return (
        <div className={`rounded-lg border p-3 transition-colors ${file ? 'border-emerald-300 bg-emerald-50/50' : piece.obligatoire ? 'border-red-200 bg-red-50/30' : 'border-border bg-muted/20'}`}>
            <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${file ? 'bg-emerald-100' : 'bg-muted'}`}>
                    {file
                        ? <FileCheck2 className="h-4 w-4 text-emerald-600" />
                        : <FileUp className="h-4 w-4 text-muted-foreground" />
                    }
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{piece.libelle}</span>
                        {piece.obligatoire
                            ? <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 border-red-200 py-0"><Shield className="mr-0.5 h-2.5 w-2.5" />Obligatoire</Badge>
                            : <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-500 py-0">Facultatif</Badge>
                        }
                    </div>
                    {piece.description && (
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{piece.description}</p>
                    )}
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {piece.formats_acceptes
                            ? piece.formats_acceptes.toUpperCase().replace(/,/g, ' · ')
                            : 'Tous formats'
                        } — max {piece.taille_max_mo} Mo
                    </p>

                    {file ? (
                        <div className="mt-1.5 flex items-center gap-2">
                            <span className="truncate text-[11px] font-medium text-emerald-700">{file.name}</span>
                            <span className="shrink-0 text-[11px] text-muted-foreground">({(file.size / 1024 / 1024).toFixed(2)} Mo)</span>
                            <button type="button" onClick={() => onChange(null)} className="text-muted-foreground hover:text-destructive transition-colors">
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => ref.current?.click()}
                            className="mt-1.5 text-[11px] font-medium text-primary hover:underline"
                        >
                            Choisir un fichier…
                        </button>
                    )}
                    {error && <p className="mt-1 text-[11px] text-destructive">{error}</p>}
                </div>
                {!file && (
                    <Button type="button" size="sm" variant="outline" className="h-7 shrink-0 text-xs" onClick={() => ref.current?.click()}>
                        Parcourir
                    </Button>
                )}
            </div>
            <input
                ref={ref}
                type="file"
                accept={formats}
                className="hidden"
                onChange={e => onChange(e.target.files?.[0] ?? null)}
            />
        </div>
    );
}

// ── Modal créer soumission ─────────────────────────────────────────────────────

function CreateModal({
    appelsOffres,
    fournisseurs,
    onClose,
}: {
    appelsOffres: AppelOffre[];
    fournisseurs: Fournisseur[];
    onClose: () => void;
}) {
    const [aoId,       setAoId]       = useState(appelsOffres[0]?.id ?? '');
    const [fournId,    setFournId]    = useState('');
    const [reference,  setReference]  = useState('');
    const [dateDepot,  setDateDepot]  = useState('');
    const [htVal,      setHtVal]      = useState('');
    const [ttcVal,     setTtcVal]     = useState('');
    const [delai,      setDelai]      = useState('');
    const [alerte,     setAlerte]     = useState(false);
    const [files,      setFiles]      = useState<Record<string, File | null>>({});
    const [freeFiles,  setFreeFiles]  = useState<File[]>([]);
    const [errors,     setErrors]     = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const ao = appelsOffres.find(a => a.id === aoId);

    // Reset files when AO changes
    useEffect(() => { setFiles({}); setFreeFiles([]); }, [aoId]);

    function setFile(pieceId: string, file: File | null) {
        setFiles(prev => ({ ...prev, [pieceId]: file }));
        if (file) {
            setErrors(prev => { const n = { ...prev }; delete n[`pieces.${pieceId}`]; return n; });
        }
    }

    function validate(): boolean {
        const errs: Record<string, string> = {};
        if (!aoId)        errs['appel_offre_id'] = "Sélectionnez un appel d'offres.";
        if (!fournId)     errs['fournisseur_id'] = 'Sélectionnez un fournisseur.';
        if (!reference)   errs['reference_soumission'] = 'La référence est obligatoire.';
        if (!dateDepot)   errs['date_depot'] = 'La date de dépôt est obligatoire.';
        if (!htVal)       errs['montant_offre_ht'] = 'Le montant HT est obligatoire.';
        if (!ttcVal)      errs['montant_offre_ttc'] = 'Le montant TTC est obligatoire.';

        // Vérification des pièces obligatoires
        ao?.pieces_requises.filter(p => p.obligatoire).forEach(p => {
            if (!files[p.id]) {
                errs[`pieces.${p.id}`] = `"${p.libelle}" est obligatoire.`;
            }
        });

        // Vérification de la taille des fichiers
        ao?.pieces_requises.forEach(p => {
            const f = files[p.id];
            if (f && f.size > p.taille_max_mo * 1024 * 1024) {
                errs[`pieces.${p.id}`] = `Fichier trop volumineux (max ${p.taille_max_mo} Mo, reçu ${(f.size / 1024 / 1024).toFixed(1)} Mo).`;
            }
        });

        setErrors(errs);
        return Object.keys(errs).length === 0;
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) return;

        setProcessing(true);
        const fd = new FormData();
        fd.append('appel_offre_id', aoId);
        fd.append('fournisseur_id', fournId);
        fd.append('reference_soumission', reference);
        fd.append('date_depot', dateDepot);
        fd.append('montant_offre_ht', htVal);
        fd.append('montant_offre_ttc', ttcVal);
        if (delai) fd.append('delai_execution_propose', delai);
        fd.append('alerte_offre_anormale', alerte ? '1' : '0');

        Object.entries(files).forEach(([pieceId, file]) => {
            if (file) fd.append(`pieces[${pieceId}]`, file);
        });
        freeFiles.forEach((file) => {
            fd.append('documents[]', file);
        });

        router.post('/gmp/soumissions', fd, {
            forceFormData: true,
            onSuccess: () => onClose(),
            onError: (errs) => setErrors(errs as Record<string, string>),
            onFinish: () => setProcessing(false),
        });
    }

    const sel = 'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring';
    const obligManquantes = ao?.pieces_requises.filter(p => p.obligatoire && !files[p.id]).length ?? 0;

    return (
        <form onSubmit={submit} className="space-y-5">

            {/* AO + Référence */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label>Appel d'offres <span className="text-destructive">*</span></Label>
                    <select value={aoId} onChange={e => setAoId(e.target.value)} className={sel} autoFocus>
                        <option value="">— Sélectionner —</option>
                        {appelsOffres.map(a => <option key={a.id} value={a.id}>{a.numero_aao}</option>)}
                    </select>
                    {ao && <p className="text-[11px] text-muted-foreground line-clamp-1">{ao.objet}</p>}
                    {errors['appel_offre_id'] && <p className="text-xs text-destructive">{errors['appel_offre_id']}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label>Référence soumission <span className="text-destructive">*</span></Label>
                    <Input value={reference} onChange={e => setReference(e.target.value)} placeholder="SOU-2025-001" />
                    {errors['reference_soumission'] && <p className="text-xs text-destructive">{errors['reference_soumission']}</p>}
                </div>
            </div>

            {/* Fournisseur + Date dépôt */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label>Fournisseur <span className="text-destructive">*</span></Label>
                    <select value={fournId} onChange={e => setFournId(e.target.value)} className={sel}>
                        <option value="">— Sélectionner —</option>
                        {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.raison_sociale}</option>)}
                    </select>
                    {errors['fournisseur_id'] && <p className="text-xs text-destructive">{errors['fournisseur_id']}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label>Date de dépôt <span className="text-destructive">*</span></Label>
                    <Input type="datetime-local" value={dateDepot} onChange={e => setDateDepot(e.target.value)} />
                    {errors['date_depot'] && <p className="text-xs text-destructive">{errors['date_depot']}</p>}
                </div>
            </div>

            {/* Montants */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label>Montant offre HT (FCFA) <span className="text-destructive">*</span></Label>
                    <Input type="number" min="0" step="1000" value={htVal} onChange={e => setHtVal(e.target.value)} placeholder="0" />
                    {errors['montant_offre_ht'] && <p className="text-xs text-destructive">{errors['montant_offre_ht']}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label>Montant offre TTC (FCFA) <span className="text-destructive">*</span></Label>
                    <Input type="number" min="0" step="1000" value={ttcVal} onChange={e => setTtcVal(e.target.value)} placeholder="0" />
                    {errors['montant_offre_ttc'] && <p className="text-xs text-destructive">{errors['montant_offre_ttc']}</p>}
                </div>
            </div>

            {/* Délai + Alerte */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label>Délai d'exécution proposé (jours)</Label>
                    <Input type="number" min="1" value={delai} onChange={e => setDelai(e.target.value)} placeholder="Ex: 90" />
                </div>
                <div className="flex items-end pb-1">
                    <label className="flex cursor-pointer items-center gap-2.5">
                        <input type="checkbox" checked={alerte} onChange={e => setAlerte(e.target.checked)} className="h-4 w-4 rounded border-input accent-destructive" />
                        <span className="text-sm font-medium flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                            Offre anormalement basse
                        </span>
                    </label>
                </div>
            </div>

            {/* ── Pièces à uploader ── */}
            {ao && ao.pieces_requises.length > 0 && (
                <div className="space-y-3 border-t pt-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">Documents à fournir</p>
                        {obligManquantes > 0 && (
                            <span className="flex items-center gap-1 text-xs text-red-600">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                {obligManquantes} obligatoire{obligManquantes > 1 ? 's' : ''} manquant{obligManquantes > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    <div className="space-y-2">
                        {ao.pieces_requises.map(piece => (
                            <FileField
                                key={piece.id}
                                piece={piece}
                                file={files[piece.id] ?? null}
                                onChange={f => setFile(piece.id, f)}
                                error={errors[`pieces.${piece.id}`]}
                            />
                        ))}
                    </div>
                </div>
            )}

            {ao && ao.pieces_requises.length === 0 && (
                <div className="space-y-3 border-t pt-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">Documents de soumission</p>
                        <Link href={`/gmp/appels-offres/${ao.id}`} className="text-[11px] text-muted-foreground hover:text-primary underline">
                            Configurer les pièces requises
                        </Link>
                    </div>
                    <label className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors ${freeFiles.length > 0 ? 'border-emerald-300 bg-emerald-50/40' : 'border-border hover:border-primary/40 hover:bg-muted/30'}`}>
                        <FileUp className={`h-8 w-8 ${freeFiles.length > 0 ? 'text-emerald-500' : 'text-muted-foreground/50'}`} />
                        <span className="text-sm font-medium text-muted-foreground">
                            {freeFiles.length > 0
                                ? `${freeFiles.length} fichier(s) sélectionné(s)`
                                : 'Cliquez ou déposez vos documents ici'
                            }
                        </span>
                        <span className="text-[11px] text-muted-foreground/70">PDF, Word, Excel, images — 50 Mo max par fichier</span>
                        <input
                            type="file"
                            multiple
                            className="hidden"
                            onChange={e => {
                                const selected = Array.from(e.target.files ?? []);
                                setFreeFiles(prev => [...prev, ...selected]);
                                e.target.value = '';
                            }}
                        />
                    </label>
                    {freeFiles.length > 0 && (
                        <div className="space-y-1.5">
                            {freeFiles.map((f, i) => (
                                <div key={i} className="flex items-center gap-2 rounded-md border bg-muted/20 px-3 py-2">
                                    <FileCheck2 className="h-4 w-4 shrink-0 text-emerald-500" />
                                    <span className="min-w-0 flex-1 truncate text-xs font-medium">{f.name}</span>
                                    <span className="shrink-0 text-[11px] text-muted-foreground">{(f.size / 1024 / 1024).toFixed(2)} Mo</span>
                                    <button type="button" onClick={() => setFreeFiles(prev => prev.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive transition-colors">
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={processing}>Annuler</Button>
                <Button type="submit" disabled={processing}>
                    {processing ? 'Enregistrement et archivage…' : 'Soumettre l\'offre'}
                </Button>
            </DialogFooter>
        </form>
    );
}

// ── Modal éditer soumission ────────────────────────────────────────────────────

interface EditFormFields {
    appel_offre_id: string; fournisseur_id: string;
    reference_soumission: string; date_depot: string;
    montant_offre_ht: string; montant_offre_ttc: string;
    delai_execution_propose: string; statut: string;
    score_technique: string; score_financier: string; score_global: string;
    motif_elimination: string; alerte_offre_anormale: boolean;
}

function EditModal({ soumission, appelsOffres, fournisseurs, onClose }: {
    soumission: Soumission;
    appelsOffres: AppelOffre[];
    fournisseurs: Fournisseur[];
    onClose: () => void;
}) {
    const { data, setData, put, processing, errors, reset } = useForm<EditFormFields>({
        appel_offre_id:          soumission.appel_offre_id,
        fournisseur_id:          soumission.fournisseur_id,
        reference_soumission:    soumission.reference_soumission,
        date_depot:              soumission.date_depot.substring(0, 16),
        montant_offre_ht:        soumission.montant_offre_ht,
        montant_offre_ttc:       soumission.montant_offre_ttc,
        delai_execution_propose: soumission.delai_execution_propose != null ? String(soumission.delai_execution_propose) : '',
        statut:                  soumission.statut,
        score_technique:         soumission.score_technique ?? '',
        score_financier:         soumission.score_financier ?? '',
        score_global:            soumission.score_global ?? '',
        motif_elimination:       soumission.motif_elimination ?? '',
        alerte_offre_anormale:   soumission.alerte_offre_anormale,
    });

    const sel = 'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring';
    const showElim = data.statut === 'non_conforme' || data.statut === 'eliminee';

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(`/gmp/soumissions/${soumission.id}`, { onSuccess: () => { reset(); onClose(); } });
    }

    return (
        <form onSubmit={submit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label>Appel d'offres <span className="text-destructive">*</span></Label>
                    <select value={data.appel_offre_id} onChange={e => setData('appel_offre_id', e.target.value)} className={sel}>
                        {appelsOffres.map(a => <option key={a.id} value={a.id}>{a.numero_aao}</option>)}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <Label>Référence <span className="text-destructive">*</span></Label>
                    <Input value={data.reference_soumission} onChange={e => setData('reference_soumission', e.target.value)} />
                    {errors.reference_soumission && <p className="text-xs text-destructive">{errors.reference_soumission}</p>}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label>Fournisseur <span className="text-destructive">*</span></Label>
                    <select value={data.fournisseur_id} onChange={e => setData('fournisseur_id', e.target.value)} className={sel}>
                        {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.raison_sociale}</option>)}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <Label>Date de dépôt <span className="text-destructive">*</span></Label>
                    <Input type="datetime-local" value={data.date_depot} onChange={e => setData('date_depot', e.target.value)} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label>Montant HT (FCFA)</Label>
                    <Input type="number" min="0" step="1000" value={data.montant_offre_ht} onChange={e => setData('montant_offre_ht', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                    <Label>Montant TTC (FCFA)</Label>
                    <Input type="number" min="0" step="1000" value={data.montant_offre_ttc} onChange={e => setData('montant_offre_ttc', e.target.value)} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label>Délai proposé (jours)</Label>
                    <Input type="number" min="1" value={data.delai_execution_propose} onChange={e => setData('delai_execution_propose', e.target.value)} />
                </div>
                <div className="flex items-end pb-1">
                    <label className="flex cursor-pointer items-center gap-2.5">
                        <input type="checkbox" checked={data.alerte_offre_anormale} onChange={e => setData('alerte_offre_anormale', e.target.checked)} className="h-4 w-4 rounded border-input accent-destructive" />
                        <span className="text-sm font-medium flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                            Offre anormalement basse
                        </span>
                    </label>
                </div>
            </div>

            {/* Évaluation */}
            <div className="border-t pt-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Évaluation</p>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label>Statut</Label>
                        <select value={data.statut} onChange={e => setData('statut', e.target.value)} className={sel}>
                            {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Score global (/100)</Label>
                        <Input type="number" min="0" max="100" step="0.01" value={data.score_global} onChange={e => setData('score_global', e.target.value)} placeholder="—" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label>Score technique (/100)</Label>
                        <Input type="number" min="0" max="100" step="0.01" value={data.score_technique} onChange={e => setData('score_technique', e.target.value)} placeholder="—" />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Score financier (/100)</Label>
                        <Input type="number" min="0" max="100" step="0.01" value={data.score_financier} onChange={e => setData('score_financier', e.target.value)} placeholder="—" />
                    </div>
                </div>
                {showElim && (
                    <div className="space-y-1.5">
                        <Label>Motif d'élimination / non-conformité</Label>
                        <textarea rows={2} value={data.motif_elimination} onChange={e => setData('motif_elimination', e.target.value)} className="flex min-h-[56px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
                    </div>
                )}
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
                <Button type="submit" disabled={processing}>{processing ? 'Enregistrement…' : 'Mettre à jour'}</Button>
            </DialogFooter>
        </form>
    );
}

// ── Page principale ────────────────────────────────────────────────────────────

export default function SoumissionsIndex({ soumissions, appels_offres, fournisseurs, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [statut, setStatut] = useState(filters.statut ?? '');
    const [aoId,   setAoId]   = useState(filters.appel_offre_id ?? '');
    const [modal,  setModal]  = useState<'create' | Soumission | null>(null);

    useEffect(() => {
        const t = setTimeout(() => {
            router.get('/gmp/soumissions', { search, statut, appel_offre_id: aoId }, { preserveState: true, replace: true });
        }, 350);
        return () => clearTimeout(t);
    }, [search, statut, aoId]);

    const resetFilters = () => { setSearch(''); setStatut(''); setAoId(''); };
    const hasFilters = search || statut || aoId;

    const sel = 'h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Soumissions" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">

                {/* En-tête */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
                            <Inbox className="h-5 w-5 text-violet-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Soumissions</h1>
                            <p className="text-sm text-muted-foreground">{soumissions.total} soumission(s) enregistrée(s)</p>
                        </div>
                    </div>
                    <Button onClick={() => setModal('create')} className="shrink-0">
                        <Plus className="mr-2 h-4 w-4" />Nouvelle soumission
                    </Button>
                </div>

                {/* Filtres */}
                <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3">
                    <div className="relative flex-1 min-w-48">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Référence ou fournisseur…" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <select value={aoId} onChange={e => setAoId(e.target.value)} className={sel}>
                        <option value="">Tous les appels d'offres</option>
                        {appels_offres.map(a => <option key={a.id} value={a.id}>{a.numero_aao}</option>)}
                    </select>
                    <select value={statut} onChange={e => setStatut(e.target.value)} className={sel}>
                        <option value="">Tous statuts</option>
                        {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    {hasFilters && (
                        <Button size="sm" variant="ghost" onClick={resetFilters} className="gap-1.5 text-muted-foreground">
                            <X className="h-3.5 w-3.5" />Réinitialiser
                        </Button>
                    )}
                </div>

                {/* Tableau */}
                {soumissions.data.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed">
                        <div className="py-16 text-center">
                            <Inbox className="mx-auto mb-4 h-14 w-14 text-muted-foreground/25" />
                            <h3 className="text-base font-semibold">Aucune soumission</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Enregistrez les offres reçues pour chaque appel d'offres.</p>
                            <Button className="mt-5" onClick={() => setModal('create')}>
                                <Plus className="mr-2 h-4 w-4" />Nouvelle soumission
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border bg-card">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    <th className="px-4 py-3 text-left">Référence</th>
                                    <th className="px-4 py-3 text-left">Appel d'offres</th>
                                    <th className="px-4 py-3 text-left">Fournisseur</th>
                                    <th className="px-4 py-3 text-left"><span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />Dépôt</span></th>
                                    <th className="px-4 py-3 text-right">Montant HT</th>
                                    <th className="px-4 py-3 text-right">Montant TTC</th>
                                    <th className="px-4 py-3 text-center">Score</th>
                                    <th className="px-4 py-3 text-left">Statut</th>
                                    <th className="w-20 px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {soumissions.data.map(s => (
                                    <tr key={s.id} className="group transition-colors hover:bg-muted/30">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs">{s.reference_soumission}</span>
                                                {s.alerte_offre_anormale && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" title="Offre anormalement basse" />}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <div>
                                                    <p className="text-xs font-medium">{s.appel_offre?.numero_aao ?? '—'}</p>
                                                    {s.appel_offre?.objet && <p className="max-w-[140px] truncate text-[11px] text-muted-foreground">{s.appel_offre.objet}</p>}
                                                </div>
                                                {s.appel_offre && (
                                                    <Link href={`/gmp/appels-offres/${s.appel_offre.id}`} className="text-muted-foreground hover:text-primary transition-colors">
                                                        <ExternalLink className="h-3 w-3" />
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs font-medium">{s.fournisseur?.raison_sociale ?? '—'}</td>
                                        <td className="px-4 py-3 text-xs whitespace-nowrap">{fmtDate(s.date_depot)}</td>
                                        <td className="px-4 py-3 text-right tabular-nums text-xs">{fmtMontant(s.montant_offre_ht)}</td>
                                        <td className="px-4 py-3 text-right tabular-nums text-xs">{fmtMontant(s.montant_offre_ttc)}</td>
                                        <td className="px-4 py-3 text-center">
                                            {s.score_global !== null
                                                ? <span className={`text-xs font-bold tabular-nums ${Number(s.score_global) >= 70 ? 'text-emerald-600' : Number(s.score_global) >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{fmtScore(s.score_global)}</span>
                                                : <span className="text-xs text-muted-foreground/40">—</span>
                                            }
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant="outline" className={`text-[11px] ${statutCls(s.statut)}`}>{statutLabel(s.statut)}</Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" className="h-7 w-7" title="Modifier" onClick={() => setModal(s)}>
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Créer */}
            <Dialog open={modal === 'create'} onOpenChange={open => !open && setModal(null)}>
                <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="h-4 w-4 text-primary" />Nouvelle soumission
                        </DialogTitle>
                    </DialogHeader>
                    <CreateModal
                        key="create"
                        appelsOffres={appels_offres}
                        fournisseurs={fournisseurs}
                        onClose={() => setModal(null)}
                    />
                </DialogContent>
            </Dialog>

            {/* Modal Éditer */}
            <Dialog open={typeof modal === 'object' && modal !== null && modal !== 'create' as unknown} onOpenChange={open => !open && setModal(null)}>
                <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pencil className="h-4 w-4" />Modifier la soumission
                        </DialogTitle>
                    </DialogHeader>
                    {modal !== null && modal !== 'create' && (
                        <EditModal
                            key={(modal as Soumission).id}
                            soumission={modal as Soumission}
                            appelsOffres={appels_offres}
                            fournisseurs={fournisseurs}
                            onClose={() => setModal(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
