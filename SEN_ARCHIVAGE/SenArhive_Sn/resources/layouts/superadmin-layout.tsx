import { Link } from '@inertiajs/react';
import { Menu, X, LogOut, Building2, FileText, Zap } from 'lucide-react';
import React, { useState } from 'react';

interface SuperAdminLayoutProps {
    children?: React.ReactNode;
}

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

    return (
        <div className="flex h-screen bg-slate-900">
            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-800 border-r border-slate-700 transition-all duration-300 flex flex-col`}>
                <div className="p-4 border-b border-slate-700">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 hover:bg-slate-700 rounded-lg"
                    >
                        {sidebarOpen ? (
                            <X className="w-5 h-5 text-white" />
                        ) : (
                            <Menu className="w-5 h-5 text-white" />
                        )}
                    </button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    <SidebarLink href="/superadmin" icon={<Zap className="w-5 h-5" />} label="Dashboard" open={sidebarOpen} />
                    <SidebarLink href="/superadmin/organisations" icon={<Building2 className="w-5 h-5" />} label="Organisations" open={sidebarOpen} />
                    <SidebarLink href="/superadmin/abonnements" icon={<FileText className="w-5 h-5" />} label="Abonnements" open={sidebarOpen} />
                    <SidebarLink href="/superadmin/demandes_abonnement" icon={<Zap className="w-5 h-5" />} label="Demandes" open={sidebarOpen} />
                </nav>

                <div className="p-4 border-t border-slate-700">
                    <button className="w-full flex items-center gap-3 text-red-400 hover:text-red-300 p-2">
                        <LogOut className="w-5 h-5" />
                        {sidebarOpen && <span>Déconnexion</span>}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                <header className="bg-slate-800 border-b border-slate-700 px-8 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-white">SenArchive SuperAdmin</h1>
                        <div className="flex items-center gap-4">
                            <span className="text-slate-400">Super Administrateur</span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}

interface SidebarLinkProps {
    href: string;
    icon: React.ReactNode;
    label: string;
    open: boolean;
}

function SidebarLink({ href, icon, label, open }: SidebarLinkProps) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
            <div className="flex-shrink-0">{icon}</div>
            {open && <span className="text-sm font-medium">{label}</span>}
        </Link>
    );
}
