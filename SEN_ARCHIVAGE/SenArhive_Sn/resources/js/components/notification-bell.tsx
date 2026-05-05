import { Link } from '@inertiajs/react';
import { Bell, FileText, Share2, MessageSquare, CheckCircle, Check, Ticket } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NotificationActeur {
    id: string;
    nom: string;
    prenom: string;
    avatar_url: string | null;
}

interface Notification {
    id: string;
    type: string;
    titre: string;
    message: string | null;
    lien: string | null;
    document_id: string | null;
    lu: boolean;
    created_at: string;
    acteur: NotificationActeur | null;
}

const TYPE_ICONS: Record<string, { icon: React.ElementType; colorKey: string; color: string; bg: string }> = {
    document_partage: {
        icon: Share2,
        colorKey: 'notifications.received_share',
        color: 'text-blue-500',
        bg: 'bg-blue-100 dark:bg-blue-900/40',
    },
    commentaire_ajoute: {
        icon: MessageSquare,
        colorKey: 'notifications.comment',
        color: 'text-green-500',
        bg: 'bg-green-100 dark:bg-green-900/40',
    },
    approbation_requise: {
        icon: CheckCircle,
        colorKey: 'notifications.approval',
        color: 'text-orange-500',
        bg: 'bg-orange-100 dark:bg-orange-900/40',
    },
    ticket_reponse: {
        icon: Ticket,
        colorKey: 'notifications.support',
        color: 'text-blue-500',
        bg: 'bg-blue-100 dark:bg-blue-900/40',
    },
};

function getTypeIcon(type: string) {
    return TYPE_ICONS[type] ?? {
        icon: FileText,
        colorKey: 'notifications.document',
        color: 'text-gray-500',
        bg: 'bg-gray-100 dark:bg-gray-800',
    };
}

