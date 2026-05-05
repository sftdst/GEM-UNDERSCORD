import React from 'react';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { ChatbotWidget } from '@/components/chatbot-widget';
import { SuperAdminSidebar } from '@/components/superadmin-sidebar';
import { SuperAdminSidebarHeader } from '@/components/superadmin-sidebar-header';

interface SuperAdminLayoutProps {
    children: React.ReactNode;
    breadcrumbs?: any[];
}

export default function SuperAdminLayout({
    children,
    breadcrumbs = [],
}: SuperAdminLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <SuperAdminSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <SuperAdminSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
            <ChatbotWidget />
        </AppShell>
    );
}
