import { Link } from '@inertiajs/react';
import {
    LayoutGrid,
    Building2,
    CreditCard,
    ListTodo,
    Settings,
    HelpCircle,
    PackageOpen,
    Settings2,
    Users,
    Activity,
    TrendingUp,
    Globe,
    MessageSquare,
    MonitorPlay,
} from 'lucide-react';
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

const superAdminNavItems: NavItem[] = [
    { title: 'Tableau de bord', href: '/superadmin', icon: LayoutGrid },
    { title: 'Plans & Tarifs', href: '/superadmin/plans', icon: PackageOpen },
    { title: 'Fonctionnalités', href: '/superadmin/fonctionnalites', icon: Settings2 },
    { title: 'Organisations', href: '/superadmin/organisations', icon: Building2 },
    { title: 'Abonnements', href: '/superadmin/abonnements', icon: CreditCard },
    { title: 'Demandes', href: '/superadmin/demandes_plan', icon: ListTodo },
    {
        title: 'Utilisateurs',
        icon: Users,
        children: [
            { title: "Logs d'activité",    href: '/superadmin/utilisateurs/logs',    icon: Activity },
            { title: 'Rapport connexions', href: '/superadmin/utilisateurs/rapport', icon: TrendingUp },
        ],
    },
    {
        title: 'Page Vitrine',
        icon: Globe,
        children: [
            { title: "Vue d'ensemble",    href: '/superadmin/vitrine',                icon: Globe },
            { title: 'Témoignages',       href: '/superadmin/vitrine/temoignages',    icon: MessageSquare },
            { title: 'Partenaires',       href: '/superadmin/vitrine/partenaires',    icon: Users },
            { title: 'Fonctionnalités',   href: '/superadmin/vitrine/fonctionnalites',icon: Settings2 },
            { title: 'Vidéos & Captures', href: '/superadmin/vitrine/medias',         icon: MonitorPlay },
        ],
    },
];

const footerNavItems: NavItem[] = [
    { title: 'Parametres', href: '/settings/profile', icon: Settings },
    { title: 'Support', href: '/superadmin/support', icon: HelpCircle },
];

export function SuperAdminSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/superadmin" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={superAdminNavItems} label="Gestion SaaS" />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
