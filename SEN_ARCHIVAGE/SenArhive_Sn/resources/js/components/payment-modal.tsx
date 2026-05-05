import { router } from '@inertiajs/react';
import {
    X, Check, CreditCard, Phone, Loader2, CheckCircle2,
    AlertTriangle, ArrowLeft, ShieldCheck, ChevronRight, Banknote,
    MapPin, Clock,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { Plan, Organisation } from '@/types/models';

type Step = 'summary' | 'method' | 'details' | 'processing' | 'success' | 'error';
type Methode = 'wave' | 'orange_money' | 'carte' | 'especes';

function formatXOF(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 0 }).format(amount) + ' FCFA';
}

function isSenegal(org: Organisation | null): boolean {
    const pays = org?.pays?.toLowerCase() ?? '';
    return pays === 'sn' || pays === 'sénégal' || pays === 'senegal';
}

function formatCardNumber(value: string): string {
    return value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
}

const STEP_LABELS: Record<'summary' | 'method' | 'details', string> = {
    summary: 'Récapitulatif',
    method: 'Mode de paiement',
    details: 'Détails',
};

const METHODE_LABEL: Record<Methode, string> = {
    wave: 'Wave',
    orange_money: 'Orange Money',
    carte: 'Visa / Carte bancaire',
    especes: 'Paiement en espèces',
};

// Classes partagées pour les champs de saisie (dark/light)
const INPUT_CLS =
    'w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground ' +
    'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 ' +
    'transition-colors';

export interface PaymentModalProps {
    plan: Plan & { fonctionnalites?: { id: string; nom: string }[] };
    organisation: Organisation | null;
    onClose: () => void;
}

