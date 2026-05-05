import { Head, useForm, router } from '@inertiajs/react';
import { Edit2, MessageSquare, Plus, Star, Trash2 } from 'lucide-react';
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
    { title: 'Témoignages', href: '/superadmin/vitrine/temoignages' },
];

interface Temoignage {
    id: number;
    nom: string;
    role: string;
    entreprise: string;
    initiales: string;
    photo_url: string | null;
    contenu: string;
    note: number;
    ordre: number;
    actif: boolean;
}

const emptyForm = {
    nom: '', role: '', entreprise: '', initiales: '',
    photo_url: '', contenu: '', note: 5, ordre: 0, actif: true,
};

export default function VitrineTemoignages({ temoignages }: { temoignages: Temoignage[] }) {
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Temoignage | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({ ...emptyForm });

    function openCreate() {
        reset();
        Object.assign(data, emptyForm);
        setEditing(null);
        setShowForm(true);
    }

    function openEdit(t: Temoignage) {
        setData({
            nom: t.nom, role: t.role, entreprise: t.entreprise,
            initiales: t.initiales, photo_url: t.photo_url ?? '',
            contenu: t.contenu, note: t.note, ordre: t.ordre, actif: t.actif,
        });
        setEditing(t);
        setShowForm(true);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            put(`/superadmin/vitrine/temoignages/${editing.id}`, {
                onSuccess: () => { setShowForm(false); setEditing(null); },
            });
        } else {
            post('/superadmin/vitrine/temoignages', {
                onSuccess: () => { setShowForm(false); reset(); },
            });
        }
    }

    function destroy(t: Temoignage) {
        if (confirm(`Supprimer le témoignage de "${t.nom}" ?`)) {
            router.delete(`/superadmin/vitrine/temoignages/${t.id}`);
        }
    }

    return (
        <SuperAdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Témoignages Vitrine" />
            <div className="flex flex-col gap-6 p-4 md:p-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Témoignages</h1>
                        <p className="text-sm text-muted-foreground mt-1">{temoignages.length} témoignage(s) configuré(s)</p>
                    </div>
                    <Button onClick={openCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Ajouter
                    </Button>
                </div>

                {/* Formulaire */}
                {showForm && (
                    <Card className="border-primary/30">
                        <CardHeader>
                            <CardTitle className="text-base">
                                {editing ? 'Modifier le témoignage' : 'Nouveau témoignage'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="nom">Nom *</Label>
                                    <Input id="nom" value={data.nom} onChange={e => setData('nom', e.target.value)} placeholder="Aminata Diallo" />
                                    {errors.nom && <p className="text-destructive text-xs">{errors.nom}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="role">Rôle / Poste *</Label>
                                    <Input id="role" value={data.role} onChange={e => setData('role', e.target.value)} placeholder="Directrice Administrative" />
                                    {errors.role && <p className="text-destructive text-xs">{errors.role}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="entreprise">Entreprise *</Label>
                                    <Input id="entreprise" value={data.entreprise} onChange={e => setData('entreprise', e.target.value)} placeholder="Cabinet Juridique Dakar" />
                                    {errors.entreprise && <p className="text-destructive text-xs">{errors.entreprise}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="initiales">Initiales *</Label>
                                    <Input id="initiales" value={data.initiales} onChange={e => setData('initiales', e.target.value)} placeholder="AD" maxLength={5} />
                                    {errors.initiales && <p className="text-destructive text-xs">{errors.initiales}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="photo_url">URL Photo (optionnel)</Label>
                                    <Input id="photo_url" value={data.photo_url} onChange={e => setData('photo_url', e.target.value)} placeholder="https://..." />
                                    {errors.photo_url && <p className="text-destructive text-xs">{errors.photo_url}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="note">Note (1-5)</Label>
                                        <Input id="note" type="number" min={1} max={5} value={data.note} onChange={e => setData('note', parseInt(e.target.value))} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="ordre">Ordre</Label>
                                        <Input id="ordre" type="number" min={0} value={data.ordre} onChange={e => setData('ordre', parseInt(e.target.value))} />
                                    </div>
                                </div>
                                <div className="sm:col-span-2 space-y-1">
                                    <Label htmlFor="contenu">Témoignage * <span className="text-muted-foreground text-xs">(max 600 car.)</span></Label>
                                    <Textarea id="contenu" rows={3} value={data.contenu} onChange={e => setData('contenu', e.target.value)} placeholder="Décrivez l'expérience..." maxLength={600} />
                                    <p className="text-xs text-muted-foreground text-right">{data.contenu.length}/600</p>
                                    {errors.contenu && <p className="text-destructive text-xs">{errors.contenu}</p>}
                                </div>
                                <div className="sm:col-span-2 flex items-center gap-3">
                                    <input type="checkbox" id="actif" checked={data.actif} onChange={e => setData('actif', e.target.checked)} className="rounded" />
                                    <Label htmlFor="actif">Visible sur la vitrine</Label>
                                </div>
                                <div className="sm:col-span-2 flex gap-3 pt-2">
                                    <Button type="submit" disabled={processing}>
                                        {editing ? 'Enregistrer' : 'Ajouter'}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Liste */}
                {temoignages.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
                            <p className="text-muted-foreground text-sm">Aucun témoignage. Ajoutez-en un.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {temoignages.map((t) => (
                            <Card key={t.id} className={`border ${t.actif ? 'border-border' : 'border-dashed opacity-60'}`}>
                                <CardContent className="pt-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2.5">
                                            {t.photo_url ? (
                                                <img src={t.photo_url} alt={t.nom} className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: 'oklch(0.65 0.19 45)' }}>
                                                    {t.initiales}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-semibold text-foreground text-sm">{t.nom}</p>
                                                <p className="text-xs text-muted-foreground">{t.role}</p>
                                            </div>
                                        </div>
                                        <Badge variant={t.actif ? 'default' : 'secondary'} className="text-xs">
                                            {t.actif ? 'Actif' : 'Inactif'}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-2">{t.entreprise}</p>
                                    <div className="flex mb-2">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star key={i} className={`w-3.5 h-3.5 ${i < t.note ? 'fill-primary text-primary' : 'text-muted-foreground/30'}`} />
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground italic line-clamp-3">"{t.contenu}"</p>
                                    <div className="flex items-center justify-between mt-4">
                                        <span className="text-xs text-muted-foreground">Ordre : {t.ordre}</span>
                                        <div className="flex gap-2">
                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(t)}>
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => destroy(t)}>
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
