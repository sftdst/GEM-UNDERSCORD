import type { Auth, SharedOrganisation } from '@/types/auth';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            organisation: SharedOrganisation | null;
            permissions: Record<string, boolean>;
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}
