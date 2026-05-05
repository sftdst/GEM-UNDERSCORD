import { Head, useForm, router } from '@inertiajs/react';
import { Edit2, ExternalLink, Plus, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SuperAdminLayout from '@/layouts/superadmin-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Page Vitrine', href: '/superadmin/vitrine' },
    { title: 'Partenaires', href: '/superadmin/vitrine/partenaires' },
];

interface Partenaire {
    id: number;
    nom: string;
    logo_url: string | null;
    site_web: string | null;
    description: string | null;
    ordre: number;
    actif: boolean;
}

const emptyForm = { nom: '', logo_url: '', site_web: '', description: '', ordre: 0, actif: true };

export default function VitrinePartenaires({ partenaires }: { partenaires: Partenaire[] }) {
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Partenaire | null>(null);
    const { data, setData, post, put, processing, errors, reset } = useForm({ ...emptyForm });

    function openCreate() { reset(); setEditing(null); setShowForm(true); }
    function openEdit(p: Partenaire) {
        setData({ nom: p.nom, logo_url: p.logo_url ?? '', site_web: p.site_web ?? '', description: p.description ?? '', ordre: p.ordre, actif: p.actif });
        setEditing(p); setShowForm(true);
    }
    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) put(`/superadmin/vitrine/partenaires/${editing.id}`, { onSuccess: () => { setShowForm(false); setEditing(null); } });
        else post('/superadmin/vitrine/partenaires', { onSuccess: () => { setShowForm(false); reset(); } });
    }
    function destroy(p: Partenaire) {
        if (confirm(`Supprimer "${p.nom}" ?`)) router.delete(`/superadmin/vitrine/partenaires/${p.id}`);
    }

    return (
        <SuperAdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Partenaires Vitrine" />
            <div className="flex flex-col gap-6 p-4 md:p-6">

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Partenaires</h1>
                        <p className="text-sm text-muted-foreground mt-1">{partenaires.length} partenaire(s)</p>
                    </div>
                    <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Ajouter</Button>
                </div>

                {showForm && (
                    <Card className="border-primary/30">
                        <CardHeader>
                            <CardTitle className="text-base">{editing ? 'Modifier le partenaire' : 'Nouveau partenaire'}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="nom">Nom *</Label>
                                    <Input id="nom" value={data.nom} onChange={e => setData('nom', e.target.value)} placeholder="Organisation XYZ" />
                                    {errors.nom && <p className="text-destructive text-xs">{errors.nom}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="ordre">Ordre d'affichage</Label>
                                    <Input id="ordre" type="number" min={0} value={data.ordre} onChange={e => setData('ordre', parseInt(e.target.value))} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="logo_url">URL Logo</Label>
                                    <Input id="logo_url" value={data.logo_url} onChange={e => setData('logo_url', e.target.value)} placeholder="https://..." />
                                    {errors.logo_url && <p className="text-destructive text-xs">{errors.logo_url}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="site_web">Site web</Label>
                                    <Input id="site_web" value={data.site_web} onChange={e => setData('site_web', e.target.value)} placeholder="https://..." />
                                    {errors.site_web && <p className="text-destructive text-xs">{errors.site_web}</p>}
                                </div>
                                <div className="sm:col-span-2 space-y-1">
                                    <Label htmlFor="description">Description courte</Label>
                                    <Input id="description" value={data.description} onChange={e => setData('description', e.target.value)} placeholder="Brève description..." maxLength={300} />
                                </div>
                                <div className="sm:col-span-2 flex items-center gap-3">
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

                {partenaires.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <Users className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
                            <p className="text-muted-foreground text-sm">Aucun partenaire. Ajoutez-en un.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {partenaires.map((p) => (
                            <Card key={p.id} className={`border ${p.actif ? 'border-border' : 'border-dashed opacity-60'}`}>
                                <CardContent className="pt-5">
                                    <div className="flex items-center gap-3 mb-3">
                                        {p.logo_url ? (
                                            <img src={p.logo_url} alt={p.nom} className="w-12 h-12 object-contain rounded-lg border border-border bg-muted p-1" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg border border-border bg-muted flex items-center justify-center">
                                                <Users className="w-5 h-5 text-muted-foreground" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-foreground text-sm truncate">{p.nom}</p>
                                            <Badge variant={p.actif ? 'default' : 'secondary'} className="text-xs mt-0.5">
                                                {p.actif ? 'Actif' : 'Inactif'}
                                            </Badge>
                                        </div>
                                    </div>
                                    {p.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{p.description}</p>}
                                    <div className="flex items-center justify-between mt-3">
                                        <div className="flex items-center gap-1">
                                            {p.site_web && (
                                                <a href={p.site_web} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                                                    <ExternalLink className="w-3 h-3" /> Site
                                                </a>
                                            )}
                                        </div>
                                        <div className="flex gap-1">
                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(p)}>
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => destroy(p)}>
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
