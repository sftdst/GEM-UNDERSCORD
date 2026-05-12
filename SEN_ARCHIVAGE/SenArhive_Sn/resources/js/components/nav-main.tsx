import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
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
import type { IsCurrentUrlFn } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

interface NavMainProps {
    items?: NavItem[];
    label?: string;
}

// ── Badge icône sobre pour la nav générale ────────────────────────────────────

function NavIconBox({ icon: Icon, active }: { icon: React.ElementType; active: boolean }) {
    return (
        <span
            className={cn(
                'flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[6px] transition-all duration-150',
                active ? 'bg-white/25' : 'bg-white/[0.08]',
            )}
        >
            <Icon className="h-[14px] w-[14px] shrink-0" />
        </span>
    );
}

// ── Groupe principal ──────────────────────────────────────────────────────────

export function NavMain({ items = [], label = 'Plateforme' }: NavMainProps) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-2 py-0">
            {/* Label de section */}
            <div className="flex items-center gap-2 px-2 pb-1 pt-3 group-data-[collapsible=icon]:hidden">
                <span className="h-px w-2.5 rounded-full bg-gradient-to-r from-transparent to-white/20" />
                <span className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/30">
                    {label}
                </span>
            </div>

            <SidebarMenu className="gap-px">
                {items.map((item) =>
                    item.children && item.children.length > 0 ? (
                        <NavItemCollapsible
                            key={item.title}
                            item={item}
                            isCurrentUrl={isCurrentUrl}
                        />
                    ) : (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={item.href ? isCurrentUrl(item.href) : false}
                                tooltip={{ children: item.title }}
                                className="h-[34px] gap-2.5 rounded-lg"
                            >
                                <Link href={item.href!} prefetch>
                                    {item.icon && (
                                        <NavIconBox
                                            icon={item.icon}
                                            active={item.href ? isCurrentUrl(item.href) : false}
                                        />
                                    )}
                                    <span className="truncate text-[12.5px] font-[450]">{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )
                )}
            </SidebarMenu>
        </SidebarGroup>
    );
}

// ── Item collapsible ──────────────────────────────────────────────────────────

function NavItemCollapsible({
    item,
    isCurrentUrl,
}: {
    item: NavItem;
    isCurrentUrl: IsCurrentUrlFn;
}) {
    const isChildActive = item.children?.some((child) =>
        child.href ? isCurrentUrl(child.href) : false
    ) ?? false;

    const [open, setOpen] = useState(isChildActive);

    return (
        <Collapsible asChild open={open} onOpenChange={setOpen} className="group/collapsible">
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                        tooltip={{ children: item.title }}
                        isActive={isChildActive}
                        className="h-[34px] gap-2.5 rounded-lg"
                    >
                        {item.icon && (
                            <NavIconBox icon={item.icon} active={isChildActive} />
                        )}
                        <span className="truncate text-[12.5px] font-[450]">{item.title}</span>
                        <ChevronRight className="ml-auto h-3.5 w-3.5 shrink-0 text-white/30 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarMenuSub className="ml-[26px] mt-0.5 border-l border-white/[0.09] pl-2.5 gap-px">
                        {item.children?.map((child) => (
                            <SidebarMenuSubItem key={child.title}>
                                <SidebarMenuSubButton
                                    asChild
                                    isActive={child.href ? isCurrentUrl(child.href) : false}
                                    className="h-[27px] rounded-md gap-2 text-[11.5px]"
                                >
                                    <Link href={child.href!} prefetch>
                                        {child.icon && (
                                            <child.icon className="h-3 w-3 shrink-0 opacity-50" />
                                        )}
                                        <span className="truncate">{child.title}</span>
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