function getCsrfToken(): string {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

export function NotificationBell() {
    const { t } = useTranslation();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [messagesCount, setMessagesCount] = useState(0);
    const [open, setOpen] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [notifRes, msgRes] = await Promise.all([
                fetch('/notifications', { headers: { Accept: 'application/json' } }),
                fetch('/messagerie/non-lus', { headers: { Accept: 'application/json' } }),
            ]);
            if (notifRes.ok) {
                const data = await notifRes.json();
                setNotifications(Array.isArray(data) ? data : []);
            }
            if (msgRes.ok) {
                const data = await msgRes.json();
                setMessagesCount(typeof data?.count === 'number' ? data.count : 0);
            }
        } catch {
            // silently ignore network errors
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchData();
        const interval = setInterval(fetchData, 30_000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const totalCount = notifications.length + messagesCount;

    const markAsRead = useCallback(async (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        await fetch(`/notifications/${id}/read`, {
            method: 'POST',
            headers: { 'X-CSRF-TOKEN': getCsrfToken(), Accept: 'application/json' },
        });
    }, []);

    const markAllAsRead = useCallback(async () => {
        setNotifications([]);
        await fetch('/notifications/read-all', {
            method: 'POST',
            headers: { 'X-CSRF-TOKEN': getCsrfToken(), Accept: 'application/json' },
        });
    }, []);

    const formatRelativeTime = useCallback(
        (dateStr: string): string => {
            const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
            if (diff < 60) return t('notifications.just_now');
            if (diff < 3600) return t('notifications.minutes_ago', { count: Math.floor(diff / 60) });
            if (diff < 86400) return t('notifications.hours_ago', { count: Math.floor(diff / 3600) });
            return t('notifications.days_ago', { count: Math.floor(diff / 86400) });
        },
        [t],
    );

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-8 w-8">
                    <Bell className="h-4 w-4" />
                    {totalCount > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none">
                            {totalCount > 99 ? '99+' : totalCount}
                        </span>
                    )}
                    <span className="sr-only">{t('notifications.title')}</span>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        <span className="text-sm font-semibold">{t('notifications.title')}</span>
                        {totalCount > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                                {totalCount}
                            </span>
                        )}
                    </div>
                    {notifications.length > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                            {t('notifications.mark_all_read')}
                        </button>
                    )}
                </div>

                <DropdownMenuSeparator className="my-0" />

                {totalCount === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <Bell className="mb-3 h-10 w-10 text-muted-foreground/30" />
                        <p className="text-sm font-medium text-muted-foreground">{t('notifications.all_up_to_date')}</p>
                        <p className="mt-1 text-xs text-muted-foreground/70">{t('notifications.no_notifications')}</p>
                    </div>
                ) : (
                    <div className="max-h-[380px] overflow-y-auto">
                        {messagesCount > 0 && (
                            <Link
                                href="/messagerie"
                                onClick={() => setOpen(false)}
                                className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-accent"
                            >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/40">
                                    <MessageSquare className="h-4 w-4 text-purple-500" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium">{t('notifications.unread_messages')}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {messagesCount === 1
                                            ? t('notifications.messages_pending_one', { count: messagesCount })
                                            : t('notifications.messages_pending_other', { count: messagesCount })}
                                    </p>
                                </div>
                                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-purple-500 px-1 text-[10px] font-bold text-white">
                                    {messagesCount}
                                </span>
                            </Link>
                        )}

                        {messagesCount > 0 && notifications.length > 0 && (
                            <DropdownMenuSeparator className="my-0" />
                        )}

                        {notifications.map(notif => {
                            const { icon: Icon, colorKey, color, bg } = getTypeIcon(notif.type);
                            const acteur = notif.acteur;
                            const inner = (
                                <>
                                    <div className="relative shrink-0">
                                        {acteur?.avatar_url ? (
                                            <img
                                                src={acteur.avatar_url}
                                                alt={`${acteur.prenom} ${acteur.nom}`}
                                                className="h-9 w-9 rounded-full object-cover"
                                            />
                                        ) : acteur ? (
                                            <div className={`flex h-9 w-9 items-center justify-center rounded-full ${bg}`}>
                                                <span className={`text-xs font-semibold ${color}`}>
                                                    {acteur.prenom[0]}{acteur.nom[0]}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className={`flex h-9 w-9 items-center justify-center rounded-full ${bg}`}>
                                                <Icon className={`h-4 w-4 ${color}`} />
                                            </div>
                                        )}
                                        {/* Petite icône de type en bas à droite */}
                                        {acteur && (
                                            <div className={`absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-background ${bg}`}>
                                                <Icon className={`h-2.5 w-2.5 ${color}`} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium leading-tight">{notif.titre}</p>
                                        {notif.message && (
                                            <p className="truncate text-xs text-muted-foreground">{notif.message}</p>
                                        )}
                                        <p className="mt-0.5 text-xs text-muted-foreground/70">
                                            {t(colorKey)} · {formatRelativeTime(notif.created_at)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={e => { e.preventDefault(); e.stopPropagation(); markAsRead(notif.id); }}
                                        className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                                        title={t('notifications.mark_read')}
                                    >
                                        <Check className="h-3.5 w-3.5" />
                                    </button>
                                </>
                            );

                            return notif.lien ? (
                                <Link
                                    key={notif.id}
                                    href={notif.lien}
                                    onClick={() => { markAsRead(notif.id); setOpen(false); }}
                                    className="group flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-accent"
                                >
                                    {inner}
                                </Link>
                            ) : (
                                <div
                                    key={notif.id}
                                    className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent"
                                >
                                    {inner}
                                </div>
                            );
                        })}
                    </div>
                )}

                {totalCount > 0 && (
                    <>
                        <DropdownMenuSeparator className="my-0" />
                        <div className="px-4 py-2">
                            <Link
                                href="/messagerie"
                                onClick={() => setOpen(false)}
                                className="block text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
                            >
                                {t('notifications.see_all')}
                            </Link>
                        </div>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
