import { Head, Link, usePage } from '@inertiajs/react';
import { Eye, Clock, CheckCircle, XCircle, Building2, User, Calendar } from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SuperAdminLayout from '@/layouts/superadmin-layout';

interface Utilisateur {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    telephone?: string;
}

interface OrganisationBase {
    id: string;
    nom: string;
    pays?: string;
}

interface Demande {
    id: number;
    statut: 'en_attente' | 'approuvee' | 'rejetee';
    secteur_activite?: string;
    nb_utilisateurs_prevu?: number;
    message?: string;
    raison_rejet?: string;
    traite_par?: string;
    traite_le?: string;
    created_at: string;
    organisation?: OrganisationBase;
    utilisateur?: Utilisateur;
}

const PRIMARY = 'oklch(0.65 0.19 45)';
const NAVY = 'oklch(0.25 0.06 250)';

function StatusBadge({ statut }: { statut: Demande['statut'] }) {
    if (statut === 'en_attente') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                <Clock className="w-3.5 h-3.5" />
                En attente
            </span>
        );
    }
    if (statut === 'approuvee') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-3.5 h-3.5" />
                Approuvée
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3.5 h-3.5" />
            Rejetée
        </span>
    );
}

function DemandeRow({ demande }: { demande: Demande }) {
    return (
        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors">
            <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground truncate">
                        {demande.organisation?.nom ?? '—'}
                    </span>
                    <StatusBadge statut={demande.statut} />
                    {demande.secteur_activite && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                            {demande.secteur_activite}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {demande.utilisateur
                            ? `${demande.utilisateur.prenom} ${demande.utilisateur.nom}`
                            : '—'}
                    </span>
                    <span>{demande.utilisateur?.email ?? '—'}</span>
                    {demande.nb_utilisateurs_prevu && (
                        <span>{demande.nb_utilisateurs_prevu} utilisateurs prévus</span>
                    )}
                    <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(demande.created_at).toLocaleDateString('fr-FR')}
                    </span>
                </div>
            </div>
            <Link href={`/superadmin/demandes_abonnement/${demande.id}`} className="ml-4 shrink-0">
                <Button size="sm" variant="outline" className="gap-1.5">
                    <Eye className="w-4 h-4" />
                    Détails
                </Button>
            </Link>
        </div>
    );
}

export default function DemandesAbonnementIndex() {
    const page = usePage();
    const { demandes } = page.props as unknown as { demandes: Demande[] };
    const [onglet, setOnglet] = useState<'en_attente' | 'approuvee' | 'rejetee'>('en_attente');

    const enAttente  = demandes.filter((d) => d.statut === 'en_attente');
    const approuvees = demandes.filter((d) => d.statut === 'approuvee');
    const rejetees   = demandes.filter((d) => d.statut === 'rejetee');

    const tabs = [
        { key: 'en_attente' as const, label: 'En attente', count: enAttente.length, color: 'text-amber-600' },
        { key: 'approuvee'  as const, label: 'Approuvées', count: approuvees.length, color: 'text-green-600' },
        { key: 'rejetee'    as const, label: 'Rejetées',   count: rejetees.length,   color: 'text-red-600' },
    ];

    const displayed = onglet === 'en_attente' ? enAttente : onglet === 'approuvee' ? approuvees : rejetees;

    return (
        <SuperAdminLayout>
            <Head title="Demandes d'essai" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Demandes d'essai</h1>
                        <p className="text-muted-foreground mt-1">
                            Gérez les demandes d'accès à la période d'essai
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-5 flex items-center gap-4">
                            <div
                                className="w-11 h-11 rounded-xl flex items-center justify-center"
                                style={{ background: 'oklch(0.97 0.06 80)' }}
                            >
                                <Clock className="w-5 h-5" style={{ color: PRIMARY }} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{enAttente.length}</p>
                                <p className="text-sm text-muted-foreground">En attente</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-5 flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-green-50">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{approuvees.length}</p>
                                <p className="text-sm text-muted-foreground">Approuvées</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-5 flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-red-50">
                                <XCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{rejetees.length}</p>
                                <p className="text-sm text-muted-foreground">Rejetées</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs + Liste */}
                <Card>
                    {/* Onglets */}
                    <div className="border-b border-border px-4">
                        <div className="flex gap-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setOnglet(tab.key)}
                                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                                        onglet === tab.key
                                            ? 'border-current text-current'
                                            : 'border-transparent text-muted-foreground hover:text-foreground'
                                    } ${onglet === tab.key ? tab.color : ''}`}
                                >
                                    {tab.label}
                                    <span
                                        className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs ${
                                            onglet === tab.key
                                                ? 'text-white'
                                                : 'bg-muted text-muted-foreground'
                                        }`}
                                        style={onglet === tab.key ? { background: PRIMARY } : {}}
                                    >
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <CardContent className="pt-4">
                        {displayed.length === 0 ? (
                            <div className="py-12 text-center">
                                <Building2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                                <p className="text-muted-foreground">
                                    Aucune demande{' '}
                                    {onglet === 'en_attente'
                                        ? 'en attente'
                                        : onglet === 'approuvee'
                                          ? 'approuvée'
                                          : 'rejetée'}{' '}
                                    pour le moment.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {displayed.map((d) => (
                                    <DemandeRow key={d.id} demande={d} />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </SuperAdminLayout>
    );
}
