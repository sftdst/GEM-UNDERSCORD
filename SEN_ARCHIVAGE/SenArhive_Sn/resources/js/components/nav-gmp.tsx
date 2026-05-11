import { Link } from '@inertiajs/react';
import {
    BarChart3,
    Building2,
    CalendarRange,
    ChevronDown,
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

// ── Palette de couleurs ───────────────────────────────────────────────────────

const palette = {
    indigo:  { bg: 'bg-indigo-500/20',  icon: 'text-indigo-300' },
    blue:    { bg: 'bg-blue-500/20',    icon: 'text-blue-300' },
    violet:  { bg: 'bg-violet-500/20',  icon: 'text-violet-300' },
    sky:     { bg: 'bg-sky-500/20',     icon: 'text-sky-300' },
    emerald: { bg: 'bg-emerald-500/20', icon: 'text-emerald-300' },
    amber:   { bg: 'bg-amber-500/20',   icon: 'text-amber-300' },
    rose:    { bg: 'bg-rose-500/20',    icon: 'text-rose-300' },
    slate:   { bg: 'bg-white/10',       icon: 'text-slate-300' },
} as const;

type PaletteKey = keyof typeof palette;

// ── Item GMP ──────────────────────────────────────────────────────────────────

function GmpItem({
    href,
    label,
    icon: Icon,
    color,
}: {
    href: string;
    label: string;
    icon: React.ElementType;
    color: PaletteKey;
}) {
    const { isCurrentUrl } = useCurrentUrl();
    const active = isCurrentUrl(href);
    const c = palette[color];

    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                asChild
                isActive={active}
                tooltip={{ children: label }}
                className="h-8 gap-2"
            >
                <Link href={href} prefetch>
                    <span className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-all',
                        active ? 'bg-white/25' : c.bg,
                    )}>
                        <Icon className={cn('h-3 w-3', active ? 'text-white' : c.icon)} />
                    </span>
                    <span className="truncate text-[12.5px]">{label}</span>
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}

// ── Séparateur de section élégant ─────────────────────────────────────────────

function SectionDivider({ label }: { label: string }) {
    return (
        <li aria-hidden className="select-none group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-2 px-1 pt-3 pb-0.5">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/30">
                    {label}
                </span>
                <div className="h-px flex-1 bg-white/10" />
            </div>
        </li>
    );
}

// ── Paramétrage collapsible ───────────────────────────────────────────────────

const PARAM_ITEMS = [
    { href: '/gmp/admin/exercices',       label: 'Exercices budgétaires',  icon: CalendarRange },
    { href: '/gmp/admin/types-marche',    label: 'Types de marché',        icon: Tag },
    { href: '/gmp/admin/modes-passation', label: 'Modes de passation',     icon: GitBranch },
    { href: '/gmp/admin/secteurs',        label: "Secteurs d'intervention", icon: Layers },
    { href: '/gmp/admin/seuils',          label: 'Seuils ARMP',            icon: ShieldCheck },
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
                        className="h-8 gap-2"
                    >
                        <span className={cn(
                            'flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-all',
                            isActive ? 'bg-white/25' : 'bg-white/10',
                        )}>
                            <SlidersHorizontal className={cn('h-3 w-3', isActive ? 'text-white' : 'text-slate-300')} />
                        </span>
                        <span className="truncate text-[12.5px]">Paramétrage</span>
                        <ChevronDown className="ml-auto h-3.5 w-3.5 shrink-0 text-white/40 transition-transform duration-200 group-data-[state=open]/param:rotate-180" />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarMenuSub className="ml-5 border-l border-white/10 pl-2.5 mt-0.5 gap-0.5">
                        {PARAM_ITEMS.map(item => (
                            <SidebarMenuSubItem key={item.href}>
                                <SidebarMenuSubButton
                                    asChild
                                    isActive={isCurrentUrl(item.href)}
                                    className="h-7 gap-1.5 text-[11.5px]"
                                >
                                    <Link href={item.href} prefetch>
                                        <item.icon className="h-3 w-3 shrink-0 opacity-60" />
                                        <span>{item.label}</span>
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
        <SidebarGroup className="px-2 py-1">

            {/* ── En-tête GMP compact — masqué en mode icône ── */}
            <div className="mb-1.5 group-data-[collapsible=icon]:hidden">
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-3 py-2.5 shadow-lg shadow-indigo-900/30">
                    {/* Reflet lumineux */}
                    <div className="pointer-events-none absolute -right-3 -top-3 h-14 w-14 rounded-full bg-white/10 blur-sm" />
                    <div className="pointer-events-none absolute bottom-0 left-0 h-10 w-24 bg-violet-800/30 blur-md" />

                    <div className="relative flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 ring-1 ring-white/30 backdrop-blur-sm">
                            <Scale className="h-4 w-4 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-bold leading-tight tracking-tight text-white">
                                GMP Intelligence
                            </p>
                            <p className="mt-0.5 truncate text-[10px] leading-tight text-indigo-200/80">
                                Marchés Publics & Privés
                            </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-white/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/80 ring-1 ring-white/20">
                            PRO
                        </span>
                    </div>
                </div>
            </div>

            {/* ── En mode icône : icône GMP seule ── */}
            <div className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center mb-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-900/40">
                    <Scale className="h-4 w-4 text-white" />
                </div>
            </div>

            <SidebarMenu className="gap-0.5">
                {/* Vue d'ensemble */}
                <GmpItem href="/gmp"             label="Vue d'ensemble"     icon={TrendingUp}    color="indigo" />

                {/* Processus */}
                <SectionDivider label="Processus" />
                <GmpItem href="/gmp/ppm"             label="Plan PPM"           icon={ClipboardList} color="blue" />
                <GmpItem href="/gmp/appels-offres"   label="Appels d'offres"    icon={Megaphone}     color="violet" />
                <GmpItem href="/gmp/marches"         label="Marchés"            icon={FileCheck2}    color="sky" />
                <GmpItem href="/gmp/fournisseurs"    label="Fournisseurs"       icon={Building2}     color="emerald" />

                {/* Intelligence IA */}
                <SectionDivider label="Intelligence IA" />
                <GmpItem href="/gmp/alertes"    label="Alertes IA"           icon={Sparkles}  color="amber" />
                <GmpItem href="/gmp/rapports"   label="Rapports & Anomalies" icon={BarChart3} color="rose" />

                {/* Administration */}
                <SectionDivider label="Administration" />
                <GmpParametrage />
            </SidebarMenu>
        </SidebarGroup>
    );
}
