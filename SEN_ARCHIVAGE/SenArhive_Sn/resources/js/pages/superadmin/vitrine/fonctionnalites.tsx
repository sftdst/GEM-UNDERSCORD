import { Head, useForm, router } from '@inertiajs/react';
import { Edit2, Plus, Settings2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import SuperAdminLayout from '@/layouts/superadmin-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Page Vitrine', href: '/superadmin/vitrine' },
    { title: 'Fonctionnalités', href: '/superadmin/vitrine/fonctionnalites' },
];

interface Fonctionnalite {
    id: number;
    icone: string;
    titre: string;
    description: string;
    couleur_bg: string;
    couleur_icone: string;
    ordre: number;
    actif: boolean;
}

const ICONES_SUGGEREES = [
    'Archive', 'GitBranch', 'FileSearch', 'PenTool', 'Shield',
    'MessageSquare', 'Users', 'Lock', 'Zap', 'FileText',
    'Search', 'Bell', 'Star', 'Settings', 'Globe',
];

const emptyForm = {
    icone: 'Archive',
    titre: '',
    description: '',
    couleur_bg: 'oklch(0.65 0.19 45 / 0.10)',
    couleur_icone: 'oklch(0.65 0.19 45)',
    ordre: 0,
    actif: true,
};

export default function VitrineFonctionnalites({ fonctionnalites }: { fonctionnalites: Fonctionnalite[] }) {
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Fonctionnalite | null>(null);
    const { data, setData, post, put, processing, errors, reset } = useForm({ ...emptyForm });

    function openCreate() { reset(); setEditing(null); setShowForm(true); }
    function openEdit(f: Fonctionnalite) {
        setData({ icone: f.icone, titre: f.titre, description: f.description, couleur_bg: f.couleur_bg, couleur_icone: f.couleur_icone, ordre: f.ordre, actif: f.actif });
        setEditing(f); setShowForm(true);
    }
    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) put(`/superadmin/vitrine/fonctionnalites/${editing.id}`, { onSuccess: () => { setShowForm(false); setEditing(null); } });
        else post('/superadmin/vitrine/fonctionnalites', { onSuccess: () => { setShowForm(false); reset(); } });
    }
    function destroy(f: Fonctionnalite) {
        if (confirm(`Supprimer la fonctionnalité "${f.titre}" ?`)) router.delete(`/superadmin/vitrine/fonctionnalites/${f.id}`);
    }

    return (
        <SuperAdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Fonctionnalités Vitrine" />
            <div className="flex flex-col gap-6 p-4 md:p-6">

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Fonctionnalités</h1>
                        <p className="text-sm text-muted-foreground mt-1">{fonctionnalites.length} fonctionnalité(s) sur la landing page</p>
                    </div>
                    <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Ajouter</Button>
                </div>

                {showForm && (
                    <Card className="border-primary/30">
                        <CardHeader>
                            <CardTitle className="text-base">{editing ? 'Modifier la fonctionnalité' : 'Nouvelle fonctionnalité'}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="titre">Titre *</Label>
                                    <Input id="titre" value={data.titre} onChange={e => setData('titre', e.target.value)} placeholder="Archivage & Organisation" />
                                    {errors.titre && <p className="text-destructive text-xs">{errors.titre}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="icone">Icône Lucide *</Label>
                                    <Input id="icone" value={data.icone} onChange={e => setData('icone', e.target.value)} placeholder="Archive" />
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {ICONES_SUGGEREES.map(ic => (
                                            <button
                                                key={ic}
                                                type="button"
                                                onClick={() => setData('icone', ic)}
                                                className={`text-xs px-2 py-0.5 rounded border transition-colors ${data.icone === ic ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'}`}
                                            >
                                                {ic}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="sm:col-span-2 space-y-1">
                                    <Label htmlFor="description">Description * <span className="text-muted-foreground text-xs">(max 500 car.)</span></Label>
                                    <Textarea id="description" rows={3} value={data.description} onChange={e => setData('description', e.target.value)} placeholder="Décrivez cette fonctionnalité..." maxLength={500} />
                                    {errors.description && <p className="text-destructive text-xs">{errors.description}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="couleur_bg">Couleur fond icône</Label>
                                    <Input id="couleur_bg" value={data.couleur_bg} onChange={e => setData('couleur_bg', e.target.value)} placeholder="oklch(0.65 0.19 45 / 0.10)" />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="couleur_icone">Couleur icône</Label>
                                    <Input id="couleur_icone" value={data.couleur_icone} onChange={e => setData('couleur_icone', e.target.value)} placeholder="oklch(0.65 0.19 45)" />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="ordre">Ordre</Label>
                                    <Input id="ordre" type="number" min={0} value={data.ordre} onChange={e => setData('ordre', parseInt(e.target.value))} />
                                </div>
                                <div className="flex items-center gap-3 pt-5">
                                    <input type="checkbox" id="actif" checked={data.actif} onChange={e => setData('actif', e.target.checked)} className="rounded" />
                                    <Label htmlFor="actif">Visible sur la vitrine</Label>
                                </div>
                                <div className="sm:col-span-2 flex gap-3 pt-2">
                                    <Button type="submit" disabled={processing}>{editing ? 'Enregistrer' : 'Ajouter'}</Button>
                                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {fonctionnalites.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <Settings2 className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
                            <p className="text-muted-foreground text-sm">Aucune fonctionnalité. Ajoutez-en une.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {fonctionnalites.map((f) => (
                            <Card key={f.id} className={`border ${f.actif ? 'border-border' : 'border-dashed opacity-60'}`}>
                                <CardContent className="pt-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: f.couleur_bg, color: f.couleur_icone }}>
                                                {f.icone.substring(0, 2)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-foreground text-sm">{f.titre}</p>
                                                <p className="text-xs text-muted-foreground">Icône : {f.icone}</p>
                                            </div>
                                        </div>
                                        <Badge variant={f.actif ? 'default' : 'secondary'} className="text-xs">
                                            {f.actif ? 'Actif' : 'Inactif'}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-3 mb-3">{f.description}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">Ordre : {f.ordre}</span>
                                        <div className="flex gap-1">
                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(f)}>
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => destroy(f)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </SuperAdminLayout>
    );
}
