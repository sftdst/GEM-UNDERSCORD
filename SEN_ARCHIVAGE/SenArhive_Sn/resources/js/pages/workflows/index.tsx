import { Head, router, usePage } from '@inertiajs/react';
import { GitBranch, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useState, useEffect, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Workflow, Utilisateur } from '@/types/models';

interface Props {
    workflows: Workflow[];
    utilisateurs: Pick<Utilisateur, 'id' | 'nom' | 'prenom' | 'email'>[];
}

interface EtapeForm {
    [key: string]: string;
    nom: string;
    approbateur_id: string;
}

export default function WorkflowIndex({ workflows, utilisateurs }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Workflows', href: '/workflows' },
    ];

    const [showCreate, setShowCreate] = useState(false);
    const [etapes, setEtapes] = useState<EtapeForm[]>([{ nom: '', approbateur_id: '' }]);
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();

    useEffect(() => {
        if (props.flash?.success) toast.success(props.flash.success);
        if (props.flash?.error) toast.error(props.flash.error);
    }, [props.flash]);

    const [nom, setNom] = useState('');
    const [description, setDescription] = useState('');
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    function addEtape() {
        setEtapes((prev) => [...prev, { nom: '', approbateur_id: '' }]);
    }

    function removeEtape(index: number) {
        setEtapes((prev) => prev.filter((_, i) => i !== index));
    }

    function updateEtape(index: number, field: keyof EtapeForm, value: string) {
        setEtapes((prev) => prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)));
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        router.post('/workflows', { nom, description, etapes }, {
            preserveScroll: true,
            onSuccess: () => {
                setShowCreate(false);
                setNom('');
                setDescription('');
                setEtapes([{ nom: '', approbateur_id: '' }]);
            },
            onError: (errs) => setErrors(errs),
            onFinish: () => setProcessing(false),
        });
    }

    function toggleWorkflow(wf: Workflow) {
        router.put(`/workflows/${wf.id}`, { actif: !wf.actif }, { preserveScroll: true });
    }

    function deleteWorkflow(wf: Workflow) {
        if (confirm('Supprimer ce workflow ?')) {
            router.delete(`/workflows/${wf.id}`, { preserveScroll: true });
        }
    }

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Workflows" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Workflows</h1>
                    <Dialog open={showCreate} onOpenChange={setShowCreate}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Nouveau workflow
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Creer un workflow</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <Label>Nom</Label>
                                    <Input
                                        value={nom}
                                        onChange={(e) => setNom(e.target.value)}
                                        className="mt-1"
                                    />
                                    {errors.nom && (
                                        <p className="mt-1 text-sm text-destructive">{errors.nom}</p>
                                    )}
                                </div>
                                <div>
                                    <Label>Description</Label>
                                    <Input
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <Label>Etapes de validation</Label>
                                        <Button type="button" variant="outline" size="sm" onClick={addEtape}>
                                            <Plus className="mr-1 h-3 w-3" />
                                            Ajouter
                                        </Button>
                                    </div>
                                    <div className="space-y-3">
                                        {etapes.map((etape, index) => (
                                            <div key={index} className="flex items-start gap-2 rounded-lg border p-3">
                                                <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                                                    {index + 1}
                                                </span>
                                                <div className="flex-1 space-y-2">
                                                    <Input
                                                        placeholder="Nom de l'etape"
                                                        value={etape.nom}
                                                        onChange={(e) => updateEtape(index, 'nom', e.target.value)}
                                                    />
                                                    <Select
                                                        value={etape.approbateur_id}
                                                        onValueChange={(v) => updateEtape(index, 'approbateur_id', v)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selectionner l'approbateur" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {utilisateurs?.map((u) => (
                                                                <SelectItem key={u.id} value={u.id}>
                                                                    {u.prenom} {u.nom} ({u.email})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                {etapes.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="mt-1"
                                                        onClick={() => removeEtape(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {errors.etapes && (
                                        <p className="mt-1 text-sm text-destructive">{errors.etapes}</p>
                                    )}
                                </div>

                                <Button type="submit" disabled={processing} className="w-full">
                                    {processing ? 'Creation en cours...' : 'Creer le workflow'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {workflows.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {workflows.map((wf) => (
                            <Card key={wf.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <GitBranch className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
                                            <div className="min-w-0">
                                                <p className="font-medium">{wf.nom}</p>
                                                {wf.description && (
                                                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                                                        {wf.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <Badge variant={wf.actif ? 'default' : 'secondary'}>
                                            {wf.actif ? 'Actif' : 'Inactif'}
                                        </Badge>
                                    </div>
                                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                                        <span>{wf.etapes?.length ?? 0} etape(s)</span>
                                        <span>&middot;</span>
                                        <span>Cree le {formatDate(wf.created_at)}</span>
                                    </div>
                                    <div className="mt-3 flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleWorkflow(wf)}
                                        >
                                            {wf.actif ? (
                                                <><ToggleRight className="mr-1 h-4 w-4" /> Desactiver</>
                                            ) : (
                                                <><ToggleLeft className="mr-1 h-4 w-4" /> Activer</>
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive"
                                            onClick={() => deleteWorkflow(wf)}
                                        >
                                            <Trash2 className="mr-1 h-4 w-4" />
                                            Supprimer
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-1 items-center justify-center text-center">
                        <div>
                            <GitBranch className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
                            <h3 className="text-lg font-medium">Aucun workflow</h3>
                            <p className="text-muted-foreground">
                                Creez votre premier workflow pour automatiser vos processus de validation.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
