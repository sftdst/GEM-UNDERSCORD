import { Link, usePage } from '@inertiajs/react';
import {
    Activity,
    Briefcase,
    Building,
    Building2,
    CheckSquare,
    CreditCard,
    FileText,
    FolderOpen,
    FolderTree,
    GitMerge,
    HelpCircle,
    LayoutGrid,
    Layers,
    ListTree,
    Mail,
    MessageSquare,
    Receipt,
    Settings,
    Share2,
    Shield,
    Tag,
    Users,
    UsersRound,
    Wallet,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavFooter } from '@/components/nav-footer';
import { NavCourrier } from '@/components/nav-courrier';
import { NavGmp } from '@/components/nav-gmp';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';

// ── Séparateur dégradé ────────────────────────────────────────────────────────

function NavSeparator() {
    return (
        <div className="px-3 group-data-[collapsible=icon]:px-2">
            <div className="h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
        </div>
    );
}

// ── Sidebar principale ────────────────────────────────────────────────────────

export function AppSidebar() {
    const { t } = useTranslation();
    const { organisation } = usePage().props as {
        organisation: { plan_fonctionnalites?: string[] } | null;
    };

    const features: string[] = organisation?.plan_fonctionnalites ?? [];
    const has = (code: string) => features.includes(code);

    const footerNavItems: NavItem[] = [
        { title: t('nav.settings'), href: '/settings/profile', icon: Settings },
        { title: t('nav.support'),  href: '/support',          icon: HelpCircle },
    ];

    const mainNavItems: NavItem[] = [
        { title: t('nav.dashboard'),  href: '/dashboard',   icon: LayoutGrid },
        {
            title: t('nav.documents'),
            icon: FileText,
            children: [
                { title: t('nav.all_documents'), href: '/documents', icon: FileText },
                ...(has('partage') ? [{ title: t('nav.sharing'), href: '/partage', icon: Share2 }] : []),
            ],
        },
        { title: t('nav.spaces'), href: '/espaces', icon: FolderOpen },
        ...(has('workflow') ? [{
            title: t('nav.espaces_workflow'),
            icon: GitMerge,
            children: [
                { title: t('nav.pipeline_templates'),  href: '/pipelines',                            icon: ListTree },
                { title: t('nav.pipeline_instances'),  href: '/pipelines/instances',                  icon: GitMerge },
                { title: t('nav.mes_taches'),          href: '/pipelines/instances?filtre=mes_taches', icon: CheckSquare },
            ],
        }] : []),
        { title: t('nav.messaging'), href: '/messagerie', icon: MessageSquare },
    ];

    const adminNavItems: NavItem[] = [
        {
            title: t('nav.users_access'),
            icon: Users,
            children: [
                { title: t('nav.users'),  href: '/admin/utilisateurs', icon: Users },
                { title: t('nav.roles'),  href: '/admin/roles',        icon: Shield },
                { title: t('nav.groups'), href: '/admin/groupes',      icon: UsersRound },
            ],
        },
        {
            title: t('nav.organisation'),
            icon: Building2,
            children: [
                { title: t('nav.organisation'), href: '/admin/organisation', icon: Building2 },
                { title: t('nav.departments'),  href: '/admin/departements', icon: Building },
                { title: t('nav.services'),     href: '/admin/services',     icon: Briefcase },
            ],
        },
        {
            title: t('nav.content'),
            icon: Layers,
            children: [
                { title: t('nav.categories'), href: '/admin/categories', icon: FolderTree },
                { title: t('nav.tags'),       href: '/admin/tags',       icon: Tag },
            ],
        },
        {
            title: t('nav.finances'),
            icon: Wallet,
            children: [
                { title: t('nav.subscription'), href: '/admin/abonnement', icon: CreditCard },
                { title: t('nav.invoices'),      href: '/admin/factures',  icon: Receipt },
            ],
        },
        ...(has('audit') ? [{ title: t('nav.activity_log'), href: '/admin/audit', icon: Activity }] : []),
        { title: t('nav.mail_config'), href: '/settings/mail', icon: Mail },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">

            {/* ── Logo ── */}
            <SidebarHeader className="pb-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <div className="mx-1 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
            </SidebarHeader>

            {/* ── Navigation scrollable ── */}
            <SidebarContent className="sidebar-scroll gap-0 py-1">

                {/* Plateforme */}
                <NavMain items={mainNavItems} label={t('nav.platform')} />

                {/* Module GMP */}
                {has('gmp') && (
                    <>
                        <NavSeparator />
                        <NavGmp />
                        <NavSeparator />
                    </>
                )}

                 {/* Module Courriers */}
                 <NavSeparator />
                 <NavCourrier />

                 {/* Administration */}
                <NavMain items={adminNavItems} label={t('nav.administration')} />

            </SidebarContent>

            {/* ── Pied de page ── */}
            <SidebarFooter className="pt-0">
                <div className="mx-1 mb-1 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>

        </Sidebar>
    );
}
