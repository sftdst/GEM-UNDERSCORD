import { Link, router } from '@inertiajs/react';
import { Bell, Ticket, RefreshCw } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NotifCount {
    tickets_ouverts: number;
    demandes_plan: number;
    total: number;
}

export function SuperAdminNotificationBell() {
    const [counts, setCounts] = useState<NotifCount>({ tickets_ouverts: 0, demandes_plan: 0, total: 0 });
    const [open, setOpen] = useState(false);

    const fetchCounts = useCallback(async () => {
        try {
            const res = await fetch('/superadmin/notifications/count', {
                headers: { Accept: 'application/json' },
            });
            if (res.ok) {
                const data = await res.json();
                setCounts(data);
            }
        } catch {
            // silently ignore
        }
    }, []);

    useEffect(() => {
        fetchCounts();
        const interval = setInterval(fetchCounts, 30_000);

        // Re-fetch après chaque requête Inertia réussie (changement de statut, réponse, etc.)
        const unsubscribe = router.on('finish', () => fetchCounts());

        return () => {
            clearInterval(interval);
            unsubscribe();
        };
    }, [fetchCounts]);

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-8 w-8">
                    <Bell className={counts.total > 0 ? 'h-4 w-4' : 'h-4 w-4'} />
                    {counts.total > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none animate-pulse">
                            {counts.total > 99 ? '99+' : counts.total}
                        </span>
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-72 p-0">
                <div className="flex items-center gap-2 px-4 py-3">
                    <Bell className="h-4 w-4" />
                    <span className="text-sm font-semibold">Notifications</span>
                    {counts.total > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                            {counts.total}
                        </span>
                    )}
                </div>

                <DropdownMenuSeparator className="my-0" />

                {counts.total === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Bell className="mb-3 h-8 w-8 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">Aucune notification</p>
                    </div>
                ) : (
                    <div>
                        {counts.tickets_ouverts > 0 && (
                            <Link
                                href="/superadmin/support"
                                onClick={() => setOpen(false)}
                                className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-accent"
                            >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                                    <Ticket className="h-4 w-4 text-blue-500" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium">Tickets de support</p>
                                    <p className="text-xs text-muted-foreground">
                                        {counts.tickets_ouverts} ticket{counts.tickets_ouverts > 1 ? 's' : ''} en attente
                                    </p>
                                </div>
                                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-bold text-white">
                                    {counts.tickets_ouverts}
                                </span>
                            </Link>
                        )}

                        {counts.tickets_ouverts > 0 && counts.demandes_plan > 0 && (
                            <DropdownMenuSeparator className="my-0" />
                        )}

                        {counts.demandes_plan > 0 && (
                            <Link
                                href="/superadmin/demandes_plan"
                                onClick={() => setOpen(false)}
                                className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-accent"
                            >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/40">
                                    <RefreshCw className="h-4 w-4 text-orange-500" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium">Demandes de plan</p>
                                    <p className="text-xs text-muted-foreground">
                                        {counts.demandes_plan} demande{counts.demandes_plan > 1 ? 's' : ''} en attente
                                    </p>
                                </div>
                                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
                                    {counts.demandes_plan}
                                </span>
                            </Link>
                        )}
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
