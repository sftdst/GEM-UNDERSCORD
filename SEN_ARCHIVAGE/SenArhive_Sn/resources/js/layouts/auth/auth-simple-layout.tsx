import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLogoIcon from '@/components/app-logo-icon';
import { LanguageToggle } from '@/components/language-toggle';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { t } = useTranslation();

    return (
        <div className="flex min-h-svh bg-gray-50">

            {/* ── Panneau gauche : visuel ── */}
            <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
                <img
                    src="/images/login-banner.jpeg"
                    alt="SEN ARCHIV"
                    className="absolute inset-0 h-full w-full object-cover object-top"
                />
                <div className="absolute inset-0" style={{
                    background: 'linear-gradient(to top, rgba(0,47,89,0.72) 0%, transparent 50%)'
                }} />
                <div className="absolute bottom-10 left-10 right-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-px flex-1 bg-white/30" />
                        <span className="text-white/60 text-xs font-medium uppercase tracking-widest">
                            {t('auth.certified')}
                        </span>
                        <div className="h-px flex-1 bg-white/30" />
                    </div>
                    <div className="flex gap-6">
                        {[
                            { value: '100%', label: t('auth.secure') },
                            { value: 'FCFA', label: t('auth.local_currency') },
                            { value: '24/7', label: t('auth.available') },
                        ].map((stat) => (
                            <div key={stat.label} className="text-center">
                                <div className="text-2xl font-bold" style={{ color: '#ff7631' }}>{stat.value}</div>
                                <div className="text-xs text-white/60 mt-0.5">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Panneau droit : formulaire ── */}
            <div className="flex w-full lg:w-[45%] flex-col bg-white text-gray-900 shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-gray-100">
                    <Link href={home()} className="flex items-center gap-3">
                        <div
                            className="flex h-10 w-10 items-center justify-center rounded-xl shadow-md"
                            style={{ backgroundColor: '#ff7631' }}
                        >
                            <AppLogoIcon className="size-6 fill-white text-white" />
                        </div>
                        <div>
                            <div className="text-lg font-black tracking-tight leading-none" style={{ color: '#002f59' }}>
                                SEN<span style={{ color: '#ff7631' }}>ARCHIV</span>
                            </div>
                            <div className="text-[10px] text-gray-400 uppercase tracking-widest leading-none mt-0.5">
                                by DST Computing
                            </div>
                        </div>
                    </Link>
                    <div className="flex items-center gap-2">
                        <LanguageToggle />
                        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                            {t('auth.operational')}
                        </span>
                    </div>
                </div>

                {/* Corps */}
                <div className="flex flex-1 flex-col items-center justify-center px-8 py-10">
                    <div className="w-full max-w-sm">

                        <div className="mb-8 text-center">
                            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                            <p className="mt-2 text-sm text-gray-500">{description}</p>
                        </div>

                        <div className="flex items-center gap-3 mb-8">
                            <div className="h-px flex-1 bg-gray-200" />
                            <div className="flex gap-1">
                                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#002f59' }} />
                                <div className="h-1.5 w-4 rounded-full" style={{ backgroundColor: '#ff7631' }} />
                                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#002f59' }} />
                            </div>
                            <div className="h-px flex-1 bg-gray-200" />
                        </div>

                        {children}

                        <div className="mt-8 flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                                <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <p className="text-xs text-blue-700 leading-snug">
                                {t('auth.secure_connection')}<br />
                                {t('auth.data_protected')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                        &copy; {new Date().getFullYear()} SenArchiv — {t('common.copyright')}
                    </p>
                    <div className="flex gap-4">
                        <a href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Confidentialité</a>
                        <a href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Support</a>
                    </div>
                </div>
            </div>

        </div>
    );
}