export default function PaymentModal({ plan, organisation, onClose }: PaymentModalProps) {
    const isFree = Number(plan.prix_mensuel) === 0;
    const senegal = isSenegal(organisation);

    const [step, setStep] = useState<Step>('summary');
    const [periodicite, setPeriodicite] = useState<'mensuel' | 'annuel'>('mensuel');
    const [methode, setMethode] = useState<Methode | null>(null);
    const [telephone, setTelephone] = useState('');
    const [cardNum, setCardNum] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');
    const [cardNom, setCardNom] = useState('');
    const [erreurLocale, setErreurLocale] = useState('');

    const montant = periodicite === 'mensuel' ? Number(plan.prix_mensuel) : Number(plan.prix_annuel);

    // -----------------------------------------------------------------
    // Validation des champs
    // -----------------------------------------------------------------
    const detailsValid = (): boolean => {
        if (methode === 'wave' || methode === 'orange_money') {
            return telephone.replace(/\D/g, '').length >= 8;
        }
        if (methode === 'carte') {
            return (
                cardNum.replace(/\s/g, '').length === 16 &&
                cardExpiry.length === 5 &&
                cardCvv.length >= 3 &&
                cardNom.trim().length >= 3
            );
        }
        // especes : aucun champ requis
        return true;
    };

    const getCsrfToken = (): string => {
        return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
    };

    // -----------------------------------------------------------------
    // Traitement du paiement
    // -----------------------------------------------------------------
    const handlePayer = async () => {
        setStep('processing');
        setErreurLocale('');

        if (isFree || methode === 'especes') {
            const msgRef = methode ? `[Paiement ${METHODE_LABEL[methode]}]` : '[Activation plan gratuit]';
            router.post(
                '/admin/abonnement/demander-changement',
                { plan_demande_id: plan.id, periodicite_demandee: periodicite, message: msgRef },
                {
                    onSuccess: () => setStep('success'),
                    onError: (errors) => {
                        setErreurLocale((Object.values(errors)[0] as string) ?? 'Une erreur est survenue.');
                        setStep('error');
                    },
                },
            );
            return;
        }

        try {
            const response = await fetch('/admin/paiement/initier', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    plan_id: plan.id,
                    periodicite,
                    methode,
                    telephone: telephone.trim() || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data?.success) {
                throw new Error(data?.message ?? 'Impossible d’initier le paiement PayDunya.');
            }

            if (typeof data.checkout_url === 'string' && data.checkout_url.length > 0) {
                window.location.href = data.checkout_url;
                return;
            }

            setStep('success');
        } catch (error) {
            setErreurLocale(error instanceof Error ? error.message : 'Une erreur est survenue.');
            setStep('error');
        }
    };

    // -----------------------------------------------------------------
    // Étape 1 : Récapitulatif + Périodicité
    // -----------------------------------------------------------------
    const renderSummary = () => (
        <>
            <div className="p-6 space-y-5">
                {/* Récapitulatif du plan */}
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="font-bold capitalize text-lg text-blue-900 dark:text-blue-300">
                                {plan.nom}
                            </p>
                            {plan.description && (
                                <p className="text-sm mt-0.5 text-blue-700 dark:text-blue-400">
                                    {plan.description}
                                </p>
                            )}
                        </div>
                        <div className="text-right shrink-0">
                            {isFree ? (
                                <span className="text-xl font-bold text-green-600 dark:text-green-400">Gratuit</span>
                            ) : (
                                <>
                                    <p className="text-xl font-bold text-blue-900 dark:text-blue-300">
                                        {formatXOF(montant)}
                                    </p>
                                    <p className="text-xs text-blue-600 dark:text-blue-400">
                                        /{periodicite === 'mensuel' ? 'mois' : 'an'}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                    {(plan.fonctionnalites?.length ?? 0) > 0 && (
                        <ul className="mt-3 space-y-1.5 border-t border-blue-200 dark:border-blue-800 pt-3">
                            {plan.fonctionnalites!.slice(0, 4).map((f) => (
                                <li key={f.id} className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-400">
                                    <Check className="h-3 w-3 text-green-500 dark:text-green-400 shrink-0" />
                                    {f.nom}
                                </li>
                            ))}
                            {(plan.fonctionnalites?.length ?? 0) > 4 && (
                                <li className="text-xs text-blue-500 dark:text-blue-400 pl-5">
                                    + {(plan.fonctionnalites?.length ?? 0) - 4} autres fonctionnalités
                                </li>
                            )}
                        </ul>
                    )}
                </div>

                {/* Sélecteur de périodicité (plans payants uniquement) */}
                {!isFree && (
                    <div>
                        <Label className="mb-2 block text-sm font-medium text-foreground">
                            Périodicité
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setPeriodicite('mensuel')}
                                className={`p-3 rounded-lg border-2 text-left transition-colors ${
                                    periodicite === 'mensuel'
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400'
                                        : 'border-border hover:border-muted-foreground text-foreground'
                                }`}
                            >
                                <p className="text-sm font-medium">Mensuel</p>
                                <p className="text-lg font-bold mt-0.5">{formatXOF(Number(plan.prix_mensuel))}</p>
                                <p className="text-xs text-muted-foreground">/mois</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setPeriodicite('annuel')}
                                className={`p-3 rounded-lg border-2 text-left transition-colors ${
                                    periodicite === 'annuel'
                                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400'
                                        : 'border-border hover:border-muted-foreground text-foreground'
                                }`}
                            >
                                <p className="text-sm font-medium">Annuel</p>
                                <p className="text-lg font-bold mt-0.5">{formatXOF(Number(plan.prix_annuel))}</p>
                                <p className="text-xs text-muted-foreground">/an</p>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="px-6 pb-6 flex gap-3">
                <Button variant="outline" className="flex-1" onClick={onClose}>
                    Annuler
                </Button>
                <Button
                    className="flex-1"
                    onClick={() => (isFree ? handlePayer() : setStep('method'))}
                >
                    {isFree ? 'Activer gratuitement' : 'Continuer →'}
                </Button>
            </div>
        </>
    );

    // -----------------------------------------------------------------
    // Étape 2 : Choix de la méthode de paiement
    // -----------------------------------------------------------------
    const renderMethod = () => (
        <>
            <div className="p-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                    Montant à régler :{' '}
                    <span className="font-bold text-foreground">{formatXOF(montant)}</span>
                    <span className="text-muted-foreground ml-1">
                        / {periodicite === 'mensuel' ? 'mois' : 'an'}
                    </span>
                </p>

                <div className="space-y-3">
                    {/* Wave — Sénégal uniquement */}
                    {senegal && (
                        <button
                            type="button"
                            onClick={() => { setMethode('wave'); setStep('details'); }}
                            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border
                                       hover:border-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/30
                                       transition-colors text-left"
                        >
                            <div className="w-12 h-12 rounded-xl bg-[#1BA8FF] flex items-center justify-center shrink-0">
                                <span className="text-white font-extrabold text-lg">W</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-foreground">Wave</p>
                                <p className="text-xs text-muted-foreground">Paiement mobile Wave — Sénégal</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </button>
                    )}

                    {/* Orange Money — Sénégal uniquement */}
                    {senegal && (
                        <button
                            type="button"
                            onClick={() => { setMethode('orange_money'); setStep('details'); }}
                            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border
                                       hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30
                                       transition-colors text-left"
                        >
                            <div className="w-12 h-12 rounded-xl bg-[#FF6600] flex items-center justify-center shrink-0">
                                <span className="text-white font-extrabold text-sm">OM</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-foreground">Orange Money</p>
                                <p className="text-xs text-muted-foreground">Paiement mobile Orange — Sénégal</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </button>
                    )}

                    {/* Visa / Carte bancaire — toujours disponible */}
                    <button
                        type="button"
                        onClick={() => { setMethode('carte'); setStep('details'); }}
                        className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border
                                   hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30
                                   transition-colors text-left"
                    >
                        <div className="w-12 h-12 rounded-xl bg-[#1A1F71] flex items-center justify-center shrink-0">
                            <CreditCard className="text-white h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground">Visa / Carte bancaire</p>
                            <p className="text-xs text-muted-foreground">Visa, Mastercard acceptés</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>

                    {/* Espèces — toujours disponible */}
                    <button
                        type="button"
                        onClick={() => { setMethode('especes'); setStep('details'); }}
                        className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border
                                   hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/30
                                   transition-colors text-left"
                    >
                        <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center shrink-0">
                            <Banknote className="text-white h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground">Espèces</p>
                            <p className="text-xs text-muted-foreground">Paiement en agence ou chez un agent autorisé</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                </div>

                <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                    Paiement sécurisé — Chiffrement SSL
                </div>
            </div>

            <div className="px-6 pb-6">
                <button
                    type="button"
                    onClick={() => setStep('summary')}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-3.5 w-3.5" /> Retour
                </button>
            </div>
        </>
    );

    // -----------------------------------------------------------------
    // Étape 3 : Saisie des détails de paiement
    // -----------------------------------------------------------------
    const renderDetails = () => (
        <>
            <div className="p-6 space-y-5">
                {/* Badge méthode sélectionnée */}
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg border border-border">
                    <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            methode === 'wave'
                                ? 'bg-[#1BA8FF]'
                                : methode === 'orange_money'
                                  ? 'bg-[#FF6600]'
                                  : methode === 'especes'
                                    ? 'bg-green-600'
                                    : 'bg-[#1A1F71]'
                        }`}
                    >
                        {methode === 'carte' ? (
                            <CreditCard className="text-white h-4 w-4" />
                        ) : methode === 'especes' ? (
                            <Banknote className="text-white h-4 w-4" />
                        ) : (
                            <Phone className="text-white h-4 w-4" />
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">
                            {methode ? METHODE_LABEL[methode] : ''}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {formatXOF(montant)} · {periodicite === 'mensuel' ? 'mensuel' : 'annuel'}
                        </p>
                    </div>
                </div>

                {/* Champs Wave / Orange Money */}
                {(methode === 'wave' || methode === 'orange_money') && (
                    <div>
                        <Label htmlFor="pay-telephone" className="mb-1.5 block text-sm text-foreground">
                            Numéro de téléphone{' '}
                            <span className="text-muted-foreground font-normal text-xs">
                                ({methode === 'wave' ? 'Wave' : 'Orange Money'})
                            </span>
                        </Label>
                        <div className="flex">
                            <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-border bg-muted text-muted-foreground text-sm select-none">
                                +221
                            </span>
                            <input
                                id="pay-telephone"
                                type="tel"
                                value={telephone}
                                onChange={(e) => setTelephone(e.target.value)}
                                placeholder="7X XXX XX XX"
                                maxLength={14}
                                className={`flex-1 rounded-l-none rounded-r-lg ${INPUT_CLS}`}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5">
                            Vous recevrez une notification de confirmation sur ce numéro.
                        </p>
                    </div>
                )}

                {/* Champs Visa / Carte */}
                {methode === 'carte' && (
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="card-nom" className="mb-1.5 block text-sm text-foreground">
                                Nom sur la carte
                            </Label>
                            <input
                                id="card-nom"
                                type="text"
                                value={cardNom}
                                onChange={(e) => setCardNom(e.target.value.toUpperCase())}
                                placeholder="JEAN DUPONT"
                                className={`${INPUT_CLS} tracking-wide`}
                            />
                        </div>
                        <div>
                            <Label htmlFor="card-num" className="mb-1.5 block text-sm text-foreground">
                                Numéro de carte
                            </Label>
                            <div className="relative">
                                <input
                                    id="card-num"
                                    type="text"
                                    value={cardNum}
                                    onChange={(e) => setCardNum(formatCardNumber(e.target.value))}
                                    placeholder="0000 0000 0000 0000"
                                    className={`${INPUT_CLS} pr-10 tracking-widest`}
                                />
                                <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="card-expiry" className="mb-1.5 block text-sm text-foreground">
                                    Expiration
                                </Label>
                                <input
                                    id="card-expiry"
                                    type="text"
                                    value={cardExpiry}
                                    onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                                    placeholder="MM/AA"
                                    className={INPUT_CLS}
                                />
                            </div>
                            <div>
                                <Label htmlFor="card-cvv" className="mb-1.5 block text-sm text-foreground">
                                    CVV
                                </Label>
                                <input
                                    id="card-cvv"
                                    type="password"
                                    value={cardCvv}
                                    onChange={(e) =>
                                        setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))
                                    }
                                    placeholder="•••"
                                    className={INPUT_CLS}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Instructions paiement en espèces */}
                {methode === 'especes' && (
                    <div className="space-y-3">
                        {/* Montant à préparer */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                            <span className="text-sm text-green-800 dark:text-green-300 font-medium">
                                Montant à préparer
                            </span>
                            <span className="text-lg font-bold text-green-700 dark:text-green-400">
                                {formatXOF(montant)}
                            </span>
                        </div>

                        {/* Étapes */}
                        <div className="space-y-2.5">
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="text-white text-xs font-bold">1</span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">Soumettez votre demande</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Cliquez sur "Confirmer" ci-dessous. Vous recevrez une référence de paiement.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center shrink-0 mt-0.5">
                                    <MapPin className="text-white h-3 w-3" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">Rendez-vous en agence</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Présentez-vous dans nos bureaux ou chez un agent agréé DST Computing avec votre référence.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center shrink-0 mt-0.5">
                                    <Clock className="text-white h-3 w-3" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">Activation sous 24 h</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Votre plan sera activé après confirmation du paiement par notre équipe.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                    Vos informations de paiement sont chiffrées et sécurisées.
                </div>
            </div>

            <div className="px-6 pb-6 space-y-3">
                <Button className="w-full" onClick={handlePayer} disabled={!detailsValid()}>
                    {methode === 'especes' ? 'Confirmer la demande' : `Payer ${formatXOF(montant)}`}
                </Button>
                <button
                    type="button"
                    onClick={() => setStep('method')}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-3.5 w-3.5" /> Changer de méthode
                </button>
            </div>
        </>
    );

    // -----------------------------------------------------------------
    // Étape 4 : Traitement (loading)
    // -----------------------------------------------------------------
    const renderProcessing = () => (
        <div className="p-14 flex flex-col items-center justify-center gap-5">
            <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-blue-200 dark:border-blue-900" />
                <Loader2 className="absolute inset-0 m-auto h-10 w-10 text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
            <div className="text-center">
                <p className="font-semibold text-foreground">Traitement en cours…</p>
                <p className="text-sm text-muted-foreground mt-1">
                    {methode === 'wave' || methode === 'orange_money'
                        ? 'Vérification du paiement mobile…'
                        : methode === 'carte'
                          ? 'Vérification de la carte bancaire…'
                          : methode === 'especes'
                            ? 'Enregistrement de votre demande…'
                            : 'Activation du plan en cours…'}
                </p>
            </div>
        </div>
    );

    // -----------------------------------------------------------------
    // Étape 5 : Succès
    // -----------------------------------------------------------------
    const renderSuccess = () => (
        <div className="p-10 flex flex-col items-center justify-center gap-5">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-9 w-9 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center space-y-2">
                <p className="text-lg font-bold text-foreground">
                    {isFree ? 'Demande envoyée !' : methode === 'especes' ? 'Demande enregistrée !' : 'Paiement initié !'}
                </p>
                <p className="text-sm text-muted-foreground">
                    {isFree
                        ? `Votre demande de passage au plan ${plan.nom} a bien été soumise.`
                        : methode === 'especes'
                          ? `Votre demande pour le plan ${plan.nom} est enregistrée. Rendez-vous en agence pour finaliser le paiement.`
                          : `Votre paiement pour le plan ${plan.nom} a été initié avec succès.`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    {methode === 'especes'
                        ? 'Votre plan sera activé après confirmation du paiement en agence (sous 24 h).'
                        : 'Votre demande sera traitée prochainement par l\'administrateur.'}
                </p>
            </div>
            <Button className="w-full max-w-xs" onClick={onClose}>
                Fermer
            </Button>
        </div>
    );

    // -----------------------------------------------------------------
    // Étape 6 : Erreur
    // -----------------------------------------------------------------
    const renderError = () => (
        <div className="p-10 flex flex-col items-center justify-center gap-5">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="h-9 w-9 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-center space-y-1">
                <p className="text-lg font-bold text-foreground">Paiement échoué</p>
                <p className="text-sm text-muted-foreground">
                    {erreurLocale || 'Une erreur est survenue lors du traitement.'}
                </p>
            </div>
            <div className="flex gap-3 w-full max-w-xs">
                <Button variant="outline" className="flex-1" onClick={onClose}>
                    Annuler
                </Button>
                <Button
                    className="flex-1"
                    onClick={() => setStep(methode ? 'details' : isFree ? 'summary' : 'method')}
                >
                    Réessayer
                </Button>
            </div>
        </div>
    );

    // -----------------------------------------------------------------
    // Indicateur d'étapes (plans payants)
    // -----------------------------------------------------------------
    const PAID_STEPS: ('summary' | 'method' | 'details')[] = ['summary', 'method', 'details'];
    const currentPaidIdx = PAID_STEPS.indexOf(step as any);

    const renderStepsIndicator = () => (
        <div className="flex items-center gap-2 px-6 py-3 bg-muted border-b border-border text-xs text-muted-foreground">
            {PAID_STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                    {i > 0 && <div className="w-6 h-px bg-border" />}
                    <div
                        className={`flex items-center gap-1.5 ${
                            step === s
                                ? 'text-primary font-medium'
                                : currentPaidIdx > i
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-muted-foreground'
                        }`}
                    >
                        <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                step === s
                                    ? 'bg-primary text-primary-foreground'
                                    : currentPaidIdx > i
                                      ? 'bg-green-500 dark:bg-green-600 text-white'
                                      : 'bg-muted-foreground/20 text-muted-foreground'
                            }`}
                        >
                            {currentPaidIdx > i ? <Check className="h-3 w-3" /> : i + 1}
                        </div>
                        <span>{STEP_LABELS[s]}</span>
                    </div>
                </div>
            ))}
        </div>
    );

    // -----------------------------------------------------------------
    // Rendu principal
    // -----------------------------------------------------------------
    const headerTitle: Partial<Record<Step, string>> = {
        summary: `Passer au plan ${plan.nom}`,
        method: 'Mode de paiement',
        details: 'Informations de paiement',
    };

    const showHeader = step !== 'processing' && step !== 'success' && step !== 'error';
    const showSteps = !isFree && (step === 'summary' || step === 'method' || step === 'details');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md bg-card text-card-foreground rounded-2xl shadow-2xl overflow-hidden border border-border">
                {/* En-tête */}
                {showHeader && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                        <h2 className="text-base font-semibold text-foreground">
                            {headerTitle[step]}
                        </h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-muted-foreground hover:text-foreground rounded-full hover:bg-muted p-1 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                )}

                {/* Indicateur d'étapes */}
                {showSteps && renderStepsIndicator()}

                {/* Contenu */}
                {step === 'summary' && renderSummary()}
                {step === 'method' && renderMethod()}
                {step === 'details' && renderDetails()}
                {step === 'processing' && renderProcessing()}
                {step === 'success' && renderSuccess()}
                {step === 'error' && renderError()}
            </div>
        </div>
    );
}
