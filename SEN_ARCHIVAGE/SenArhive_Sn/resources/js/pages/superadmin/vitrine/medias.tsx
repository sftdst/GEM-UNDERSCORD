import { Head, useForm, router } from '@inertiajs/react';
import { Camera, Edit2, MonitorPlay, Play, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
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
    { title: 'Vidéos & Captures', href: '/superadmin/vitrine/medias' },
];

interface Media {
    id: number;
    type: 'video' | 'screenshot';
    titre: string;
    description: string | null;
    url: string;
    thumbnail_url: string | null;
    section: string | null;
    duree_secondes: number | null;
    ordre: number;
    actif: boolean;
}

const emptyForm = {
    type: 'video' as 'video' | 'screenshot',
    titre: '',
    description: '',
    url: '',
    thumbnail_url: '',
    section: '',
    duree_secondes: '' as string | number,
    ordre: 0,
    actif: true,
};

function formatDuree(sec: number | null): string {
    if (!sec) return '';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

export default function VitrineMedias({ medias, sections }: { medias: Media[]; sections: string[] }) {
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Media | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'video' | 'screenshot'>('all');

    const { data, setData, post, put, processing, errors, reset } = useForm({ ...emptyForm });

    const filtered = activeTab === 'all' ? medias : medias.filter(m => m.type === activeTab);

    function openCreate() { reset(); setEditing(null); setShowForm(true); }
    function openEdit(m: Media) {
        setData({
            type: m.type, titre: m.titre, description: m.description ?? '',
            url: m.url, thumbnail_url: m.thumbnail_url ?? '',
            section: m.section ?? '', duree_secondes: m.duree_secondes ?? '',
            ordre: m.ordre, actif: m.actif,
        });
        setEditing(m); setShowForm(true);
    }
    function submit(e: React.FormEvent) {
        e.preventDefault();
        const payload = {
            ...data,
            duree_secondes: data.duree_secondes === '' ? null : Number(data.duree_secondes),
        };
        if (editing) put(`/superadmin/vitrine/medias/${editing.id}`, { data: payload, onSuccess: () => { setShowForm(false); setEditing(null); } });
        else post('/superadmin/vitrine/medias', { data: payload, onSuccess: () => { setShowForm(false); reset(); } });
    }
    function destroy(m: Media) {
        if (confirm(`Supprimer "${m.titre}" ?`)) router.delete(`/superadmin/vitrine/medias/${m.id}`);
    }
    function toggle(m: Media) {
        router.post(`/superadmin/vitrine/medias/${m.id}/toggle`);
    }

    return (
        <SuperAdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Médias Vitrine" />
            <div className="flex flex-col gap-6 p-4 md:p-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Vidéos & Captures d'écran</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {medias.filter(m => m.type === 'video').length} vidéo(s) · {medias.filter(m => m.type === 'screenshot').length} capture(s)
                        </p>
                    </div>
                    <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Ajouter</Button>
                </div>

                {/* Formulaire */}
                {showForm && (
                    <Card className="border-primary/30">
                        <CardHeader>
                            <CardTitle className="text-base">{editing ? 'Modifier le média' : 'Nouveau média'}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
                                {/* Type */}
                                <div className="sm:col-span-2 space-y-1">
                                    <Label>Type *</Label>
                                    <div className="flex gap-3">
                                        {(['video', 'screenshot'] as const).map(t => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setData('type', t)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors ${data.type === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'}`}
                                            >
                                                {t === 'video' ? <Play className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                                                {t === 'video' ? 'Vidéo tutoriel' : "Capture d'écran"}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="titre">Titre *</Label>
                                    <Input id="titre" value={data.titre} onChange={e => setData('titre', e.target.value)} placeholder="Tutoriel archivage de documents" />
                                    {errors.titre && <p className="text-destructive text-xs">{errors.titre}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="section">Section / Fonctionnalité</Label>
                                    <Input
                                        id="section"
                                        value={data.section}
                                        onChange={e => setData('section', e.target.value)}
                                        list="sections-list"
                                        placeholder="Archivage & Organisation"
                                    />
                                    <datalist id="sections-list">
                                        {sections.map(s => <option key={s} value={s} />)}
                                    </datalist>
                                </div>
                                <div className="sm:col-span-2 space-y-1">
                                    <Label htmlFor="url">
                                        URL {data.type === 'video' ? 'YouTube (embed) ou chemin' : "de l'image"} *
                                    </Label>
                                    <Input
                                        id="url"
                                        value={data.url}
                                        onChange={e => setData('url', e.target.value)}
                                        placeholder={data.type === 'video' ? 'https://www.youtube.com/embed/...' : 'https://... ou /storage/screenshots/...'}
                                    />
                                    {errors.url && <p className="text-destructive text-xs">{errors.url}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="thumbnail_url">URL Miniature</Label>
                                    <Input id="thumbnail_url" value={data.thumbnail_url} onChange={e => setData('thumbnail_url', e.target.value)} placeholder="https://..." />
                                </div>
                                {data.type === 'video' && (
                                    <div className="space-y-1">
                                        <Label htmlFor="duree_secondes">Durée (secondes)</Label>
                                        <Input
                                            id="duree_secondes"
                                            type="number"
                                            min={1}
                                            value={data.duree_secondes}
                                            onChange={e => setData('duree_secondes', e.target.value)}
                                            placeholder="222"
                                        />
                                    </div>
                                )}
                                <div className="sm:col-span-2 space-y-1">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea id="description" rows={2} value={data.description} onChange={e => setData('description', e.target.value)} placeholder="Description courte..." maxLength={500} />
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

                {/* Tabs */}
                <div className="flex gap-2">
                    {(['all', 'video', 'screenshot'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${activeTab === tab ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-accent'}`}
                        >
                            {tab === 'all' ? `Tous (${medias.length})` : tab === 'video' ? `Vidéos (${medias.filter(m => m.type === 'video').length})` : `Captures (${medias.filter(m => m.type === 'screenshot').length})`}
                        </button>
                    ))}
                </div>

                {/* Liste */}
                {filtered.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <MonitorPlay className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
                            <p className="text-muted-foreground text-sm">Aucun média. Ajoutez une vidéo ou une capture d'écran.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filtered.map((m) => (
                            <Card key={m.id} className={`border overflow-hidden ${m.actif ? 'border-border' : 'border-dashed opacity-60'}`}>
                                {/* Thumbnail */}
                                <div className="relative bg-muted aspect-video flex items-center justify-center overflow-hidden">
                                    {m.thumbnail_url ? (
                                        <img src={m.thumbnail_url} alt={m.titre} className="w-full h-full object-cover" />
                                    ) : m.type === 'screenshot' && m.url ? (
                                        <img src={m.url} alt={m.titre} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground/40">
                                            {m.type === 'video' ? <Play className="w-8 h-8" /> : <Camera className="w-8 h-8" />}
                                            <span className="text-xs">Pas de miniature</span>
                                        </div>
                                    )}
                                    <div className="absolute top-2 left-2">
                                        <Badge variant={m.type === 'video' ? 'default' : 'secondary'} className="text-xs">
                                            {m.type === 'video' ? '▶ Vidéo' : '📷 Capture'}
                                        </Badge>
                                    </div>
                                    {m.duree_secondes && (
                                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                                            {formatDuree(m.duree_secondes)}
                                        </div>
                                    )}
                                </div>
                                <CardContent className="pt-4">
                                    <div className="flex items-start justify-between mb-1">
                                        <p className="font-semibold text-foreground text-sm line-clamp-1">{m.titre}</p>
                                        <Badge variant={m.actif ? 'default' : 'secondary'} className="text-xs ml-2 flex-shrink-0">
                                            {m.actif ? 'Actif' : 'Inactif'}
                                        </Badge>
                                    </div>
                                    {m.section && <p className="text-xs text-primary mb-1">{m.section}</p>}
                                    {m.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{m.description}</p>}
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">Ordre : {m.ordre}</span>
                                        <div className="flex gap-1">
                                            <Button size="icon" variant="ghost" className="h-7 w-7" title={m.actif ? 'Désactiver' : 'Activer'} onClick={() => toggle(m)}>
                                                {m.actif ? <ToggleRight className="h-4 w-4 text-primary" /> : <ToggleLeft className="h-4 w-4" />}
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(m)}>
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => destroy(m)}>
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
