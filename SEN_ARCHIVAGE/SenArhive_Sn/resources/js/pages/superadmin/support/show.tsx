import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { ArrowLeft, Send, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useEffect, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import SuperAdminLayout from '@/layouts/superadmin-layout';

interface Message {
    id: string;
    message: string;
    est_interne: boolean;
    created_at: string;
    utilisateur: { id: string; nom: string; prenom: string } | null;
}

interface Ticket {
    id: string;
    sujet: string;
    description: string;
    priorite: string;
    statut: string;
    created_at: string;
    utilisateur: { id: string; nom: string; prenom: string; email: string } | null;
    organisation: { id: string; nom: string } | null;
    messages: Message[];
}

const prioriteColors: Record<string, string> = {
    basse:   'bg-gray-100 text-gray-700',
    normale: 'bg-blue-100 text-blue-700',
    haute:   'bg-orange-100 text-orange-700',
    urgente: 'bg-red-100 text-red-700',
};

const statutColors: Record<string, string> = {
    ouvert:   'bg-blue-100 text-blue-700',
    en_cours: 'bg-yellow-100 text-yellow-700',
    resolu:   'bg-green-100 text-green-700',
    ferme:    'bg-gray-100 text-gray-700',
};

function formatDate(d: string) {
    return new Date(d).toLocaleString('fr-FR', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

export default function SuperAdminSupportShow({ ticket }: { ticket: Ticket }) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const form = useForm({ message: '' });

    useEffect(() => {
        if (props.flash?.success) toast.success(props.flash.success);
        if (props.flash?.error) toast.error(props.flash.error);
    }, [props.flash]);

    function submit(e: FormEvent) {
        e.preventDefault();
        form.post(`/superadmin/support/${ticket.id}/reply`, {
            onSuccess: () => form.reset(),
            preserveScroll: true,
        });
    }

    function changerStatut(statut: string) {
        router.post(`/superadmin/support/${ticket.id}/statut`, { statut }, { preserveScroll: true });
    }

    return (
        <SuperAdminLayout breadcrumbs={[
            { title: 'Support', href: '/superadmin/support' },
            { title: ticket.sujet, href: `/superadmin/support/${ticket.id}` },
        ]}>
            <Head title={`Ticket — ${ticket.sujet}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">

                {/* Header */}
                <div className="flex items-start gap-3">
                    <Link href="/superadmin/support">
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold truncate">{ticket.sujet}</h1>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Badge className={statutColors[ticket.statut] ?? ''}>{ticket.statut}</Badge>
                            <Badge className={prioriteColors[ticket.priorite] ?? ''}>{ticket.priorite}</Badge>
                            <span className="text-xs text-muted-foreground">
                                {ticket.organisation?.nom ?? '—'}
                                {ticket.utilisateur && ` — ${ticket.utilisateur.prenom} ${ticket.utilisateur.nom}`}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                Créé le {formatDate(ticket.created_at)}
                            </span>
                        </div>
                    </div>
                    {/* Changement de statut */}
                    <div className="shrink-0 flex items-center gap-2">
                        <Select value={ticket.statut} onValueChange={changerStatut}>
                            <SelectTrigger className="w-36 h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ouvert">Ouvert</SelectItem>
                                <SelectItem value="en_cours">En cours</SelectItem>
                                <SelectItem value="resolu">Résolu</SelectItem>
                                <SelectItem value="ferme">Fermé</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Colonne principale : description + messages */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Description initiale */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">Description du problème</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
                            </CardContent>
                        </Card>

                        {/* Fil de messages */}
                        {ticket.messages.length > 0 && (
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">
                                        Échanges ({ticket.messages.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {ticket.messages.map(msg => (
                                        <div key={msg.id} className={`rounded-lg p-3 text-sm ${msg.utilisateur ? 'bg-muted/50' : 'bg-primary/5 border border-primary/10'}`}>
                                            <div className="flex items-center justify-between mb-1 gap-2">
                                                <span className="font-semibold text-xs">
                                                    {msg.utilisateur
                                                        ? `${msg.utilisateur.prenom} ${msg.utilisateur.nom}`
                                                        : '🛠 SuperAdmin'}
                                                </span>
                                                <span className="text-xs text-muted-foreground shrink-0">
                                                    {formatDate(msg.created_at)}
                                                </span>
                                            </div>
                                            <p className="whitespace-pre-wrap">{msg.message}</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Formulaire de réponse */}
                        {ticket.statut !== 'ferme' && (
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">Répondre</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={submit} className="space-y-3">
                                        <div>
                                            <Label className="sr-only">Réponse</Label>
                                            <Textarea
                                                value={form.data.message}
                                                onChange={e => form.setData('message', e.target.value)}
                                                placeholder="Votre réponse au client..."
                                                rows={4}
                                            />
                                            {form.errors.message && (
                                                <p className="mt-1 text-sm text-destructive">{form.errors.message}</p>
                                            )}
                                        </div>
                                        <Button type="submit" disabled={form.processing || !form.data.message.trim()}>
                                            <Send className="mr-2 h-4 w-4" />
                                            {form.processing ? 'Envoi...' : 'Envoyer la réponse'}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Colonne droite : infos */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">Informations</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-0.5">Organisation</p>
                                    <p className="font-medium">{ticket.organisation?.nom ?? '—'}</p>
                                </div>
                                <Separator />
                                <div>
                                    <p className="text-xs text-muted-foreground mb-0.5">Auteur</p>
                                    <p className="font-medium">
                                        {ticket.utilisateur
                                            ? `${ticket.utilisateur.prenom} ${ticket.utilisateur.nom}`
                                            : '—'}
                                    </p>
                                    {ticket.utilisateur?.email && (
                                        <p className="text-xs text-muted-foreground">{ticket.utilisateur.email}</p>
                                    )}
                                </div>
                                <Separator />
                                <div>
                                    <p className="text-xs text-muted-foreground mb-0.5">Actions rapides</p>
                                    <div className="flex flex-col gap-1 mt-1">
                                        {ticket.statut !== 'resolu' && (
                                            <Button size="sm" variant="outline" className="justify-start text-green-700 border-green-200"
                                                onClick={() => changerStatut('resolu')}>
                                                <CheckCircle className="mr-2 h-3.5 w-3.5" />Marquer résolu
                                            </Button>
                                        )}
                                        {ticket.statut !== 'ferme' && (
                                            <Button size="sm" variant="outline" className="justify-start text-muted-foreground"
                                                onClick={() => changerStatut('ferme')}>
                                                <XCircle className="mr-2 h-3.5 w-3.5" />Fermer le ticket
                                            </Button>
                                        )}
                                        {(ticket.statut === 'ferme' || ticket.statut === 'resolu') && (
                                            <Button size="sm" variant="outline" className="justify-start"
                                                onClick={() => changerStatut('ouvert')}>
                                                <RefreshCw className="mr-2 h-3.5 w-3.5" />Rouvrir
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </SuperAdminLayout>
    );
}
