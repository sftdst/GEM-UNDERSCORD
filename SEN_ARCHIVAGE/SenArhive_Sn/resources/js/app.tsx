import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from '@/components/ui/sonner';
import { useAutoPageTranslation } from '@/hooks/use-auto-page-translation';
import '../css/app.css';
import { initializeTheme } from './hooks/use-appearance';
import './i18n';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

function AppRuntimeTools() {
    useAutoPageTranslation();
    return null;
}

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <StrictMode>
                <AppRuntimeTools />
                <App {...props} />
                <Toaster position="top-right" richColors closeButton duration={3000} />
            </StrictMode>,
        );
    },
    progress: {
        color: '#ff7631',
    },
});

// This will set light / dark mode on load...
initializeTheme();
