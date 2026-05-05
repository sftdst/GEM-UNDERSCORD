import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import path from 'path';
import { defineConfig } from 'vite';

// Redirige localhost:5173 → localhost:8000 (évite la page par défaut de Vite)
const redirectToLaravelPlugin = {
    name: 'redirect-to-laravel',
    configureServer(server: import('vite').ViteDevServer) {
        server.middlewares.use((req, res, next) => {
            const isHMR = req.headers['accept'] === 'text/event-stream'
                || req.url?.startsWith('/@')
                || req.url?.startsWith('/node_modules')
                || req.url?.includes('?t=')
                || req.url?.startsWith('/resources');
            if (!isHMR) {
                res.writeHead(302, { Location: 'http://localhost:8000' + (req.url ?? '/') });
                res.end();
                return;
            }
            next();
        });
    },
};

const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
    server: {
        host: 'localhost',
        port: 5173,
        strictPort: true,
        hmr: {
            host: 'localhost',
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'resources/js'),
        },
    },
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'react-dom/client',
            '@inertiajs/react',
            'lucide-react',
            'clsx',
            'tailwind-merge',
        ],
    },
    plugins: [
        redirectToLaravelPlugin,
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(isProd ? {
            babel: { plugins: ['babel-plugin-react-compiler'] },
        } : {}),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
    ],
});
