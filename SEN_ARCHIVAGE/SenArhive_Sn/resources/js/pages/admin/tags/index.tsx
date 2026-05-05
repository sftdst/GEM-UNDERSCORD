import { Head, useForm, router } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Tag as TagIcon, FileText } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Tag } from '@/types/models';

interface TagWithCount extends Tag {
    documents_count: number;
}

interface Props {
    tags: TagWithCount[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Administration', href: '/admin' },
    { title: 'Tags', href: '/admin/tags' },
];

const DEFAULT_COULEUR = '#ff7631';

export default function TagsIndex({ tags }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [editTag, setEditTag] = useState<TagWithCount | null>(null);

    const createForm = useForm({
        nom: '',
        couleur: DEFAULT_COULEUR,
    });

    const editForm = useForm({
        nom: '',
        couleur: DEFAULT_COULEUR,
    });

    function submitCreate(e: FormEvent) {
        e.preventDefault();
        createForm.post('/admin/tags', {
            onSuccess: () => {
                setShowCreate(false);
                createForm.setData({ nom: '', couleur: DEFAULT_COULEUR });
            },
        });
    }

    function openEdit(tag: TagWithCount) {
        setEditTag(tag);
        editForm.setData({
            nom: tag.nom,
            couleur: tag.couleur ?? DEFAULT_COULEUR,
        });
    }

    function submitEdit(e: FormEvent) {
        e.preventDefault();
        if (!editTag) return;
        editForm.put(`/admin/tags/${editTag.id}`, {
            onSuccess: () => {
                setEditTag(null);
                editForm.setData({ nom: '', couleur: DEFAULT_COULEUR });
            },
        });
    }

    function deleteTag(tag: TagWithCount) {
        if (!confirm(`Supprimer le tag "${tag.nom}" ? Il sera retire de tous les documents associes.`)) return;
        router.delete(`/admin/tags/${tag.id}`);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tags" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Tags</h1>
                    <Dialog open={showCreate} onOpenChange={setShowCreate}>
                        <DialogTrigger asChild>
                            <Button><Plus className="mr-2 h-4 w-4" />Nouveau tag</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader><DialogTitle>Creer un tag</DialogTitle></DialogHeader>
                            <form onSubmit={submitCreate} className="space-y-4">
                                <div>
                                    <Label>Nom</Label>
                                    <Input
                                        value={createForm.data.nom}
                                        onChange={(e) => createForm.setData('nom', e.target.value)}
                                        className="mt-1"
                                    />
                                    {createForm.errors.nom && <p className="mt-1 text-sm text-red-600">{createForm.errors.nom}</p>}
                                </div>
                                <div>
                                    <Label>Couleur</Label>
                                    <div className="mt-1 flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={createForm.data.couleur}
                                            onChange={(e) => createForm.setData('couleur', e.target.value)}
                                            className="h-10 w-14 cursor-pointer rounded border border-input"
                                        />
                                        <Input
                                            value={createForm.data.couleur}
                                            onChange={(e) => createForm.setData('couleur', e.target.value)}
                                            className="flex-1 font-mono"
                                            maxLength={7}
                                            placeholder="#ff7631"
                                        />
                                    </div>
                                    {createForm.errors.couleur && <p className="mt-1 text-sm text-red-600">{createForm.errors.couleur}</p>}
                                </div>
                                <Button type="submit" disabled={createForm.processing} className="w-full">
                                    Creer
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {tags.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {tags.map((tag) => (
                            <Card key={tag.id} className="group relative overflow-hidden">
                                <div
                                    className="absolute left-0 top-0 h-full w-1"
                                    style={{ backgroundColor: tag.couleur ?? DEFAULT_COULEUR }}
                                />
                                <CardContent className="p-5 pl-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <div
                                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                                                style={{ backgroundColor: `${tag.couleur ?? DEFAULT_COULEUR}20` }}
                                            >
                                                <TagIcon
                                                    className="h-5 w-5"
                                                    style={{ color: tag.couleur ?? DEFAULT_COULEUR }}
                                                />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">{tag.nom}</h3>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <Badge
                                                        variant="outline"
                                                        style={{
                                                            borderColor: tag.couleur ?? DEFAULT_COULEUR,
                                                            color: tag.couleur ?? DEFAULT_COULEUR,
                                                        }}
                                                    >
                                                        <div
                                                            className="mr-1.5 h-2 w-2 rounded-full"
                                                            style={{ backgroundColor: tag.couleur ?? DEFAULT_COULEUR }}
                                                        />
                                                        {tag.couleur ?? DEFAULT_COULEUR}
                                                    </Badge>
                                                </div>
                                                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                                                    <FileText className="h-3 w-3" />
                                                    {tag.documents_count} document{tag.documents_count !== 1 ? 's' : ''}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(tag)} title="Modifier">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => deleteTag(tag)}
                                                title="Supprimer"
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-1 items-center justify-center">
                        <div className="text-center">
                            <TagIcon className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
                            <h3 className="text-lg font-medium">Aucun tag</h3>
                            <p className="mt-1 text-muted-foreground">Creez votre premier tag.</p>
                            <Button className="mt-4" onClick={() => setShowCreate(true)}>
                                <Plus className="mr-2 h-4 w-4" />Nouveau tag
                            </Button>
                        </div>
                    </div>
                )}

                {/* Edit Dialog */}
                <Dialog open={!!editTag} onOpenChange={(open) => { if (!open) setEditTag(null); }}>
                    <DialogContent className="max-w-md">
                        <DialogHeader><DialogTitle>Modifier le tag</DialogTitle></DialogHeader>
                        <form onSubmit={submitEdit} className="space-y-4">
                            <div>
                                <Label>Nom</Label>
                                <Input
                                    value={editForm.data.nom}
                                    onChange={(e) => editForm.setData('nom', e.target.value)}
                                    className="mt-1"
                                />
                                {editForm.errors.nom && <p className="mt-1 text-sm text-red-600">{editForm.errors.nom}</p>}
                            </div>
                            <div>
                                <Label>Couleur</Label>
                                <div className="mt-1 flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={editForm.data.couleur}
                                        onChange={(e) => editForm.setData('couleur', e.target.value)}
                                        className="h-10 w-14 cursor-pointer rounded border border-input"
                                    />
                                    <Input
                                        value={editForm.data.couleur}
                                        onChange={(e) => editForm.setData('couleur', e.target.value)}
                                        className="flex-1 font-mono"
                                        maxLength={7}
                                        placeholder="#ff7631"
                                    />
                                </div>
                                {editForm.errors.couleur && <p className="mt-1 text-sm text-red-600">{editForm.errors.couleur}</p>}
                            </div>
                            <Button type="submit" disabled={editForm.processing} className="w-full">
                                Enregistrer
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
