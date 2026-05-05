import { Head, Link } from '@inertiajs/react';
import {
    Archive,
    Camera,
    CheckCircle,
    ChevronDown,
    ExternalLink,
    FileSearch,
    FileText,
    GitBranch,
    Lock,
    Menu,
    MessageSquare,
    PenTool,
    Play,
    Shield,
    Sparkles,
    Star,
    Users,
    X,
    Zap,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { login, register } from '@/routes';

// ─── Types dynamiques (depuis le backend) ─────────────────────────────────────

interface VitrineTemoignage {
    id: number;
    nom: string;
    role: string;
    entreprise: string;
    initiales: string;
    photo_url: string | null;
    contenu: string;
    note: number;
}

interface VitrinePartenaire {
    id: number;
    nom: string;
    logo_url: string | null;
    site_web: string | null;
    description: string | null;
}

interface VitrineFonctionnalite {
    id: number;
    icone: string;
    titre: string;
    description: string;
    couleur_bg: string;
    couleur_icone: string;
}

interface VitrineMedia {
    id: number;
    type: 'video' | 'screenshot';
    titre: string;
    description: string | null;
    url: string;
    thumbnail_url: string | null;
    section: string | null;
    duree_secondes: number | null;
}

function getDynamicIcon(name: string) {
    const icons = LucideIcons as Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>>;
    return icons[name] ?? Archive;
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface PlanFeature {
    label: string;
    included: boolean;
}

interface Plan {
    id: string;
    name: string;
    label: string;
    description: string;
    priceMonthly: number;
    priceAnnual: number;
    storage: string;
    users: string;
    documents: string;
    features: PlanFeature[];
    highlight?: boolean;
    badge?: string;
}

interface FaqItem {
    question: string;
    answer: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const PLANS: Plan[] = [
    {
        id: 'gratuit',
        name: 'Gratuit',
        label: 'Découverte',
        description: 'Idéal pour découvrir la plateforme sans engagement.',
        priceMonthly: 0,
        priceAnnual: 0,
        storage: '1 Go',
        users: '3 utilisateurs',
        documents: '100 documents',
        features: [
            { label: 'Upload de documents', included: true },
            { label: 'Notifications', included: true },
            { label: 'Versioning', included: false },
            { label: 'OCR & extraction IA', included: false },
            { label: 'Workflows & Pipelines', included: false },
            { label: 'Signature électronique', included: false },
            { label: 'API Access', included: false },
            { label: 'Support prioritaire', included: false },
        ],
    },
    {
        id: 'standard',
        name: 'Standard',
        label: 'Équipes',
        description: 'Pour les petites équipes. Archivage, partage et traçabilité inclus.',
        priceMonthly: 9900,
        priceAnnual: 99000,
        storage: '50 Go',
        users: '10 utilisateurs',
        documents: '5 000 documents',
        features: [
            { label: 'Upload de documents', included: true },
            { label: 'Notifications', included: true },
            { label: 'Versioning', included: true },
            { label: 'OCR & extraction IA', included: false },
            { label: 'Workflows & Pipelines', included: false },
            { label: 'Signature électronique', included: false },
            { label: 'API Access', included: false },
            { label: 'Support prioritaire', included: false },
        ],
    },
    {
        id: 'premium',
        name: 'Premium',
        label: 'PME',
        description: 'Pour les PME. OCR, workflows, signature électronique et IA inclus.',
        priceMonthly: 29900,
        priceAnnual: 299000,
        storage: '200 Go',
        users: '50 utilisateurs',
        documents: 'Illimité',
        highlight: true,
        badge: 'Le plus populaire',
        features: [
            { label: 'Upload de documents', included: true },
            { label: 'Notifications', included: true },
            { label: 'Versioning', included: true },
            { label: 'OCR & extraction IA', included: true },
            { label: 'Workflows & Pipelines', included: true },
            { label: 'Signature électronique', included: true },
            { label: 'API Access', included: true },
            { label: 'Support prioritaire', included: true },
        ],
    },
    {
        id: 'entreprise',
        name: 'Entreprise',
        label: 'Grands comptes',
        description: 'Pour les grandes structures. Toutes les fonctionnalités, illimité.',
        priceMonthly: 79900,
        priceAnnual: 799000,
        storage: '1 To',
        users: 'Illimité',
        documents: 'Illimité',
        features: [
            { label: 'Upload de documents', included: true },
            { label: 'Notifications', included: true },
            { label: 'Versioning', included: true },
            { label: 'OCR & extraction IA', included: true },
            { label: 'Workflows & Pipelines', included: true },
            { label: 'Signature électronique', included: true },
            { label: 'API Access', included: true },
            { label: 'Support prioritaire', included: true },
        ],
    },
];

const FAQ_ITEMS: FaqItem[] = [
    {
        question: "Comment fonctionne l'essai gratuit ?",
        answer:
            "Le plan Gratuit est disponible sans engagement ni carte bancaire. Vous accédez immédiatement à la plateforme avec 1 Go de stockage et 100 documents. Passez à un plan supérieur à tout moment.",
    },
    {
        question: 'Mes données sont-elles sécurisées ?',
        answer:
            "Toutes vos données sont chiffrées en transit (TLS 1.3) et au repos (AES-256). Notre infrastructure est conforme aux normes de protection des données locales et internationales.",
    },
    {
        question: 'Puis-je changer de plan à tout moment ?',
        answer:
            "Oui, vous pouvez upgrader ou downgrader votre abonnement à tout moment depuis votre espace administrateur. La facturation est ajustée au prorata.",
    },
    {
        question: "Qu'est-ce que le Workflow et le Pipeline GED ?",
        answer:
            "Les Workflows permettent de définir des circuits de validation multi-étapes pour vos documents (ex : soumission → validation juridique → approbation DG). Les Pipelines offrent une gestion avancée avec acteurs multiples, annotations et historique immuable.",
    },
    {
        question: "L'OCR fonctionne avec quels types de documents ?",
        answer:
            "Notre moteur OCR prend en charge les PDF scannés, images (PNG, JPG, TIFF) et documents mixtes. Il extrait automatiquement le texte pour rendre vos documents recherchables et indexés.",
    },
    {
        question: "Y a-t-il un support en français ?",
        answer:
            "Oui, notre interface est disponible en français, anglais, espagnol et portugais. Notre équipe de support répond en français du lundi au vendredi de 8h à 18h (GMT).",
    },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
    if (price === 0) return 'Gratuit';
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar({ mobileOpen, setMobileOpen }: { mobileOpen: boolean; setMobileOpen: (v: boolean) => void }) {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-2.5">
                        <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                            <AppLogoIcon className="size-5 fill-current" />
                        </div>
                        <span className="text-xl font-semibold text-foreground">
                            SEN_ARCHIV
                        </span>
                    </div>

                    {/* Desktop nav */}
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#fonctionnalites" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Fonctionnalités
                        </a>
                        <a href="#demo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Démo & Tutos
                        </a>
                        <a href="#tarifs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Tarifs
                        </a>
                        <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            FAQ
                        </a>
                    </div>

                    {/* Desktop auth */}
                    <div className="hidden md:flex items-center gap-3">
                        <Link
                            href={login()}
                            className="text-sm text-muted-foreground hover:text-foreground font-medium transition-colors px-4 py-2 rounded-lg hover:bg-muted"
                        >
                            Connexion
                        </Link>
                        <Link
                            href={register()}
                            className="text-sm bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 py-2 rounded-lg transition-colors shadow-sm"
                        >
                            Essayer gratuitement
                        </Link>
                    </div>

                    {/* Mobile toggle */}
                    <button
                        className="md:hidden p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Menu"
                    >
                        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="md:hidden bg-background border-t border-border px-4 py-5 flex flex-col gap-4">
                    <a href="#fonctionnalites" className="text-sm text-foreground" onClick={() => setMobileOpen(false)}>Fonctionnalités</a>
                    <a href="#demo" className="text-sm text-foreground" onClick={() => setMobileOpen(false)}>Démo & Tutos</a>
                    <a href="#tarifs" className="text-sm text-foreground" onClick={() => setMobileOpen(false)}>Tarifs</a>
                    <a href="#faq" className="text-sm text-foreground" onClick={() => setMobileOpen(false)}>FAQ</a>
                    <hr className="border-border" />
                    <Link href={login()} className="text-sm text-primary font-medium">Connexion</Link>
                    <Link
                        href={register()}
                        className="text-sm bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-lg text-center"
                    >
                        Essayer gratuitement
                    </Link>
                </div>
            )}
        </nav>
    );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection() {
    return (
        <section
            className="relative min-h-[92vh] flex items-center overflow-hidden pt-16"
            style={{ background: 'oklch(0.14 0.05 250)' }}
        >
            {/* Background decorations */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ background: 'oklch(0.65 0.19 45)' }} />
                <div className="absolute bottom-1/4 right-1/3 w-72 h-72 rounded-full blur-3xl opacity-10" style={{ background: 'oklch(0.65 0.19 45)' }} />
                <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-10" style={{ background: 'oklch(0.40 0.10 250)' }} />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
                {/* Badge */}
                <div
                    className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full mb-8 border"
                    style={{
                        background: 'oklch(0.65 0.19 45 / 0.15)',
                        borderColor: 'oklch(0.65 0.19 45 / 0.4)',
                        color: 'oklch(0.80 0.14 45)',
                    }}
                >
                    <Sparkles className="w-3.5 h-3.5" />
                    Plateforme GED nouvelle génération pour l'Afrique
                </div>

                {/* Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6" style={{ color: 'oklch(0.97 0.01 90)' }}>
                    La GED intelligente pour{' '}
                    <span style={{ color: 'oklch(0.65 0.19 45)' }}>
                        vos organisations
                    </span>
                </h1>

                {/* Sub-headline */}
                <p className="text-lg sm:text-xl max-w-3xl mx-auto mb-10 leading-relaxed" style={{ color: 'oklch(0.75 0.03 250)' }}>
                    Archivez, classez, signez et faites circuler vos documents en toute sécurité.
                    Workflows automatisés, OCR intégré, IA documentaire — tout ce dont votre organisation a besoin.
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
                    <Link
                        href={register()}
                        className="w-full sm:w-auto font-semibold px-8 py-4 rounded-lg text-base transition-all shadow-lg hover:opacity-90 hover:-translate-y-0.5"
                        style={{ background: 'oklch(0.65 0.19 45)', color: '#fff' }}
                    >
                        Commencer gratuitement
                    </Link>
                    <a
                        href="#tarifs"
                        className="w-full sm:w-auto font-medium px-8 py-4 rounded-lg text-base transition-all border"
                        style={{
                            background: 'oklch(0.25 0.05 250 / 0.6)',
                            borderColor: 'oklch(0.40 0.06 250)',
                            color: 'oklch(0.90 0.02 90)',
                        }}
                    >
                        Voir les tarifs
                    </a>
                </div>

                {/* Trust badges */}
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm" style={{ color: 'oklch(0.60 0.03 250)' }}>
                    {[
                        'Sans engagement',
                        'Données hébergées en Afrique',
                        'Conforme RGPD',
                        'Support en français',
                    ].map((badge) => (
                        <div key={badge} className="flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4" style={{ color: 'oklch(0.65 0.19 45)' }} />
                            {badge}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── Stats ────────────────────────────────────────────────────────────────────

function StatsSection() {
    const stats = [
        { value: '10 000+', label: 'Documents archivés', icon: FileText },
        { value: '200+', label: 'Organisations actives', icon: Users },
        { value: '99.9%', label: 'Disponibilité SLA', icon: Zap },
        { value: '256-bit', label: 'Chiffrement AES', icon: Lock },
    ];

    return (
        <section className="bg-background border-b border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((s) => (
                        <div key={s.label} className="text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3" style={{ background: 'oklch(0.65 0.19 45 / 0.12)' }}>
                                <s.icon className="w-6 h-6" style={{ color: 'oklch(0.65 0.19 45)' }} />
                            </div>
                            <div className="text-3xl font-bold text-foreground mb-1">{s.value}</div>
                            <div className="text-sm text-muted-foreground">{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── Features ─────────────────────────────────────────────────────────────────

const STATIC_FEATURES = [
    { icon: Archive,      title: 'Archivage & Organisation', description: "Organisez vos documents en espaces, dossiers et sous-dossiers. Métadonnées personnalisées, tags, et arborescence hiérarchique.",  bg: 'oklch(0.65 0.19 45 / 0.10)', iconColor: 'oklch(0.65 0.19 45)' },
    { icon: GitBranch,    title: 'Workflows & Pipelines',     description: "Définissez des circuits de validation multi-étapes. Acteurs par utilisateur, service ou rôle. Historique immuable.",                bg: 'oklch(0.25 0.06 250 / 0.12)', iconColor: 'oklch(0.55 0.12 250)' },
    { icon: FileSearch,   title: 'OCR & Recherche IA',        description: "Extrayez automatiquement le texte de vos PDF scannés. Recherche plein texte intelligente sur tout votre fonds documentaire.",     bg: 'oklch(0.65 0.19 45 / 0.10)', iconColor: 'oklch(0.65 0.19 45)' },
    { icon: PenTool,      title: 'Signature Électronique',    description: "Signez vos documents directement dans la plateforme. Signature à valeur légale, horodatage certifié et audit trail complet.",      bg: 'oklch(0.25 0.06 250 / 0.12)', iconColor: 'oklch(0.55 0.12 250)' },
    { icon: Shield,       title: 'Sécurité & Conformité',     description: "Chiffrement AES-256 au repos, TLS 1.3 en transit. Contrôle d'accès granulaire, double authentification, journaux d'audit.",       bg: 'oklch(0.65 0.19 45 / 0.10)', iconColor: 'oklch(0.65 0.19 45)' },
    { icon: MessageSquare,title: 'Collaboration & Support',   description: "Annotez, commentez et partagez des documents en équipe. Notifications temps réel, messagerie intégrée et support dédié.",          bg: 'oklch(0.25 0.06 250 / 0.12)', iconColor: 'oklch(0.55 0.12 250)' },
];

function FeaturesSection({ fonctionnalites }: { fonctionnalites?: VitrineFonctionnalite[] }) {
    const hasDynamic = fonctionnalites && fonctionnalites.length > 0;

    if (hasDynamic) {
        return (
            <section id="fonctionnalites" className="bg-muted/40 py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-4" style={{ background: 'oklch(0.65 0.19 45 / 0.10)', color: 'oklch(0.55 0.19 45)' }}>
                            Fonctionnalités
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Tout ce dont votre GED a besoin</h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Une plateforme complète pour gérer le cycle de vie de vos documents, de l'ingestion à l'archivage final.</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {fonctionnalites.map((f) => {
                            const IconComponent = getDynamicIcon(f.icone);
                            return (
                                <div key={f.id} className="bg-card rounded-xl p-7 border border-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5" style={{ background: f.couleur_bg }}>
                                        <IconComponent className="w-6 h-6" style={{ color: f.couleur_icone }} />
                                    </div>
                                    <h3 className="text-base font-semibold text-foreground mb-2">{f.titre}</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>
        );
    }

    // Fallback statique
    const features = STATIC_FEATURES;

    return (
        <section id="fonctionnalites" className="bg-muted/40 py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <div
                        className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-4"
                        style={{ background: 'oklch(0.65 0.19 45 / 0.10)', color: 'oklch(0.55 0.19 45)' }}
                    >
                        Fonctionnalités
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                        Tout ce dont votre GED a besoin
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Une plateforme complète pour gérer le cycle de vie de vos documents, de l'ingestion à l'archivage final.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((f) => (
                        <div
                            key={f.title}
                            className="bg-card rounded-xl p-7 border border-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200"
                        >
                            <div
                                className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5"
                                style={{ background: f.bg }}
                            >
                                <f.icon className="w-6 h-6" style={{ color: f.iconColor }} />
                            </div>
                            <h3 className="text-base font-semibold text-foreground mb-2">{f.title}</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── How it works ─────────────────────────────────────────────────────────────

function HowItWorksSection() {
    const steps = [
        {
            number: '01',
            title: 'Créez votre organisation',
            description:
                "Inscrivez-vous, configurez votre organisation, invitez vos collaborateurs et définissez les rôles et permissions en quelques minutes.",
        },
        {
            number: '02',
            title: 'Importez et classez vos documents',
            description:
                "Glissez-déposez vos fichiers ou connectez vos sources existantes. L'OCR extrait automatiquement le contenu. Organisez en espaces et dossiers.",
        },
        {
            number: '03',
            title: 'Automatisez vos circuits de validation',
            description:
                "Créez des workflows adaptés à vos processus métier. Suivez chaque document en temps réel, de la soumission à l'approbation finale.",
        },
    ];

    return (
        <section id="comment-ca-marche" className="bg-background py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <div
                        className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-4"
                        style={{ background: 'oklch(0.25 0.06 250 / 0.10)', color: 'oklch(0.45 0.08 250)' }}
                    >
                        Comment ça marche
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                        Opérationnel en moins de 10 minutes
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Pas de configuration complexe. Commencez à archiver et gérer vos documents immédiatement.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-10">
                    {steps.map((s, i) => (
                        <div key={s.number} className="relative text-center">
                            {i < steps.length - 1 && (
                                <div className="hidden md:block absolute top-8 left-2/3 w-full h-px bg-border -z-10" />
                            )}
                            <div
                                className="inline-flex items-center justify-center w-16 h-16 rounded-xl text-2xl font-bold mb-6 shadow-md"
                                style={{
                                    background: i % 2 === 0 ? 'oklch(0.65 0.19 45)' : 'oklch(0.22 0.05 250)',
                                    color: '#fff',
                                }}
                            >
                                {s.number}
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-3">{s.title}</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">{s.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

function PricingSection() {
    const [isAnnual, setIsAnnual] = useState(false);

    return (
        <section id="tarifs" className="bg-muted/40 py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <div
                        className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-4"
                        style={{ background: 'oklch(0.65 0.19 45 / 0.10)', color: 'oklch(0.55 0.19 45)' }}
                    >
                        Tarifs
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                        Des plans adaptés à chaque organisation
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                        Commencez gratuitement, évoluez selon vos besoins. Pas d'engagement, annulez à tout moment.
                    </p>

                    {/* Toggle mensuel / annuel */}
                    <div className="inline-flex items-center bg-card border border-border rounded-xl p-1 gap-1">
                        <button
                            onClick={() => setIsAnnual(false)}
                            className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
                            style={!isAnnual ? { background: 'oklch(0.65 0.19 45)', color: '#fff' } : { color: 'var(--muted-foreground)' }}
                        >
                            Mensuel
                        </button>
                        <button
                            onClick={() => setIsAnnual(true)}
                            className="px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                            style={isAnnual ? { background: 'oklch(0.65 0.19 45)', color: '#fff' } : { color: 'var(--muted-foreground)' }}
                        >
                            Annuel
                            <span
                                className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                                style={isAnnual
                                    ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
                                    : { background: 'oklch(0.65 0.19 45 / 0.15)', color: 'oklch(0.50 0.19 45)' }
                                }
                            >
                                -15%
                            </span>
                        </button>
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
                    {PLANS.map((plan) => (
                        <div
                            key={plan.id}
                            className="relative rounded-xl border flex flex-col overflow-hidden"
                            style={plan.highlight
                                ? { background: 'oklch(0.22 0.05 250)', borderColor: 'oklch(0.65 0.19 45)', transform: 'scale(1.03)' }
                                : { background: 'var(--card)', borderColor: 'var(--border)' }
                            }
                        >
                            {plan.badge && (
                                <div
                                    className="text-center text-xs font-bold py-1.5"
                                    style={{ background: 'oklch(0.65 0.19 45)', color: '#fff' }}
                                >
                                    {plan.badge}
                                </div>
                            )}

                            <div className="p-6 flex flex-col flex-1">
                                {/* Plan header */}
                                <div className="mb-5">
                                    <div
                                        className="text-xs font-semibold uppercase tracking-wider mb-1"
                                        style={{ color: plan.highlight ? 'oklch(0.75 0.10 45)' : 'var(--muted-foreground)' }}
                                    >
                                        {plan.label}
                                    </div>
                                    <div
                                        className="text-xl font-bold mb-2"
                                        style={{ color: plan.highlight ? 'oklch(0.97 0.01 90)' : 'var(--foreground)' }}
                                    >
                                        {plan.name}
                                    </div>
                                    <div className="mb-3">
                                        <span
                                            className="text-2xl font-bold"
                                            style={{ color: plan.highlight ? 'oklch(0.65 0.19 45)' : 'var(--foreground)' }}
                                        >
                                            {formatPrice(isAnnual ? Math.round(plan.priceAnnual / 12) : plan.priceMonthly)}
                                        </span>
                                        {plan.priceMonthly > 0 && (
                                            <span
                                                className="text-sm ml-1"
                                                style={{ color: plan.highlight ? 'oklch(0.65 0.10 250)' : 'var(--muted-foreground)' }}
                                            >
                                                /mois
                                            </span>
                                        )}
                                    </div>
                                    <p
                                        className="text-sm leading-relaxed"
                                        style={{ color: plan.highlight ? 'oklch(0.70 0.05 250)' : 'var(--muted-foreground)' }}
                                    >
                                        {plan.description}
                                    </p>
                                </div>

                                {/* Limites */}
                                <div
                                    className="rounded-lg p-3 mb-5 text-xs space-y-1.5"
                                    style={plan.highlight
                                        ? { background: 'oklch(0.28 0.05 250)' }
                                        : { background: 'var(--muted)' }
                                    }
                                >
                                    {[
                                        ['Stockage', plan.storage],
                                        ['Utilisateurs', plan.users],
                                        ['Documents', plan.documents],
                                    ].map(([k, v]) => (
                                        <div
                                            key={k}
                                            className="flex justify-between"
                                            style={{ color: plan.highlight ? 'oklch(0.80 0.05 250)' : 'var(--muted-foreground)' }}
                                        >
                                            <span>{k}</span>
                                            <span className="font-semibold" style={{ color: plan.highlight ? 'oklch(0.95 0.01 90)' : 'var(--foreground)' }}>
                                                {v}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Features */}
                                <ul className="space-y-2.5 mb-6 flex-1">
                                    {plan.features.map((f) => (
                                        <li
                                            key={f.label}
                                            className="flex items-center gap-2 text-sm"
                                            style={{ color: f.included
                                                ? (plan.highlight ? 'oklch(0.90 0.02 90)' : 'var(--foreground)')
                                                : 'var(--muted-foreground)',
                                                opacity: f.included ? 1 : 0.5
                                            }}
                                        >
                                            {f.included ? (
                                                <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'oklch(0.65 0.19 45)' }} />
                                            ) : (
                                                <X className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--muted-foreground)' }} />
                                            )}
                                            {f.label}
                                        </li>
                                    ))}
                                </ul>

                                <Link
                                    href={register()}
                                    className="block text-center text-sm font-semibold py-2.5 px-5 rounded-lg transition-all"
                                    style={plan.highlight
                                        ? { background: 'oklch(0.65 0.19 45)', color: '#fff' }
                                        : { background: 'var(--secondary)', color: 'var(--secondary-foreground)' }
                                    }
                                >
                                    {plan.priceMonthly === 0 ? 'Commencer gratuitement' : 'Choisir ce plan'}
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>

                <p className="text-center text-muted-foreground text-sm mt-8">
                    Tous les prix sont en Francs CFA (FCFA). TVA non incluse.{' '}
                    <a href="#faq" className="underline underline-offset-2" style={{ color: 'oklch(0.65 0.19 45)' }}>
                        Besoin d'une offre sur mesure ?
                    </a>
                </p>
            </div>
        </section>
    );
}

// ─── Partenaires ──────────────────────────────────────────────────────────────

function PartenairesSection({ partenaires }: { partenaires: VitrinePartenaire[] }) {
    if (partenaires.length === 0) return null;
    return (
        <section className="bg-muted/40 py-14 border-y border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-8">
                    Ils nous font confiance
                </p>
                <div className="flex flex-wrap items-center justify-center gap-8">
                    {partenaires.map((p) => (
                        <div key={p.id} className="flex items-center gap-2 group">
                            {p.logo_url ? (
                                <img src={p.logo_url} alt={p.nom} className="h-8 object-contain opacity-70 group-hover:opacity-100 transition-opacity grayscale group-hover:grayscale-0" />
                            ) : (
                                <span className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">{p.nom}</span>
                            )}
                            {p.site_web && (
                                <a href={p.site_web} target="_blank" rel="noopener noreferrer" className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── Médias (vidéos tutos + captures) ────────────────────────────────────────

function MediasSection({ medias }: { medias: VitrineMedia[] }) {
    const [activeMedia, setActiveMedia] = useState<VitrineMedia | null>(null);
    const videos = medias.filter(m => m.type === 'video');
    const screenshots = medias.filter(m => m.type === 'screenshot');

    function formatDuree(sec: number | null): string {
        if (!sec) return '';
        return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
    }

    return (
        <section id="demo" className="bg-muted/40 py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-4" style={{ background: 'oklch(0.25 0.06 250 / 0.10)', color: 'oklch(0.45 0.08 250)' }}>
                        En action
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Découvrez la plateforme</h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Tutoriels vidéo et captures d'écran pour explorer toutes les fonctionnalités.
                    </p>
                </div>

                {/* État vide — aucun média configuré */}
                {medias.length === 0 && (
                    <div className="text-center py-16 rounded-2xl border-2 border-dashed border-border bg-card">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5" style={{ background: 'oklch(0.65 0.19 45 / 0.10)' }}>
                            <Play className="w-8 h-8" style={{ color: 'oklch(0.65 0.19 45)' }} />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Tutoriels bientôt disponibles</h3>
                        <p className="text-muted-foreground text-sm max-w-md mx-auto">
                            Des vidéos de démonstration et des captures d'écran de toutes les fonctionnalités seront disponibles prochainement.
                        </p>
                    </div>
                )}

                {/* Vidéos */}
                {videos.length > 0 && (
                    <div className="mb-14">
                        <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                            <Play className="w-5 h-5 text-primary" /> Tutoriels vidéo
                        </h3>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {videos.map((v) => (
                                <div
                                    key={v.id}
                                    className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                                    onClick={() => setActiveMedia(v)}
                                >
                                    <div className="relative aspect-video bg-muted flex items-center justify-center overflow-hidden">
                                        {v.thumbnail_url ? (
                                            <img src={v.thumbnail_url} alt={v.titre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground/40">
                                                <Play className="w-10 h-10" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'oklch(0.65 0.19 45)' }}>
                                                <Play className="w-6 h-6 text-white ml-1" />
                                            </div>
                                        </div>
                                        {v.duree_secondes && (
                                            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded font-mono">
                                                {formatDuree(v.duree_secondes)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        {v.section && <p className="text-xs font-medium mb-1" style={{ color: 'oklch(0.65 0.19 45)' }}>{v.section}</p>}
                                        <p className="font-semibold text-foreground text-sm">{v.titre}</p>
                                        {v.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{v.description}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Captures d'écran */}
                {screenshots.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                            <Camera className="w-5 h-5 text-primary" /> Captures d'écran
                        </h3>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {screenshots.map((s) => (
                                <div
                                    key={s.id}
                                    className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                                    onClick={() => setActiveMedia(s)}
                                >
                                    <div className="relative aspect-video bg-muted overflow-hidden">
                                        {s.url ? (
                                            <img src={s.url} alt={s.titre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-muted-foreground/30">
                                                <Camera className="w-8 h-8" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3">
                                        {s.section && <p className="text-xs font-medium mb-0.5" style={{ color: 'oklch(0.65 0.19 45)' }}>{s.section}</p>}
                                        <p className="text-sm font-medium text-foreground line-clamp-1">{s.titre}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {activeMedia && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setActiveMedia(null)}>
                    <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setActiveMedia(null)}
                            className="absolute -top-10 right-0 text-white/80 hover:text-white flex items-center gap-1 text-sm"
                        >
                            <X className="w-5 h-5" /> Fermer
                        </button>
                        {activeMedia.type === 'video' ? (
                            <div className="aspect-video rounded-xl overflow-hidden bg-black">
                                <iframe
                                    src={activeMedia.url}
                                    title={activeMedia.titre}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="w-full h-full"
                                />
                            </div>
                        ) : (
                            <img src={activeMedia.url} alt={activeMedia.titre} className="rounded-xl max-h-[80vh] mx-auto" />
                        )}
                        <div className="mt-4 text-center">
                            <p className="text-white font-semibold">{activeMedia.titre}</p>
                            {activeMedia.description && <p className="text-white/60 text-sm mt-1">{activeMedia.description}</p>}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

const STATIC_TESTIMONIALS = [
    { nom: 'Aminata Diallo', role: 'Directrice Administrative', entreprise: 'Cabinet Juridique Dakar', initiales: 'AD', photo_url: null, contenu: "SenArhive a transformé notre gestion documentaire. Les circuits de validation nous font gagner 3 heures par jour. La recherche OCR est bluffante sur nos actes notariés.", note: 5 },
    { nom: 'Moustapha Seck',  role: 'DSI',                       entreprise: 'Groupe Industriel SENTEK', initiales: 'MS', photo_url: null, contenu: "Migration complète de notre GED en 2 semaines. L'API nous a permis de connecter nos ERP existants sans développement lourd. Le support est réactif et très professionnel.", note: 5 },
    { nom: 'Fatou Ndiaye',    role: 'Responsable Qualité',        entreprise: 'ONG SahelDev',             initiales: 'FN', photo_url: null, contenu: "Enfin une solution adaptée aux organisations africaines ! La conformité et la signature électronique nous ont permis de dématérialiser 100% de nos rapports donateurs.", note: 5 },
];

function TestimonialsSection({ temoignages }: { temoignages?: VitrineTemoignage[] }) {
    const list = (temoignages && temoignages.length > 0) ? temoignages : STATIC_TESTIMONIALS;

    return (
        <section className="bg-background py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <div
                        className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-4"
                        style={{ background: 'oklch(0.25 0.06 250 / 0.10)', color: 'oklch(0.45 0.08 250)' }}
                    >
                        Témoignages
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                        Ils font confiance à SEN_ARCHIV
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Des organisations de toutes tailles utilisent SEN_ARCHIV pour gérer leurs documents critiques.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {list.map((t, i) => (
                        <div
                            key={('id' in t ? t.id : i)}
                            className="bg-card rounded-xl p-6 border border-border hover:shadow-md transition-shadow"
                        >
                            {/* Étoiles */}
                            <div className="flex mb-3">
                                {Array.from({ length: 5 }).map((_, si) => (
                                    <Star key={si} className={`w-4 h-4 ${si < t.note ? 'fill-primary text-primary' : 'text-muted-foreground/20'}`} />
                                ))}
                            </div>
                            <p className="text-muted-foreground text-sm leading-relaxed mb-5 italic">
                                "{t.contenu}"
                            </p>
                            <div className="flex items-center gap-3">
                                {t.photo_url ? (
                                    <img src={t.photo_url} alt={t.nom} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                                ) : (
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                                        style={{ background: 'oklch(0.65 0.19 45)' }}
                                    >
                                        {t.initiales}
                                    </div>
                                )}
                                <div>
                                    <div className="font-semibold text-foreground text-sm">{t.nom}</div>
                                    <div className="text-xs text-muted-foreground">{t.role} · {t.entreprise}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

function FaqSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section id="faq" className="bg-muted/40 py-24">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-14">
                    <div
                        className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-4"
                        style={{ background: 'oklch(0.65 0.19 45 / 0.10)', color: 'oklch(0.55 0.19 45)' }}
                    >
                        FAQ
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                        Questions fréquentes
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Tout ce que vous devez savoir avant de commencer.
                    </p>
                </div>

                <div className="space-y-3">
                    {FAQ_ITEMS.map((item, index) => (
                        <div key={index} className="bg-card rounded-xl border border-border overflow-hidden">
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full flex items-center justify-between p-5 text-left hover:bg-accent transition-colors"
                            >
                                <span className="font-medium text-foreground text-sm pr-4">{item.question}</span>
                                <ChevronDown
                                    className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${openIndex === index ? 'rotate-180' : ''}`}
                                />
                            </button>
                            {openIndex === index && (
                                <div className="px-5 pb-5 border-t border-border pt-4">
                                    <p className="text-muted-foreground text-sm leading-relaxed">{item.answer}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── CTA Banner ───────────────────────────────────────────────────────────────

function CtaBannerSection() {
    return (
        <section className="py-20" style={{ background: 'oklch(0.20 0.05 250)' }}>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'oklch(0.97 0.01 90)' }}>
                    Prêt à moderniser votre gestion documentaire ?
                </h2>
                <p className="text-lg mb-10 max-w-2xl mx-auto leading-relaxed" style={{ color: 'oklch(0.70 0.05 250)' }}>
                    Rejoignez les organisations qui font confiance à SEN_ARCHIV pour sécuriser et automatiser leurs documents.
                    Commencez gratuitement, sans carte bancaire.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href={register()}
                        className="w-full sm:w-auto font-bold px-8 py-4 rounded-lg text-base transition-all shadow-lg hover:opacity-90"
                        style={{ background: 'oklch(0.65 0.19 45)', color: '#fff' }}
                    >
                        Démarrer gratuitement
                    </Link>
                    <Link
                        href={login()}
                        className="w-full sm:w-auto font-medium px-8 py-4 rounded-lg text-base transition-all border"
                        style={{
                            background: 'oklch(0.28 0.05 250)',
                            borderColor: 'oklch(0.38 0.06 250)',
                            color: 'oklch(0.85 0.03 90)',
                        }}
                    >
                        J'ai déjà un compte
                    </Link>
                </div>
            </div>
        </section>
    );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer style={{ background: 'oklch(0.14 0.04 250)', color: 'oklch(0.60 0.03 250)' }} className="py-14">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-4 gap-10 mb-10">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div
                                className="flex aspect-square size-8 items-center justify-center rounded-md"
                                style={{ background: 'oklch(0.65 0.19 45)' }}
                            >
                                <AppLogoIcon className="size-5 fill-current text-white" />
                            </div>
                            <span className="text-lg font-semibold" style={{ color: 'oklch(0.95 0.01 90)' }}>
                                SEN_ARCHIV
                            </span>
                        </div>
                        <p className="text-sm leading-relaxed">
                            La plateforme GED intelligente conçue pour les organisations africaines.
                        </p>
                    </div>

                    {/* Produit */}
                    <div>
                        <h4 className="text-sm font-semibold mb-4" style={{ color: 'oklch(0.85 0.03 90)' }}>Produit</h4>
                        <ul className="space-y-2 text-sm">
                            {[
                                ['#fonctionnalites', 'Fonctionnalités'],
                                ['#tarifs', 'Tarifs'],
                                ['#comment-ca-marche', 'Comment ça marche'],
                                ['#faq', 'FAQ'],
                            ].map(([href, label]) => (
                                <li key={label}>
                                    <a href={href} className="hover:text-white transition-colors">{label}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Accès */}
                    <div>
                        <h4 className="text-sm font-semibold mb-4" style={{ color: 'oklch(0.85 0.03 90)' }}>Accès</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href={login()} className="hover:text-white transition-colors">Connexion</Link>
                            </li>
                            <li>
                                <Link href={register()} className="hover:text-white transition-colors">Créer un compte</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Légal */}
                    <div>
                        <h4 className="text-sm font-semibold mb-4" style={{ color: 'oklch(0.85 0.03 90)' }}>Légal</h4>
                        <ul className="space-y-2 text-sm">
                            <li>Politique de confidentialité</li>
                            <li>Conditions d'utilisation</li>
                            <li>Mentions légales</li>
                        </ul>
                    </div>
                </div>

                <div
                    className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm"
                    style={{ borderColor: 'oklch(0.24 0.04 250)' }}
                >
                    <div>© {year} SEN_ARCHIV. Tous droits réservés.</div>
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" style={{ color: 'oklch(0.65 0.19 45)' }} />
                        <span>Données hébergées en Afrique de l'Ouest · Conforme RGPD</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

interface LandingProps {
    temoignages?: VitrineTemoignage[];
    partenaires?: VitrinePartenaire[];
    fonctionnalites?: VitrineFonctionnalite[];
    medias?: VitrineMedia[];
}

export default function Landing({ temoignages = [], partenaires = [], fonctionnalites = [], medias = [] }: LandingProps) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            <Head title="SEN_ARCHIV — La GED intelligente pour vos organisations" />
            <div className="antialiased">
                <Navbar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
                <HeroSection />
                <StatsSection />
                {partenaires.length > 0 && <PartenairesSection partenaires={partenaires} />}
                <FeaturesSection fonctionnalites={fonctionnalites} />
                <HowItWorksSection />
                <MediasSection medias={medias} />
                <PricingSection />
                <TestimonialsSection temoignages={temoignages} />
                <FaqSection />
                <CtaBannerSection />
                <Footer />
            </div>
        </>
    );
}
