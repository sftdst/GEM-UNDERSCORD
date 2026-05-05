import { Head, router, usePage } from '@inertiajs/react';
import { CreditCard, Check, AlertTriangle, Clock, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import PaymentModal from '@/components/payment-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Abonnement, Plan, Organisation, Fonctionnalite } from '@/types/models';

interface DemandeEnAttente {
    id: string;
    statut: string;
    periodicite_demandee: string;
    message: string | null;
    created_at: string;
    plan_demande: Plan;
}

interface Props {
    abonnement: (Abonnement & { plan: Plan & { fonctionnalites: Fonctionnalite[] } }) | null;
    plans: (Plan & { fonctionnalites: Fonctionnalite[] })[];
    organisation: Organisation | null;
    demandeEnAttente: DemandeEnAttente | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Administration', href: '/admin/utilisateurs' },
    { title: 'Abonnement', href: '/admin/abonnement' },
];

const CATEGORY_LABELS: Record<string, string> = {
    documents:     'Gestion documentaire',
    traitement:    'Traitement & Conversion',
    collaboration: 'Collaboration',
    securite:      'Sécurité & Conformité',
    integration:   'Intégrations & Support',
    ia:            'Intelligence Artificielle',
};

const CATEGORY_COLORS: Record<string, string> = {
    documents:     'text-blue-600',
    traitement:    'text-purple-600',
    collaboration: 'text-green-600',
    securite:      'text-red-600',
    integration:   'text-orange-600',
    ia:            'text-pink-600',
};

function formatXOF(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 0 }).format(amount) + ' FCFA';
}

function statutBadge(statut: string) {
    switch (statut) {
        case 'actif':
            return <Badge className="bg-green-100 text-green-800 border-green-200">Actif</Badge>;
        case 'essai':
            return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Essai</Badge>;
        case 'expire':
            return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Expiré</Badge>;
        case 'annule':
            return <Badge className="bg-red-100 text-red-800 border-red-200">Annulé</Badge>;
        default:
            return <Badge variant="secondary">{statut}</Badge>;
    }
}

function ProgressBar({ value, max, label }: { value: number; max: number | null; label: string }) {
    const percent = max ? Math.min((value / max) * 100, 100) : 0;
    const displayMax = max ?? 'Illimité';
    return (
        <div>
            <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value} / {displayMax}</span>
            </div>
            {max && (
                <div className="h-2 w-full rounded-full bg-muted">
                    <div
                        className={`h-2 rounded-full transition-all ${percent > 90 ? 'bg-red-500' : percent > 70 ? 'bg-yellow-500' : 'bg-primary'}`}
                        style={{ width: `${percent}%` }}
                    />
                </div>
            )}
        </div>
    );
}

