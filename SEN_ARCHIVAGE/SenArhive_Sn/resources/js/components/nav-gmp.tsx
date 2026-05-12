import { Link } from '@inertiajs/react';
import {
    BarChart3,
    Building2,
    CalendarRange,
    ChevronRight,
    ClipboardList,
    FileCheck2,
    GitBranch,
    Layers,
    Megaphone,
    Scale,
    ShieldCheck,
    SlidersHorizontal,
    Sparkles,
    Tag,
    TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';

// ── Gradients par module ──────────────────────────────────────────────────────

const GRAD = {
    gold:    'from-amber-400 to-orange-500',
    blue:    'from-blue-400 to-blue-600',
    violet:  'from-violet-400 to-violet-600',
    emerald: 'from-emerald-400 to-teal-500',
    sky:     'from-sky-400 to-cyan-500',
    amber:   'from-amber-300 to-yellow-500',
    rose:    'from-rose-400 to-pink-500',
    slate:   'from-slate-400 to-slate-600',
} as const;

type Grad = keyof typeof GRAD;

// ── Badge icône — carré gradient arrondi style app-icon ───────────────────────

function Badge({
    icon: Icon,
    grad,
    active,
}: {
    icon: React.ElementType;
    grad: Grad;
    active: boolean;
}) {
    return (
        <span
            className={cn(
                'flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[6px] transition-all duration-150',
                active
                    ? 'bg-white/25'
                    : `bg-gradient-to-br ${GRAD[grad]} shadow shadow-black/30`,
            )}
        >
            <Icon className="h-[13px] w-[13px] text-white" />
        </span>
    );
}

// ── Item GMP ──────────────────────────────────────────────────────────────────

function GmpItem({
    href,
    label,
    icon,
    grad,
}: {
    href: string;
    label: string;
    icon: React.ElementType;
    grad: Grad;
}) {
    const { isCurrentUrl } = useCurrentUrl();
    const active = isCurrentUrl(href);

    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                asChild
                isActive={active}
                tooltip={{ children: label }}
                className="h-[34px] gap-2.5 rounded-lg"
            >
                <Link href={href} prefetch>
                    <Badge icon={icon} grad={grad} active={active} />
                    <span className="truncate text-[12.5px] font-[450]">{label}</span>
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}

// ── Séparateur de section ─────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
    return (
        <li aria-hidden className="select-none group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-2 px-2 pt-3 pb-0.5">
                <span className="h-px w-2.5 rounded-full bg-gradient-to-r from-transparent to-white/20" />
                <span className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/30">
                    {label}
                </span>
            </div>
        </li>
    );
}

// ── Paramétrage collapsible ───────────────────────────────────────────────────

const PARAM_ITEMS = [
    { href: '/gmp/admin/exercices',       label: 'Exercices budgétaires',   icon: CalendarRange },
    { href: '/gmp/admin/types-marche',    label: 'Types de marché',         icon: Tag },
    { href: '/gmp/admin/modes-passation', label: 'Modes de passation',      icon: GitBranch },
    { href: '/gmp/admin/secteurs',        label: "Secteurs d'intervention",  icon: Layers },
    { href: '/gmp/admin/seuils',          label: 'Seuils ARMP',             icon: ShieldCheck },
];

function GmpParametrage() {
    const { isCurrentUrl } = useCurrentUrl();
    const isActive = PARAM_ITEMS.some(it => isCurrentUrl(it.href));
    const [open, setOpen] = useState(isActive);

    return (
        <Collapsible asChild open={open} onOpenChange={setOpen} className="group/param">
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                        isActive={isActive}
                        tooltip={{ children: 'Paramétrage GMP' }}
                        className="h-[34px] gap-2.5 rounded-lg"
                    >
                        <Badge icon={SlidersHorizontal} grad="slate" active={isActive} />
                        <span className="truncate text-[12.5px] font-[450]">Paramétrage</span>
                        <ChevronRight className="ml-auto h-3.5 w-3.5 shrink-0 text-white/30 transition-transform duration-200 group-data-[state=open]/param:rotate-90" />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarMenuSub className="ml-[26px] mt-0.5 border-l border-white/[0.09] pl-2.5 gap-px">
                        {PARAM_ITEMS.map(item => (
                            <SidebarMenuSubItem key={item.href}>
                                <SidebarMenuSubButton
                                    asChild
                                    isActive={isCurrentUrl(item.href)}
                                    className="h-[27px] rounded-md gap-2 text-[11.5px]"
                                >
                                    <Link href={item.href} prefetch>
                                        <item.icon className="h-3 w-3 shrink-0 opacity-50" />
                                        <span className="truncate">{item.label}</span>
                                    </Link>
                                </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                        ))}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </SidebarMenuItem>
        </Collapsible>
    );
}

// ── Composant principal ───────────────────────────────────────────────────────

export function NavGmp() {
    return (
        <SidebarGroup className="px-2 py-0">

            {/* ── En-tête GMP — caché en mode icône ── */}
            <div className="mb-2 group-data-[collapsible=icon]:hidden">
                <div className="relative overflow-hidden rounded-xl border border-white/[0.09] bg-gradient-to-br from-indigo-600/25 via-indigo-500/15 to-violet-600/20 px-3 py-2.5">
                    {/* Brillance décorative */}
                    <div className="pointer-events-none absolute -right-5 -top-5 h-16 w-16 rounded-full bg-violet-400/10 blur-lg" />
                    <div className="pointer-events-none absolute -left-2 bottom-0 h-8 w-20 bg-indigo-500/10 blur-md" />

                    <div className="relative flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-900/50 ring-1 ring-white/20">
                            <Scale className="h-4 w-4 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-[12.5px] font-bold leading-tight tracking-tight text-white">
                                GMP Intelligence
                            </p>
                            <p className="mt-0.5 truncate text-[10px] leading-tight text-indigo-200/60">
                                Marchés Publics &amp; Privés
                            </p>
                        </div>
                        <span className="shrink-0 rounded-full border border-indigo-400/25 bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-indigo-200/80">
                            PRO
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Mode icône : logo GMP seul ── */}
            <div className="mb-1.5 hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-900/50 ring-1 ring-white/15">
                    <Scale className="h-4 w-4 text-white" />
                </div>
            </div>

            <SidebarMenu className="gap-px">

                {/* Vue d'ensemble */}
                <GmpItem href="/gmp"             label="Vue d'ensemble"     icon={TrendingUp}    grad="gold" />

                {/* Processus */}
                <SectionLabel label="Processus" />
                <GmpItem href="/gmp/ppm"             label="Plan PPM"           icon={ClipboardList} grad="blue" />
                <GmpItem href="/gmp/appels-offres"   label="Appels d'offres"    icon={Megaphone}     grad="violet" />
                <GmpItem href="/gmp/marches"         label="Marchés"            icon={FileCheck2}    grad="emerald" />
                <GmpItem href="/gmp/fournisseurs"    label="Fournisseurs"       icon={Building2}     grad="sky" />

                {/* Intelligence IA */}
                <SectionLabel label="Intelligence IA" />
                <GmpItem href="/gmp/alertes"    label="Alertes IA"           icon={Sparkles}  grad="amber" />
                <GmpItem href="/gmp/rapports"   label="Rapports & Anomalies" icon={BarChart3} grad="rose" />

                {/* Administration */}
                <SectionLabel label="Administration" />
                <GmpParametrage />

            </SidebarMenu>
        </SidebarGroup>
    );
}
