/* ── Module Courrier ───────────────────────────────────────────────────── */

import { FileText, FolderOpen, Mail, FileCheck, Search, Filter, Download, Upload, Plus, RefreshCw, AlertTriangle, CheckCircle2, Clock, Eye, Trash2, Edit3, Send, MessageSquare, ChevronRight, ChevronLeft, ChevronDown } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Link, router, useForm, usePage } from '@inertiajs/react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Statut {
    nom: string;
    code: string;
    couleur: string;
}

const URGENCE_COULEURS: Record<string, string> = {
    Normal: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    Urgent: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    TresUrgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const CATEGORIE_COULEURS: Record<string, string> = {
    Ordinaire: 'bg-blue-100 text-blue-800',
    Confidentiel: 'bg-red-100 text-red-800',
    Facture: 'bg-green-100 text-green-800',
    Juridique: 'bg-purple-100 text-purple-800',
    RH: 'bg-yellow-100 text-yellow-800',
    Autre: 'bg-gray-100 text-gray-800',
};

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ── Dashboard ──────────────────────────────────────────────────────────── */

interface DashboardProps {
    stats: {
        total: number;
        recus: number;
        sortants: number;
        en_attente: number;
        en_cours: number;
        en_retard: number;
        traites: number;
        clotures: number;
        sans_reponse: number;
    };
    recents: any[];
    alertes: any[];
    prochains: any[];
    types: any[];
    statuts: Statut[];
}

function CourrierDashboard({ stats, recents, alertes, prochains, types, statuts }: DashboardProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Courriers', href: '/courriers' },
        { title: 'Tableau de bord', href: '/courriers' },
    ];

    const cards = [
        { label: 'Total', value: stats.total, icon: FileText, color: 'bg-blue-500' },
        { label: 'Reçus', value: stats.recus, icon: Mail, color: 'bg-indigo-500' },
        { label: 'Sortants', value: stats.sortants, icon: FileCheck, color: 'bg-emerald-500' },
        { label: 'En attente', value: stats.en_attente, icon: Clock, color: 'bg-amber-500' },
        { label: 'En cours', value: stats.en_cours, icon: RefreshCw, color: 'bg-sky-500' },
        { label: 'En retard', value: stats.en_retard, icon: AlertTriangle, color: 'bg-red-500' },
        { label: 'Traités', value: stats.traites, icon: CheckCircle2, color: 'bg-green-500' },
        { label: 'Sans réponse', value: stats.sans_reponse, icon: AlertTriangle, color: 'bg-orange-500' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:p-6">
                <h1 className="text-2xl font-bold">Tableau de bord — Courriers</h1>

                {/* Cartes statistiques */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
                    {cards.map((card) => (
                        <Card key={card.label}>
                            <CardContent className="flex items-center gap-3 p-4">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.color} text-white`}>
                                    <card.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{card.value}</p>
                                    <p className="text-xs text-muted-foreground">{card.label}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    {/* Alertes retard */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-600">
                                <AlertTriangle className="h-4 w-4" />
                                Courriers en retard ({alertes.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {alertes.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">Aucun retard</p>
                            ) : (
                                alertes.map((c: any) => (
                                    <div key={c.id} className="flex items-center justify-between rounded-lg border p-2">
                                        <div className="min-w-0">
                                            <p className="font-medium truncate">{c.numero} — {c.objet}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Échéance : {formatDate(c.date_echeance)}
                                            </p>
                                        </div>
                                        <Badge variant="destructive">
                                            {c.jours_retard ?? 0} jours de retard
                                        </Badge>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* Prochains délais */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-amber-600">
                                <Clock className="h-4 w-4" />
                                Échéances dans les 7 jours ({prochains.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {prochains.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">Aucune échéance proche</p>
                            ) : (
                                prochains.map((c: any) => (
                                    <div key={c.id} className="flex items-center justify-between rounded-lg border p-2">
                                        <div className="min-w-0">
                                            <p className="font-medium truncate">{c.numero} — {c.objet}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {c.type === 'ENT' ? 'Entrant' : 'Sortant'} · {c.categorie}
                                            </p>
                                        </div>
                                        <Badge className="bg-amber-500">{formatDate(c.date_echeance)}</Badge>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Courriers récents */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Derniers courriers
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Numéro</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Objet</TableHead>
                                    <TableHead>Categorie</TableHead>
                                    <TableHead>Urgence</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recents.map((c: any) => (
                                    <TableRow key={c.id} className="cursor-pointer hover:bg-accent" onClick={() => router.visit(`/courriers/${c.id}`)}>
                                        <TableCell className="font-mono text-sm">{c.numero}</TableCell>
                                        <TableCell>
                                            <Badge variant={c.type === 'ENT' ? 'secondary' : 'outline'}>
                                                {c.type === 'ENT' ? 'Entrant' : 'Sortant'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-md truncate">{c.objet}</TableCell>
                                        <TableCell>{c.categorie}</TableCell>
                                        <TableCell>
                                            <Badge style={{ backgroundColor: URGENCE_COULEURS[c.urgence]?.match(/bg-([\w-]+)/)?.[1] ? undefined : undefined }} className={URGENCE_COULEURS[c.urgence]}>
                                                {c.urgence}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{formatDate(c.date_reception || c.date_envoi || c.created_at)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

/* ── Page d'accueil du module ───────────────────────────────────────────── */

export default function CourriersIndex({ stats, recents, alertes, prochains, types, statuts }: DashboardProps) {
    return <CourrierDashboard stats={stats} recents={recents} alertes={alertes} prochains={prochains} types={types} statuts={statuts} />;
}