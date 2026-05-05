import { Head, router, useForm } from '@inertiajs/react';
import { MessageSquare, Send, User, FileText, Search, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Utilisateur, Document } from '@/types/models';

interface MessageItem {
    id: string;
    contenu: string;
    est_expediteur: boolean;
    expediteur: Utilisateur;
    document: Document | null;
    lu: boolean;
    created_at: string;
}

interface Conversation {
    interlocuteur: Utilisateur;
    dernier_message: {
        contenu: string;
        created_at: string;
        est_expediteur: boolean;
    };
    non_lus: number;
}

interface Props {
    conversations: Conversation[];
    utilisateurs: Utilisateur[];
    interlocuteurActifId: string | null;
    messages: MessageItem[];
    documents: Document[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Messagerie', href: '/messagerie' },
];

function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return d.toLocaleDateString('fr-FR', { weekday: 'short' });
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function initials(u: { nom: string; prenom: string }) {
    return `${u.prenom[0] ?? ''}${u.nom[0] ?? ''}`.toUpperCase();
}

export default function MessagerieIndex({
    conversations,
    utilisateurs,
    interlocuteurActifId,
    messages,
    documents,
}: Props) {
    const [searchConv, setSearchConv] = useState('');
    const [showNewConv, setShowNewConv] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const sendForm = useForm({
        destinataire_id: interlocuteurActifId ?? '',
        contenu: '',
        document_id: '',
    });

    // Find active interlocutor
    const actifConv = conversations.find((c) => c.interlocuteur.id === interlocuteurActifId);
    const actifUser = actifConv?.interlocuteur ?? utilisateurs.find((u) => u.id === interlocuteurActifId);

    // Polling every 5 seconds
    useEffect(() => {
        if (!interlocuteurActifId) return;
        const interval = setInterval(() => {
            router.reload({ only: ['conversations', 'messages'] });
        }, 5000);
        return () => clearInterval(interval);
    }, [interlocuteurActifId]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const filteredConversations = conversations.filter((c) => {
        const name = `${c.interlocuteur.prenom} ${c.interlocuteur.nom}`.toLowerCase();
        return name.includes(searchConv.toLowerCase());
    });

    function openConversation(userId: string) {
        router.get(`/messagerie/${userId}`);
    }

    function sendMessage(e: React.FormEvent) {
        e.preventDefault();
        if (!sendForm.data.contenu.trim()) return;
        sendForm.post('/messagerie', {
            preserveScroll: true,
            onSuccess: () => {
                sendForm.reset('contenu', 'document_id');
            },
        });
    }

    function startNewConversation(userId: string) {
        setShowNewConv(false);
        router.get(`/messagerie/${userId}`);
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(e as unknown as React.FormEvent);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Messagerie" />

            <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-xl border border-border bg-card">
                {/* Left panel: conversations list */}
                <div className="flex w-80 flex-shrink-0 flex-col border-r border-border">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-border p-4">
                        <h2 className="font-semibold text-foreground">Messages</h2>
                        <Dialog open={showNewConv} onOpenChange={setShowNewConv}>
                            <DialogTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-8 w-8">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Nouvelle conversation</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-3 py-2">
                                    {utilisateurs.map((u) => (
                                        <button
                                            key={u.id}
                                            onClick={() => startNewConversation(u.id)}
                                            className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-muted"
                                        >
                                            <Avatar className="h-9 w-9">
                                                <AvatarFallback className="bg-[oklch(0.65_0.19_45)] text-white text-xs">
                                                    {initials(u)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium text-sm">
                                                {u.prenom} {u.nom}
                                            </span>
                                        </button>
                                    ))}
                                    {utilisateurs.length === 0 && (
                                        <p className="text-muted-foreground text-sm text-center py-4">
                                            Aucun autre utilisateur
                                        </p>
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Search */}
                    <div className="p-3 border-b border-border">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Rechercher..."
                                value={searchConv}
                                onChange={(e) => setSearchConv(e.target.value)}
                                className="pl-9 h-8 text-sm"
                            />
                        </div>
                    </div>

                    {/* Conversations */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredConversations.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
                                <MessageSquare className="h-8 w-8 mb-2 opacity-40" />
                                <p>Aucune conversation</p>
                            </div>
                        )}
                        {filteredConversations.map((conv) => (
                            <button
                                key={conv.interlocuteur.id}
                                onClick={() => openConversation(conv.interlocuteur.id)}
                                className={`flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted ${
                                    interlocuteurActifId === conv.interlocuteur.id ? 'bg-muted' : ''
                                }`}
                            >
                                <Avatar className="h-10 w-10 flex-shrink-0">
                                    <AvatarFallback className="bg-[oklch(0.65_0.19_45)] text-white text-sm">
                                        {initials(conv.interlocuteur)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-sm truncate">
                                            {conv.interlocuteur.prenom} {conv.interlocuteur.nom}
                                        </span>
                                        <span className="text-xs text-muted-foreground ml-1 flex-shrink-0">
                                            {formatTime(conv.dernier_message.created_at)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-0.5">
                                        <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                                            {conv.dernier_message.est_expediteur && (
                                                <span className="mr-1">Vous :</span>
                                            )}
                                            {conv.dernier_message.contenu}
                                        </p>
                                        {conv.non_lus > 0 && (
                                            <Badge className="ml-1 h-5 min-w-5 px-1 text-xs bg-[oklch(0.65_0.19_45)] text-white flex-shrink-0">
                                                {conv.non_lus}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right panel: active chat */}
                <div className="flex flex-1 flex-col">
                    {!interlocuteurActifId ? (
                        <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
                            <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
                            <p className="text-lg font-medium">Sélectionnez une conversation</p>
                            <p className="text-sm mt-1">ou commencez-en une nouvelle</p>
                        </div>
                    ) : (
                        <>
                            {/* Chat header */}
                            <div className="flex items-center gap-3 border-b border-border p-4">
                                <Avatar className="h-9 w-9">
                                    <AvatarFallback className="bg-[oklch(0.65_0.19_45)] text-white text-sm">
                                        {actifUser ? initials(actifUser) : <User className="h-4 w-4" />}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold text-sm">
                                        {actifUser ? `${actifUser.prenom} ${actifUser.nom}` : '...'}
                                    </p>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {messages.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
                                        <MessageSquare className="h-10 w-10 mb-2 opacity-30" />
                                        <p>Aucun message. Dites bonjour !</p>
                                    </div>
                                )}
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.est_expediteur ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[70%] ${msg.est_expediteur ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                                            {msg.document && (
                                                <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs ${
                                                    msg.est_expediteur
                                                        ? 'bg-[oklch(0.55_0.19_45)] text-white'
                                                        : 'bg-muted text-foreground'
                                                }`}>
                                                    <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                                                    <span className="truncate max-w-[200px]">{msg.document.titre}</span>
                                                    <span className="opacity-70 uppercase">.{msg.document.extension}</span>
                                                </div>
                                            )}
                                            <div
                                                className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                                                    msg.est_expediteur
                                                        ? 'rounded-br-sm bg-[oklch(0.65_0.19_45)] text-white'
                                                        : 'rounded-bl-sm bg-muted text-foreground'
                                                }`}
                                                style={{ whiteSpace: 'pre-wrap' }}
                                            >
                                                {msg.contenu}
                                            </div>
                                            <span className="text-xs text-muted-foreground px-1">
                                                {formatTime(msg.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input area */}
                            <form onSubmit={sendMessage} className="border-t border-border p-3">
                                {/* Document attachment */}
                                <div className="mb-2">
                                    <Select
                                        value={sendForm.data.document_id}
                                        onValueChange={(v) => sendForm.setData('document_id', v === 'none' ? '' : v)}
                                    >
                                        <SelectTrigger className="h-8 text-xs text-muted-foreground">
                                            <SelectValue placeholder="Joindre un document (optionnel)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Aucun document</SelectItem>
                                            {documents.map((d) => (
                                                <SelectItem key={d.id} value={d.id}>
                                                    {d.titre} (.{d.extension})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-end gap-2">
                                    <Textarea
                                        rows={1}
                                        value={sendForm.data.contenu}
                                        onChange={(e) => sendForm.setData('contenu', e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Écrivez un message… (Entrée pour envoyer)"
                                        disabled={sendForm.processing}
                                        className="max-h-32 flex-1 resize-none text-sm"
                                        style={{ overflowY: 'auto' }}
                                    />
                                    <Button
                                        type="submit"
                                        size="icon"
                                        disabled={!sendForm.data.contenu.trim() || sendForm.processing}
                                        className="h-9 w-9 bg-[oklch(0.65_0.19_45)] hover:bg-[oklch(0.55_0.19_45)] text-white flex-shrink-0"
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
            </form>
                        </>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
