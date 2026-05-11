import { Link, usePage } from '@inertiajs/react';
import {
    Activity,
    BarChart3,
    Briefcase,
    Building,
    Building2,
    CheckSquare,
    ClipboardList,
    CreditCard,
    FileCheck2,
    FileText,
    FolderOpen,
    FolderTree,
    GitMerge,
    HelpCircle,
    LayoutGrid,
    ListTree,
    Mail,
    Megaphone,
    MessageSquare,
    Receipt,
    Scale,
    Settings,
    Shield,
    SlidersHorizontal,
    Sparkles,
    Tag,
    TrendingUp,
    Users,
    Share2,
    UsersRound,
    Layers,
    Wallet,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavFooter } from '@/components/nav-footer';
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

export function AppSidebar() {
    const { t } = useTranslation();
    const { organisation } = usePage().props as {
        organisation: { plan_fonctionnalites?: string[] } | null;
    };

    const features: string[] = organisation?.plan_fonctionnalites ?? [];
    const has = (code: string) => features.includes(code);

    const footerNavItems: NavItem[] = [
        { title: t('nav.settings'), href: '/settings/profile', icon: Settings },
        { title: t('nav.support'), href: '/support', icon: HelpCircle },
    ];

    const mainNavItems: NavItem[] = [
        { title: t('nav.dashboard'), href: '/dashboard', icon: LayoutGrid },
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
                { title: t('nav.pipeline_templates'), href: '/pipelines', icon: ListTree },
                { title: t('nav.pipeline_instances'), href: '/pipelines/instances', icon: GitMerge },
                { title: t('nav.mes_taches'), href: '/pipelines/instances?filtre=mes_taches', icon: CheckSquare },
            ],
        }] : []),
        { title: t('nav.messaging'), href: '/messagerie', icon: MessageSquare },
        ...(has('gmp') ? [{
            title: t('nav.gmp'),
            icon: Scale,
            children: [
                { title: t('nav.gmp_dashboard'),    href: '/gmp',                  icon: TrendingUp },
                { title: t('nav.gmp_ppm'),          href: '/gmp/ppm',              icon: ClipboardList },
                { title: t('nav.gmp_ao'),           href: '/gmp/appels-offres',    icon: Megaphone },
                { title: t('nav.gmp_marches'),      href: '/gmp/marches',          icon: FileCheck2 },
                { title: t('nav.gmp_fournisseurs'), href: '/gmp/fournisseurs',     icon: Building },
                { title: t('nav.gmp_alertes'),      href: '/gmp/alertes',          icon: Sparkles },
                { title: t('nav.gmp_rapports'),     href: '/gmp/rapports',         icon: BarChart3 },
            ],
        }] : []),
    ];

    const adminNavItems: NavItem[] = [
        {
            title: t('nav.users_access'),
            icon: Users,
            children: [
                { title: t('nav.users'), href: '/admin/utilisateurs', icon: Users },
                { title: t('nav.roles'), href: '/admin/roles', icon: Shield },
                { title: t('nav.groups'), href: '/admin/groupes', icon: UsersRound },
            ],
        },
        {
            title: t('nav.organisation'),
            icon: Building2,
            children: [
                { title: t('nav.organisation'), href: '/admin/organisation', icon: Building2 },
                { title: t('nav.departments'), href: '/admin/departements', icon: Building },
                { title: t('nav.services'), href: '/admin/services', icon: Briefcase },
            ],
        },
        {
            title: t('nav.content'),
            icon: Layers,
            children: [
                { title: t('nav.categories'), href: '/admin/categories', icon: FolderTree },
                { title: t('nav.tags'), href: '/admin/tags', icon: Tag },
            ],
        },
        {
            title: t('nav.finances'),
            icon: Wallet,
            children: [
                { title: t('nav.subscription'), href: '/admin/abonnement', icon: CreditCard },
                { title: t('nav.invoices'), href: '/admin/factures', icon: Receipt },
            ],
        },
        ...(has('audit') ? [{ title: t('nav.activity_log'), href: '/admin/audit', icon: Activity }] : []),
        { title: t('nav.mail_config'), href: '/settings/mail', icon: Mail },
        ...(has('gmp') ? [{
            title: t('nav.gmp_parametrage'),
            icon: SlidersHorizontal,
            children: [
                { title: t('nav.gmp_exercices'),       href: '/gmp/admin/exercices',       icon: Wallet },
                { title: t('nav.gmp_types_marche'),    href: '/gmp/admin/types-marche',    icon: Tag },
                { title: t('nav.gmp_modes_passation'), href: '/gmp/admin/modes-passation', icon: ListTree },
                { title: t('nav.gmp_secteurs'),        href: '/gmp/admin/secteurs',        icon: Layers },
                { title: t('nav.gmp_seuils'),          href: '/gmp/admin/seuils',          icon: Scale },
            ],
        }] : []),
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} label={t('nav.platform')} />
                <NavMain items={adminNavItems} label={t('nav.administration')} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
