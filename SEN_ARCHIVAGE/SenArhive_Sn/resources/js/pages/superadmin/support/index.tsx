import { Head, Link, router, usePage } from '@inertiajs/react';
import { MessageSquare, Eye, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import SuperAdminLayout from '@/layouts/superadmin-layout';

interface Ticket {
    id: string;
    sujet: string;
    description: string;
    priorite: string;
    statut: string;
    created_at: string;
    utilisateur: { id: string; nom: string; prenom: string; email: string } | null;
    organisation: { id: string; nom: string } | null;
}

interface Props {
    tickets: Ticket[];
    statut: string;
}

const prioriteColors: Record<string, string> = {
    basse:   'bg-gray-100 text-gray-700',
    normale: 'bg-blue-100 text-blue-700',
    haute:   'bg-orange-100 text-orange-700',
    urgente: 'bg-red-100 text-red-700',
};

const statutConfig: Record<string, { label: string; color: string; icon: React.FC<{ className?: string }> }> = {
    ouvert:   { label: 'Ouvert',    color: 'bg-blue-100 text-blue-700',   icon: Clock },
    en_cours: { label: 'En cours',  color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
    resolu:   { label: 'Résolu',    color: 'bg-green-100 text-green-700', icon: CheckCircle },
    ferme:    { label: 'Fermé',     color: 'bg-gray-100 text-gray-700',   icon: XCircle },
};

const FILTRES = [
    { value: 'tous',     label: 'Tous' },
    { value: 'ouvert',   label: 'Ouverts' },
    { value: 'en_cours', label: 'En cours' },
    { value: 'resolu',   label: 'Résolus' },
    { value: 'ferme',    label: 'Fermés' },
];

export default function SuperAdminSupportIndex({ tickets, statut }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();

    useEffect(() => {
        if (props.flash?.success) toast.success(props.flash.success);
        if (props.flash?.error) toast.error(props.flash.error);
    }, [props.flash]);

    return (
        <SuperAdminLayout breadcrumbs={[{ title: 'Support', href: '/superadmin/support' }]}>
            <Head title="Support — Tickets" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Tickets de support</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Toutes les demandes de support de toutes les organisations.
                        </p>
                    </div>
                    <Badge variant="outline" className="text-base px-3 py-1">
                        {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
                    </Badge>
                </div>

                {/* Filtres par statut */}
                <div className="flex gap-2 flex-wrap">
                    {FILTRES.map(f => (
                        <Button
                            key={f.value}
                            size="sm"
                            variant={statut === f.value ? 'default' : 'outline'}
                            onClick={() => router.get('/superadmin/support', { statut: f.value }, { preserveState: true })}
                        >
                            {f.label}
                        </Button>
                    ))}
                </div>

                {tickets.length > 0 ? (
                    <div className="space-y-2">
                        <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground">
                            <div className="col-span-4">Sujet</div>
                            <div className="col-span-3">Organisation / Auteur</div>
                            <div className="col-span-2">Priorité</div>
                            <div className="col-span-2">Statut</div>
                            <div className="col-span-1"></div>
                        </div>
                        {tickets.map(ticket => {
                            const cfg = statutConfig[ticket.statut] ?? statutConfig.ouvert;
                            const Icon = cfg.icon;
                            return (
                                <Card key={ticket.id} className="hover:shadow-sm transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex flex-col gap-2 md:grid md:grid-cols-12 md:items-center md:gap-4">
                                            <div className="col-span-4">
                                                <p className="font-medium truncate">{ticket.sujet}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {new Date(ticket.created_at).toLocaleDateString('fr-FR', {
                                                        day: 'numeric', month: 'short', year: 'numeric',
                                                    })}
                                                </p>
                                            </div>
                                            <div className="col-span-3">
                                                <p className="text-sm font-medium truncate">
                                                    {ticket.organisation?.nom ?? '—'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {ticket.utilisateur
                                                        ? `${ticket.utilisateur.prenom} ${ticket.utilisateur.nom}`
                                                        : '—'}
                                                </p>
                                            </div>
                                            <div className="col-span-2">
                                                <Badge className={prioriteColors[ticket.priorite] ?? ''}>
                                                    {ticket.priorite}
                                                </Badge>
                                            </div>
                                            <div className="col-span-2">
                                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.color}`}>
                                                    <Icon className="h-3 w-3" />{cfg.label}
                                                </span>
                                            </div>
                                            <div className="col-span-1 flex justify-end">
                                                <Link href={`/superadmin/support/${ticket.id}`}>
                                                    <Button size="sm" variant="ghost">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-1 items-center justify-center text-center">
                        <div>
                            <MessageSquare className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
                            <h3 className="text-lg font-medium">Aucun ticket</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {statut === 'tous'
                                    ? 'Aucun ticket de support pour le moment.'
                                    : `Aucun ticket avec le statut "${statutConfig[statut]?.label ?? statut}".`}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </SuperAdminLayout>
    );
}
