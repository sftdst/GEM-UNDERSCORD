import { Head, Link, useForm } from '@inertiajs/react';
import { MessageSquare, Plus, Send } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { TicketSupport } from '@/types/models';

interface Props {
    tickets: TicketSupport[];
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Support', href: '/support' }];

const prioriteColors: Record<string, string> = {
    basse: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    normale: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    haute: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    urgente: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

const statutColors: Record<string, string> = {
    ouvert: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    en_cours: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    resolu: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    ferme: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const prioriteLabels: Record<string, string> = {
    basse: 'Basse',
    normale: 'Normale',
    haute: 'Haute',
    urgente: 'Urgente',
};

const statutLabels: Record<string, string> = {
    ouvert: 'Ouvert',
    en_cours: 'En cours',
    resolu: 'Resolu',
    ferme: 'Ferme',
};

export default function SupportIndex({ tickets }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const form = useForm({
        sujet: '',
        description: '',
        priorite: 'normale' as string,
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        form.post('/support', {
            onSuccess: () => {
                setShowCreate(false);
                form.reset();
            },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Support" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Support</h1>
                    <Dialog open={showCreate} onOpenChange={setShowCreate}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Nouveau ticket
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Nouveau ticket de support</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <Label>Sujet</Label>
                                    <Input
                                        value={form.data.sujet}
                                        onChange={(e) => form.setData('sujet', e.target.value)}
                                        placeholder="Decrivez brievement votre probleme"
                                        className="mt-1"
                                    />
                                    {form.errors.sujet && (
                                        <p className="mt-1 text-sm text-destructive">{form.errors.sujet}</p>
                                    )}
                                </div>
                                <div>
                                    <Label>Description</Label>
                                    <Textarea
                                        value={form.data.description}
                                        onChange={(e) => form.setData('description', e.target.value)}
                                        placeholder="Decrivez votre probleme en detail..."
                                        rows={5}
                                        className="mt-1"
                                    />
                                    {form.errors.description && (
                                        <p className="mt-1 text-sm text-destructive">{form.errors.description}</p>
                                    )}
                                </div>
                                <div>
                                    <Label>Priorite</Label>
                                    <Select
                                        value={form.data.priorite}
                                        onValueChange={(value) => form.setData('priorite', value)}
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Selectionnez une priorite" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="basse">Basse</SelectItem>
                                            <SelectItem value="normale">Normale</SelectItem>
                                            <SelectItem value="haute">Haute</SelectItem>
                                            <SelectItem value="urgente">Urgente</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {form.errors.priorite && (
                                        <p className="mt-1 text-sm text-destructive">{form.errors.priorite}</p>
                                    )}
                                </div>
                                <Button type="submit" disabled={form.processing} className="w-full">
                                    <Send className="mr-2 h-4 w-4" />
                                    Envoyer le ticket
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {tickets.length > 0 ? (
                    <div className="space-y-3">
                        {/* En-tete du tableau */}
                        <div className="hidden md:grid md:grid-cols-12 gap-4 px-5 py-2 text-sm font-medium text-muted-foreground">
                            <div className="col-span-5">Sujet</div>
                            <div className="col-span-2">Priorite</div>
                            <div className="col-span-2">Statut</div>
                            <div className="col-span-3 text-right">Date de creation</div>
                        </div>
                        {tickets.map((ticket) => (
                            <Link key={ticket.id} href={`/support/${ticket.id}`}>
                                <Card className="transition-colors hover:bg-accent">
                                    <CardContent className="p-4 md:p-5">
                                        <div className="flex flex-col gap-3 md:grid md:grid-cols-12 md:items-center md:gap-4">
                                            <div className="col-span-5">
                                                <h3 className="font-medium truncate">{ticket.sujet}</h3>
                                            </div>
                                            <div className="col-span-2">
                                                <Badge className={prioriteColors[ticket.priorite] ?? ''}>
                                                    {prioriteLabels[ticket.priorite] ?? ticket.priorite}
                                                </Badge>
                                            </div>
                                            <div className="col-span-2">
                                                <Badge className={statutColors[ticket.statut] ?? ''}>
                                                    {statutLabels[ticket.statut] ?? ticket.statut}
                                                </Badge>
                                            </div>
                                            <div className="col-span-3 text-sm text-muted-foreground md:text-right">
                                                {new Date(ticket.created_at).toLocaleDateString('fr-FR', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                })}
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
                            <MessageSquare className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
                            <h3 className="text-lg font-medium">Aucun ticket</h3>
                            <p className="mt-1 text-muted-foreground">
                                Vous n'avez pas encore de ticket de support.
                            </p>
                            <Button className="mt-4" onClick={() => setShowCreate(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Nouveau ticket
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
