import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft, Building2, User, Mail, Phone, Globe, Users,
    Clock, CheckCircle, XCircle, AlertCircle, Calendar, MessageSquare,
} from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import SuperAdminLayout from '@/layouts/superadmin-layout';

interface UtilisateurDetail {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    telephone?: string;
}

interface OrganisationDetail {
    id: string;
    nom: string;
    pays?: string;
}

interface PlanDetail {
    nom: string;
    prix_mensuel: number;
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
    organisation?: OrganisationDetail;
    utilisateur?: UtilisateurDetail;
    plan?: PlanDetail;
}

const PRIMARY = 'oklch(0.65 0.19 45)';
const NAVY    = 'oklch(0.25 0.06 250)';

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | number | null }) {
    if (!value && value !== 0) return null;
    return (
        <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted shrink-0">
                <Icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium text-foreground">{value}</p>
            </div>
        </div>
    );
}

export default function ShowDemandeAbonnement() {
    const page = usePage();
    const { demande } = page.props as unknown as { demande: Demande };

    const [raison, setRaison] = useState('');
    const [loading, setLoading] = useState(false);

    const handleApprove = () => {
        if (!confirm(`Approuver la demande de "${demande.organisation?.nom}" ?`)) return;
        setLoading(true);
        router.post(`/superadmin/demandes_abonnement/${demande.id}/approuve`, {}, {
            onFinish: () => setLoading(false),
        });
    };

    const handleReject = () => {
        if (!raison.trim()) return;
        if (!confirm(`Rejeter la demande de "${demande.organisation?.nom}" ?`)) return;
        setLoading(true);
        router.post(
            `/superadmin/demandes_abonnement/${demande.id}/rejette`,
            { raison },
            { onFinish: () => setLoading(false) }
        );
    };

    const isEnAttente = demande.statut === 'en_attente';

    return (
        <SuperAdminLayout>
            <Head title={`Demande — ${demande.organisation?.nom ?? ''}`} />

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/superadmin/demandes_abonnement">
                        <Button variant="outline" size="icon" className="shrink-0">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold text-foreground truncate">
                            {demande.organisation?.nom ?? 'Demande'}
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Demande reçue le{' '}
                            {new Date(demande.created_at).toLocaleDateString('fr-FR', {
                                day: 'numeric', month: 'long', year: 'numeric',
                            })}
                        </p>
                    </div>
                </div>

                {/* Bannière de statut */}
                {demande.statut === 'en_attente' && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                        <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                        <div>
                            <p className="font-semibold text-amber-900">En attente de traitement</p>
                            <p className="text-sm text-amber-700">Cette demande attend votre décision.</p>
                        </div>
                    </div>
                )}
                {demande.statut === 'approuvee' && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
                        <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                        <div>
                            <p className="font-semibold text-green-900">Demande approuvée</p>
                            <p className="text-sm text-green-700">
                                Approuvée par <span className="font-medium">{demande.traite_par}</span>
                                {demande.traite_le && (
                                    <> le {new Date(demande.traite_le).toLocaleDateString('fr-FR')}</>
                                )}
                            </p>
                        </div>
                    </div>
                )}
                {demande.statut === 'rejetee' && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                        <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                        <div>
                            <p className="font-semibold text-red-900">Demande rejetée</p>
                            {demande.raison_rejet && (
                                <p className="text-sm text-red-700">Raison : {demande.raison_rejet}</p>
                            )}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Organisation */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Building2 className="w-4 h-4" style={{ color: PRIMARY }} />
                                Organisation
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <InfoRow icon={Building2} label="Nom"       value={demande.organisation?.nom} />
                            <InfoRow icon={Globe}     label="Pays"      value={demande.organisation?.pays} />
                            <InfoRow icon={Users}     label="Utilisateurs prévus" value={demande.nb_utilisateurs_prevu} />
                            <InfoRow icon={Building2} label="Secteur"   value={demande.secteur_activite} />
                            {demande.plan && (
                                <InfoRow icon={Calendar} label="Plan demandé" value={demande.plan.nom} />
                            )}
                        </CardContent>
                    </Card>

                    {/* Contact */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <User className="w-4 h-4" style={{ color: PRIMARY }} />
                                Contact
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <InfoRow
                                icon={User}
                                label="Nom complet"
                                value={demande.utilisateur ? `${demande.utilisateur.prenom} ${demande.utilisateur.nom}` : undefined}
                            />
                            <InfoRow icon={Mail}  label="Email"     value={demande.utilisateur?.email} />
                            <InfoRow icon={Phone} label="Téléphone" value={demande.utilisateur?.telephone} />
                        </CardContent>
                    </Card>
                </div>

                {/* Message */}
                {demande.message && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" style={{ color: PRIMARY }} />
                                Message du demandeur
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                                {demande.message}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Actions — uniquement si en attente */}
                {isEnAttente && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Approuver */}
                        <Card className="border-green-200">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base text-green-800 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    Approuver
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm text-muted-foreground">
                                    L'organisation recevra un accès à la période d'essai de{' '}
                                    <span className="font-medium text-foreground">14 jours</span>. Un email
                                    sera envoyé à l'administrateur.
                                </p>
                                <Button
                                    onClick={handleApprove}
                                    disabled={loading}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    {loading ? 'Traitement…' : 'Approuver la demande'}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Rejeter */}
                        <Card className="border-red-200">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base text-red-800 flex items-center gap-2">
                                    <XCircle className="w-4 h-4 text-red-600" />
                                    Rejeter
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <Label htmlFor="raison" className="text-sm">
                                        Raison du rejet <span className="text-red-500">*</span>
                                    </Label>
                                    <Textarea
                                        id="raison"
                                        placeholder="Expliquez pourquoi vous rejetez cette demande…"
                                        value={raison}
                                        onChange={(e) => setRaison(e.target.value)}
                                        rows={3}
                                        className="mt-1.5 resize-none"
                                    />
                                </div>
                                <Button
                                    onClick={handleReject}
                                    disabled={loading || !raison.trim()}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white gap-2"
                                >
                                    <XCircle className="w-4 h-4" />
                                    {loading ? 'Traitement…' : 'Rejeter la demande'}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </SuperAdminLayout>
    );
}
