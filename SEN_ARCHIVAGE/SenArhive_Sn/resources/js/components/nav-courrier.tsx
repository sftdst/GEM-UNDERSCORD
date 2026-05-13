import { FileCheck, FileText, FolderOpen, Mail, MessageSquare } from 'lucide-react';
import { useState } from 'react';
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
import type { NavItem } from '@/types';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Badge icône ──────────────────────────────────────────────────────────

function Badge({ icon: Icon, active }: { icon: React.ElementType; active: boolean }) {
    return (
        <span
            className={cn(
                'flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[6px] transition-all duration-150',
                active
                    ? 'bg-white/25'
                    : 'bg-gradient-to-br from-emerald-400 to-teal-600 shadow shadow-black/30',
            )}
        >
            <Icon className="h-[13px] w-[13px] text-white" />
        </span>
    );
}

// ── Items du module courrier ─────────────────────────────────────────────

const COURRIER_ITEMS: NavItem[] = [
    { title: 'Tableau de bord', href: '/courriers', icon: FileText },
    { title: 'Courriers entrants', href: '/courriers/liste?type=ENT', icon: Mail },
    { title: 'Courriers sortants', href: '/courriers/liste?type=SOR', icon: FileCheck },
    { title: 'Nouveau entrant', href: '/courriers/entrant/creer', icon: Mail },
    { title: 'Nouveau sortant', href: '/courriers/sortant/creer', icon: FileCheck },
];

// ── Composant principal ──────────────────────────────────────────────────

export function NavCourrier() {
    const { isCurrentUrl } = useCurrentUrl();
    const isActive = COURRIER_ITEMS.some(it => isCurrentUrl(it.href));
    const [open, setOpen] = useState(isActive);

    return (
        <SidebarGroup className="px-2 py-0">
            {/* En-tête */}
            <div className="mb-2 group-data-[collapsible=icon]:hidden">
                <div className="relative overflow-hidden rounded-xl border border-white/[0.09] bg-gradient-to-br from-emerald-600/25 via-emerald-500/15 to-teal-600/20 px-3 py-2.5">
                    <div className="pointer-events-none absolute -right-5 -top-5 h-16 w-16 rounded-full bg-emerald-400/10 blur-lg" />
                    <div className="relative flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-900/50 ring-1 ring-white/20">
                            <FileCheck className="h-4 w-4 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-[12.5px] font-bold leading-tight tracking-tight text-white">
                                Gestion Courriers
                            </p>
                            <p className="mt-0.5 truncate text-[10px] leading-tight text-emerald-200/60">
                                Dématérialisation &amp; suivi
                            </p>
                        </div>
                        <span className="shrink-0 rounded-full border border-emerald-400/25 bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-200/80">
                            NEW
                        </span>
                    </div>
                </div>
            </div>

            {/* Mode icône */}
            <div className="mb-1.5 hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-900/50 ring-1 ring-white/15">
                    <FileCheck className="h-4 w-4 text-white" />
                </div>
            </div>

            <SidebarMenu className="gap-px">
                <Collapsible asChild open={open} onOpenChange={setOpen} className="group/param">
                    <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                                isActive={isActive}
                                tooltip={{ children: 'Gestion Courriers' }}
                                className="h-[34px] gap-2.5 rounded-lg"
                            >
                                <Badge icon={FileText} active={isActive} />
                                <span className="truncate text-[12.5px] font-[450]">Courriers</span>
                                <ChevronRight className="ml-auto h-3.5 w-3.5 shrink-0 text-white/30 transition-transform duration-200 group-data-[state=open]/param:rotate-90" />
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <SidebarMenuSub className="ml-[26px] mt-0.5 border-l border-white/[0.09] pl-2.5 gap-px">
                                {COURRIER_ITEMS.map(item => (
                                    <SidebarMenuSubItem key={item.href}>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl(item.href)}
                                            className="h-[27px] rounded-md gap-2 text-[11.5px]"
                                        >
                                            <a href={item.href} prefetch>
                                                {item.icon && <item.icon className="h-3 w-3 shrink-0 opacity-50" />}
                                                <span className="truncate">{item.title}</span>
                                            </a>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                ))}
                            </SidebarMenuSub>
                        </CollapsibleContent>
                    </SidebarMenuItem>
                </Collapsible>
            </SidebarMenu>
        </SidebarGroup>
    );
}