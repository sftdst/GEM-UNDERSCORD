import { Head, Link, useForm } from '@inertiajs/react';
import { FolderOpen, Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Espace } from '@/types/models';

interface Props {
    espaces: Espace[];
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Espaces', href: '/espaces' }];

const defaultColors = ['#ff7631', '#002f59', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

export default function EspacesIndex({ espaces }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const form = useForm({ nom: '', description: '', couleur: '#ff7631', icone: '' });

    function submit(e: FormEvent) {
        e.preventDefault();
        form.post('/espaces', { onSuccess: () => { setShowCreate(false); form.reset(); } });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Espaces" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Espaces de travail</h1>
                    <Dialog open={showCreate} onOpenChange={setShowCreate}>
                        <DialogTrigger asChild>
                            <Button><Plus className="mr-2 h-4 w-4" />Nouvel espace</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Creer un espace</DialogTitle></DialogHeader>
                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <Label>Nom</Label>
                                    <Input value={form.data.nom} onChange={(e) => form.setData('nom', e.target.value)} className="mt-1" />
                                </div>
                                <div>
                                    <Label>Description</Label>
                                    <Input value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} className="mt-1" />
                                </div>
                                <div>
                                    <Label>Couleur</Label>
                                    <div className="mt-2 flex gap-2">
                                        {defaultColors.map((c) => (
                                            <button key={c} type="button" onClick={() => form.setData('couleur', c)}
                                                className={`h-8 w-8 rounded-full border-2 ${form.data.couleur === c ? 'border-foreground' : 'border-transparent'}`}
                                                style={{ backgroundColor: c }} />
                                        ))}
                                    </div>
                                </div>
                                <Button type="submit" disabled={form.processing} className="w-full">Creer</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {espaces.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {espaces.map((espace) => (
                            <Link key={espace.id} href={`/espaces/${espace.id}`}>
                                <Card className="transition-colors hover:bg-accent">
                                    <CardContent className="p-5">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: espace.couleur ?? '#ff7631' }}>
                                                <FolderOpen className="h-6 w-6 text-white" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="truncate font-semibold">{espace.nom}</h3>
                                                {espace.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{espace.description}</p>}
                                                <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                                                    <span>{espace.dossiers_count ?? 0} dossiers</span>
                                                    <span>{espace.documents_count ?? 0} documents</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-1 items-center justify-center">
                        <div className="text-center">
                            <FolderOpen className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
                            <h3 className="text-lg font-medium">Aucun espace</h3>
                            <p className="mt-1 text-muted-foreground">Creez votre premier espace de travail.</p>
                            <Button className="mt-4" onClick={() => setShowCreate(true)}>
                                <Plus className="mr-2 h-4 w-4" />Creer un espace
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