/** Fonctionnalités groupées par catégorie pour le plan actif */
function PlanFeaturesSection({ fonctionnalites }: { fonctionnalites: Fonctionnalite[] }) {
    if (fonctionnalites.length === 0) return null;

    const grouped = fonctionnalites.reduce<Record<string, Fonctionnalite[]>>((acc, f) => {
        const cat = f.categorie ?? 'autres';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(f);
        return acc;
    }, {});

    return (
        <div className="mt-6 pt-5 border-t">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Fonctionnalités incluses
                <span className="ml-2 text-xs font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {fonctionnalites.length}
                </span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                {Object.entries(grouped).map(([cat, items]) => (
                    <div key={cat}>
                        <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${CATEGORY_COLORS[cat] ?? 'text-gray-500'}`}>
                            {CATEGORY_LABELS[cat] ?? cat}
                        </p>
                        <ul className="space-y-1.5">
                            {items.map((f) => (
                                <li key={f.id} className="flex items-center gap-2 text-sm text-gray-700">
                                    <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                    {f.nom}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Liste compacte des fonctionnalités dans une carte plan (avec toggle) */
function PlanCardFeatures({ fonctionnalites }: { fonctionnalites: Fonctionnalite[] }) {
    const [expanded, setExpanded] = useState(false);

    if (fonctionnalites.length === 0) {
        return (
            <p className="text-xs text-gray-400 italic">Aucune fonctionnalité assignée</p>
        );
    }

    const visible = expanded ? fonctionnalites : fonctionnalites.slice(0, 5);
    const hasMore = fonctionnalites.length > 5;

    return (
        <div className="mt-3 pt-3 border-t">
            <ul className="space-y-1.5">
                {visible.map((f) => (
                    <li key={f.id} className="flex items-center gap-2 text-xs text-gray-600">
                        <Check className="h-3 w-3 text-green-500 shrink-0" />
                        {f.nom}
                    </li>
                ))}
            </ul>
            {hasMore && (
                <button
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                    {expanded ? (
                        <><ChevronUp className="h-3 w-3" /> Réduire</>
                    ) : (
                        <><ChevronDown className="h-3 w-3" /> {fonctionnalites.length - 5} de plus</>
                    )}
                </button>
            )}
        </div>
    );
}

export default function SubscriptionPage({ abonnement, plans, organisation, demandeEnAttente }: Props) {
    const { props } = usePage();
    const flash = (props as any).flash as { success?: string; error?: string } | undefined;

    const plan = abonnement?.plan;
    const storageUsedGo = (organisation?.stockage_utilise_mo ?? 0) / 1024;

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<(Plan & { fonctionnalites: Fonctionnalite[] }) | null>(null);

    const handleDemander = (p: Plan & { fonctionnalites: Fonctionnalite[] }) => {
        setSelectedPlan(p);
        setShowPaymentModal(true);
    };

    const handleAnnulerDemande = () => {
        if (!confirm('Annuler votre demande de changement de plan ?')) return;
        router.post('/admin/abonnement/annuler-demande');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Abonnement" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <h1 className="text-2xl font-bold">Abonnement</h1>

                {/* Flash messages */}
                {flash?.success && (
                    <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                        <Check className="h-4 w-4 shrink-0" />
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        {flash.error}
                    </div>
                )}

                {/* Demande en attente */}
                {demandeEnAttente && (
                    <Card className="border-yellow-200 bg-yellow-50">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <Clock className="h-5 w-5 text-yellow-600 shrink-0" />
                                    <div>
                                        <p className="font-semibold text-yellow-900">Demande de changement en cours</p>
                                        <p className="text-sm text-yellow-700 mt-0.5">
                                            Vous avez demandé le passage au plan{' '}
                                            <strong>{demandeEnAttente.plan_demande?.nom}</strong>{' '}
                                            ({demandeEnAttente.periodicite_demandee}) le{' '}
                                            {new Date(demandeEnAttente.created_at).toLocaleDateString('fr-FR')}.
                                        </p>
                                        <p className="text-sm text-yellow-600 mt-1">
                                            Le SuperAdmin traitera votre demande prochainement.
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAnnulerDemande}
                                    className="shrink-0 border-yellow-400 text-yellow-800 hover:bg-yellow-100"
                                >
                                    <X className="h-4 w-4 mr-1" /> Annuler
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Plan actuel */}
                {abonnement && plan ? (
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                        <CreditCard className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold capitalize">{plan.nom}</h2>
                                        {plan.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}
                                    </div>
                                </div>
                                <div className="text-right">
                                    {statutBadge(abonnement.statut)}
                                    <p className="mt-2 text-2xl font-bold">
                                        {formatXOF(abonnement.periodicite === 'mensuel' ? Number(plan.prix_mensuel) : Number(plan.prix_annuel))}
                                        <span className="text-sm font-normal text-muted-foreground">
                                            /{abonnement.periodicite === 'mensuel' ? 'mois' : 'an'}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {/* Quotas */}
                            <div className="space-y-4">
                                <ProgressBar
                                    value={Number(storageUsedGo.toFixed(2))}
                                    max={plan.stockage_max_go}
                                    label="Stockage (Go)"
                                />
                                <ProgressBar value={0} max={plan.users_max} label="Utilisateurs" />
                                <ProgressBar value={0} max={plan.documents_max} label="Documents" />
                            </div>

                            {abonnement.date_renouvellement && (
                                <p className="mt-4 text-sm text-muted-foreground">
                                    Prochain renouvellement : {new Date(abonnement.date_renouvellement).toLocaleDateString('fr-FR')}
                                </p>
                            )}

                            {/* Fonctionnalités du plan actuel */}
                            <PlanFeaturesSection fonctionnalites={plan.fonctionnalites ?? []} />
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="h-6 w-6 text-yellow-500" />
                                <div>
                                    <h2 className="text-lg font-semibold">Aucun abonnement actif</h2>
                                    <p className="text-sm text-muted-foreground">Choisissez un plan ci-dessous pour commencer.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Plans disponibles */}
                <div>
                    <h2 className="text-lg font-semibold mb-4">Plans disponibles</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {plans.filter((p) => p.actif).map((p) => {
                            const isCurrent = plan && p.id === plan.id;
                            return (
                                <Card key={p.id} className={isCurrent ? 'border-primary ring-1 ring-primary' : ''}>
                                    <CardContent className="p-5 flex flex-col h-full">
                                        <div className="mb-3">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-lg capitalize">{p.nom}</h3>
                                                {isCurrent && <Badge>Actuel</Badge>}
                                            </div>
                                            {p.description && (
                                                <p className="mt-1 text-xs text-muted-foreground leading-snug">{p.description}</p>
                                            )}
                                        </div>

                                        {/* Prix */}
                                        <p className="text-2xl font-bold mb-3">
                                            {Number(p.prix_mensuel) === 0 ? 'Gratuit' : formatXOF(Number(p.prix_mensuel))}
                                            {Number(p.prix_mensuel) > 0 && (
                                                <span className="text-sm font-normal text-muted-foreground">/mois</span>
                                            )}
                                        </p>

                                        {/* Quotas */}
                                        <ul className="space-y-1.5 text-sm mb-3">
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-green-600 shrink-0" />
                                                {p.stockage_max_go} Go de stockage
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-green-600 shrink-0" />
                                                {p.users_max ?? 'Illimité'} utilisateur{(p.users_max ?? 2) > 1 ? 's' : ''}
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-green-600 shrink-0" />
                                                {p.documents_max ?? 'Illimité'} document{(p.documents_max ?? 2) > 1 ? 's' : ''}
                                            </li>
                                        </ul>

                                        {/* Fonctionnalités */}
                                        <PlanCardFeatures fonctionnalites={p.fonctionnalites ?? []} />

                                        {/* Bouton */}
                                        <div className="mt-4">
                                            {isCurrent ? (
                                                <Button disabled className="w-full" variant="outline">Plan actuel</Button>
                                            ) : demandeEnAttente ? (
                                                <Button disabled className="w-full" variant="outline">
                                                    Demande en attente
                                                </Button>
                                            ) : (
                                                <Button
                                                    className="w-full"
                                                    onClick={() => handleDemander(p)}
                                                >
                                                    {plan && Number(p.prix_mensuel) > Number(plan.prix_mensuel)
                                                        ? 'Passer à ce plan'
                                                        : 'Choisir ce plan'}
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* Modal de paiement */}
                {showPaymentModal && selectedPlan && (
                    <PaymentModal
                        plan={selectedPlan}
                        organisation={organisation}
                        onClose={() => setShowPaymentModal(false)}
                    />
                )}
            </div>
        </AppLayout>
    );
}
