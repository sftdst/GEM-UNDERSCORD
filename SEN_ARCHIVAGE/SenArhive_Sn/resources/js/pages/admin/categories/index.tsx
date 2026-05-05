import { Head, useForm, router } from '@inertiajs/react';
import { Plus, Pencil, Trash2, FolderTree, ChevronRight } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Categorie } from '@/types/models';

interface Props {
    categories: Categorie[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Administration', href: '/admin' },
    { title: 'Categories', href: '/admin/categories' },
];

/** Flatten the hierarchy to get all categories for the parent select */
function flattenCategories(categories: Categorie[]): Categorie[] {
    const result: Categorie[] = [];
    for (const cat of categories) {
        result.push(cat);
        if (cat.enfants && cat.enfants.length > 0) {
            result.push(...flattenCategories(cat.enfants));
        }
    }
    return result;
}

function CategorieNode({
    categorie,
    allCategories,
    onEdit,
    onDelete,
    depth = 0,
}: {
    categorie: Categorie;
    allCategories: Categorie[];
    onEdit: (cat: Categorie) => void;
    onDelete: (cat: Categorie) => void;
    depth?: number;
}) {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = categorie.enfants && categorie.enfants.length > 0;

    return (
        <div>
            <div
                className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"
                style={{ paddingLeft: `${depth * 24 + 12}px` }}
            >
                <div className="flex items-center gap-2">
                    {hasChildren ? (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="flex h-5 w-5 items-center justify-center text-muted-foreground transition-transform"
                        >
                            <ChevronRight className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                        </button>
                    ) : (
                        <span className="w-5" />
                    )}
                    <FolderTree className="h-4 w-4 text-[#ff7631]" />
                    <div>
                        <span className="font-medium">{categorie.nom}</span>
                        {categorie.description && (
                            <p className="text-xs text-muted-foreground">{categorie.description}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(categorie)} title="Modifier">
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(categorie)}
                        title="Supprimer"
                        className="text-red-600 hover:text-red-700"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            {hasChildren && expanded && (
                <div>
                    {categorie.enfants!.map((child) => (
                        <CategorieNode
                            key={child.id}
                            categorie={child}
                            allCategories={allCategories}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function CategoriesIndex({ categories }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [editCategorie, setEditCategorie] = useState<Categorie | null>(null);

    const allFlat = flattenCategories(categories);

    const createForm = useForm({
        nom: '',
        description: '',
        parent_id: '' as string,
    });

    const editForm = useForm({
        nom: '',
        description: '',
        parent_id: '' as string,
    });

    function submitCreate(e: FormEvent) {
        e.preventDefault();
        createForm.post('/admin/categories', {
            onSuccess: () => {
                setShowCreate(false);
                createForm.reset();
            },
        });
    }

    function openEdit(cat: Categorie) {
        setEditCategorie(cat);
        editForm.setData({
            nom: cat.nom,
            description: cat.description ?? '',
            parent_id: cat.parent_id ?? '',
        });
    }

    function submitEdit(e: FormEvent) {
        e.preventDefault();
        if (!editCategorie) return;
        editForm.put(`/admin/categories/${editCategorie.id}`, {
            onSuccess: () => {
                setEditCategorie(null);
                editForm.reset();
            },
        });
    }

    function deleteCategorie(cat: Categorie) {
        if (!confirm(`Supprimer la categorie "${cat.nom}" ? Ses sous-categories seront detachees.`)) return;
        router.delete(`/admin/categories/${cat.id}`);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Categories" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Categories</h1>
                    <Dialog open={showCreate} onOpenChange={setShowCreate}>
                        <DialogTrigger asChild>
                            <Button><Plus className="mr-2 h-4 w-4" />Nouvelle categorie</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader><DialogTitle>Creer une categorie</DialogTitle></DialogHeader>
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
                                    <Label>Description</Label>
                                    <Textarea
                                        value={createForm.data.description}
                                        onChange={(e) => createForm.setData('description', e.target.value)}
                                        className="mt-1"
                                        rows={3}
                                    />
                                    {createForm.errors.description && <p className="mt-1 text-sm text-red-600">{createForm.errors.description}</p>}
                                </div>
                                <div>
                                    <Label>Categorie parente</Label>
                                    <select
                                        value={createForm.data.parent_id}
                                        onChange={(e) => createForm.setData('parent_id', e.target.value)}
                                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="">Aucune (racine)</option>
                                        {allFlat.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.nom}</option>
                                        ))}
                                    </select>
                                    {createForm.errors.parent_id && <p className="mt-1 text-sm text-red-600">{createForm.errors.parent_id}</p>}
                                </div>
                                <Button type="submit" disabled={createForm.processing} className="w-full">
                                    Creer
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {categories.length > 0 ? (
                    <Card>
                        <CardContent className="p-4">
                            <div className="divide-y">
                                {categories.map((cat) => (
                                    <CategorieNode
                                        key={cat.id}
                                        categorie={cat}
                                        allCategories={allFlat}
                                        onEdit={openEdit}
                                        onDelete={deleteCategorie}
                                    />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="flex flex-1 items-center justify-center">
                        <div className="text-center">
                            <FolderTree className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
                            <h3 className="text-lg font-medium">Aucune categorie</h3>
                            <p className="mt-1 text-muted-foreground">Creez votre premiere categorie.</p>
                            <Button className="mt-4" onClick={() => setShowCreate(true)}>
                                <Plus className="mr-2 h-4 w-4" />Nouvelle categorie
                            </Button>
                        </div>
                    </div>
                )}

                {/* Edit Dialog */}
                <Dialog open={!!editCategorie} onOpenChange={(open) => { if (!open) setEditCategorie(null); }}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader><DialogTitle>Modifier la categorie</DialogTitle></DialogHeader>
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
                                <Label>Description</Label>
                                <Textarea
                                    value={editForm.data.description}
                                    onChange={(e) => editForm.setData('description', e.target.value)}
                                    className="mt-1"
                                    rows={3}
                                />
                                {editForm.errors.description && <p className="mt-1 text-sm text-red-600">{editForm.errors.description}</p>}
                            </div>
                            <div>
                                <Label>Categorie parente</Label>
                                <select
                                    value={editForm.data.parent_id}
                                    onChange={(e) => editForm.setData('parent_id', e.target.value)}
                                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                >
                                    <option value="">Aucune (racine)</option>
                                    {allFlat
                                        .filter((cat) => cat.id !== editCategorie?.id)
                                        .map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.nom}</option>
                                        ))}
                                </select>
                                {editForm.errors.parent_id && <p className="mt-1 text-sm text-red-600">{editForm.errors.parent_id}</p>}
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
