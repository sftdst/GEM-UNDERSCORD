import { Head, Link } from '@inertiajs/react';
import { Image, MessageSquare, MonitorPlay, Settings2, Star, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SuperAdminLayout from '@/layouts/superadmin-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Page Vitrine', href: '/superadmin/vitrine' },
];

interface Stats {
    temoignages: number;
    partenaires: number;
    fonctionnalites: number;
    videos: number;
    screenshots: number;
}

const sections = [
    {
        title: 'Témoignages',
        description: 'Gérez les avis et retours clients affichés sur la landing page.',
        href: '/superadmin/vitrine/temoignages',
        icon: MessageSquare,
        color: 'oklch(0.65 0.19 45 / 0.12)',
        iconColor: 'oklch(0.65 0.19 45)',
        stat: (s: Stats) => s.temoignages,
        statLabel: 'témoignages',
    },
    {
        title: 'Partenaires',
        description: 'Logos et liens des organisations partenaires affichés en vitrine.',
        href: '/superadmin/vitrine/partenaires',
        icon: Users,
        color: 'oklch(0.25 0.06 250 / 0.12)',
        iconColor: 'oklch(0.55 0.12 250)',
        stat: (s: Stats) => s.partenaires,
        statLabel: 'partenaires',
    },
    {
        title: 'Fonctionnalités',
        description: 'Titres, descriptions et icônes des fonctionnalités présentées.',
        href: '/superadmin/vitrine/fonctionnalites',
        icon: Settings2,
        color: 'oklch(0.65 0.19 45 / 0.12)',
        iconColor: 'oklch(0.65 0.19 45)',
        stat: (s: Stats) => s.fonctionnalites,
        statLabel: 'fonctionnalités',
    },
    {
        title: 'Vidéos & Captures',
        description: "Tutoriels vidéo et captures d'écran illustrant les fonctionnalités.",
        href: '/superadmin/vitrine/medias',
        icon: MonitorPlay,
        color: 'oklch(0.25 0.06 250 / 0.12)',
        iconColor: 'oklch(0.55 0.12 250)',
        stat: (s: Stats) => s.videos + s.screenshots,
        statLabel: 'médias',
    },
];

export default function VitrineIndex({ stats }: { stats: Stats }) {
    return (
        <SuperAdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Page Vitrine" />
            <div className="flex flex-col gap-6 p-4 md:p-6">

                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Page Vitrine</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Gérez le contenu dynamique affiché sur la landing page publique.
                        </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <a href="/" target="_blank" rel="noopener noreferrer">
                            Voir la page publique
                        </a>
                    </Button>
                </div>

                {/* Stats globales */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                        { label: 'Témoignages', value: stats.temoignages, icon: MessageSquare },
                        { label: 'Partenaires', value: stats.partenaires, icon: Users },
                        { label: 'Fonctionnalités', value: stats.fonctionnalites, icon: Settings2 },
                        { label: 'Vidéos', value: stats.videos, icon: MonitorPlay },
                        { label: 'Captures', value: stats.screenshots, icon: Image },
                    ].map((item) => (
                        <Card key={item.label} className="relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                                <CardTitle className="text-xs font-medium text-muted-foreground">{item.label}</CardTitle>
                                <item.icon className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{item.value}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Sections */}
                <div className="grid sm:grid-cols-2 gap-5">
                    {sections.map((s) => (
                        <Link key={s.title} href={s.href}>
                            <Card className="h-full border border-border hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
                                <CardContent className="pt-6">
                                    <div className="flex items-start gap-4">
                                        <div
                                            className="flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0"
                                            style={{ background: s.color }}
                                        >
                                            <s.icon className="w-6 h-6" style={{ color: s.iconColor }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="font-semibold text-foreground">{s.title}</h3>
                                                <span className="text-2xl font-bold text-primary">{s.stat(stats)}</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
                                            <div className="mt-3">
                                                <span className="text-xs font-medium text-primary">
                                                    Gérer les {s.statLabel} →
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                {/* Info */}
                <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="pt-5">
                        <div className="flex items-start gap-3">
                            <Star className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-medium text-foreground text-sm">Contenu dynamique</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Toutes les modifications sont immédiatement répercutées sur la page vitrine publique.
                                    Seuls les éléments marqués "Actif" sont affichés aux visiteurs.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </SuperAdminLayout>
    );
}
