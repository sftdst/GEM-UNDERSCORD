import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Send } from 'lucide-react';
import { type FormEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { TicketSupport, MessageTicket } from '@/types/models';

interface Props {
    ticket: TicketSupport & {
        messages: MessageTicket[];
    };
}

const statutColors: Record<string, string> = {
    ouvert: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    en_cours: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    resolu: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    ferme: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const prioriteColors: Record<string, string> = {
    basse: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    normale: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    haute: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    urgente: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

export default function SupportShow({ ticket }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Support', href: '/support' },
        { title: ticket.sujet, href: `/support/${ticket.id}` },
    ];

    const form = useForm({ message: '' });

    function submit(e: FormEvent) {
        e.preventDefault();
        form.post(`/support/${ticket.id}/reply`, {
            onSuccess: () => form.reset(),
            preserveScroll: true,
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={ticket.sujet} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex items-start gap-3">
                    <Link href="/support">
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold">{ticket.sujet}</h1>
                        <div className="mt-2 flex items-center gap-2">
                            <Badge className={statutColors[ticket.statut] ?? ''}>{ticket.statut}</Badge>
                            <Badge className={prioriteColors[ticket.priorite] ?? ''}>{ticket.priorite}</Badge>
                            <span className="text-sm text-muted-foreground">
                                Créé le {new Date(ticket.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Messages thread */}
                <div className="flex-1 space-y-4 overflow-y-auto">
                    {ticket.messages.map((msg) => (
                        <div key={msg.id} className={`rounded-lg border p-4 ${msg.utilisateur ? '' : 'border-primary/20 bg-primary/5'}`}>
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-sm font-semibold">
                                    {msg.utilisateur
                                        ? `${msg.utilisateur.prenom} ${msg.utilisateur.nom}`
                                        : '🛠 Support SenArchive'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {new Date(msg.created_at).toLocaleString('fr-FR', {
                                        day: 'numeric', month: 'short', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit',
                                    })}
                                </span>
                            </div>
                            <p className="whitespace-pre-wrap text-sm">{msg.message}</p>
                        </div>
                    ))}

                    {ticket.messages.length === 0 && (
                        <div className="text-center text-sm text-muted-foreground py-8">
                            Aucun message pour le moment.
                        </div>
                    )}
                </div>

                {/* Reply form */}
                {ticket.statut !== 'ferme' && (
                    <form onSubmit={submit} className="flex gap-3 border-t pt-4">
                        <Textarea
                            value={form.data.message}
                            onChange={(e) => form.setData('message', e.target.value)}
                            placeholder="Votre réponse..."
                            rows={3}
                            className="flex-1"
                        />
                        <Button type="submit" disabled={form.processing || !form.data.message.trim()} size="icon" className="h-auto">
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                )}
            </div>
        </AppLayout>
    );
}
