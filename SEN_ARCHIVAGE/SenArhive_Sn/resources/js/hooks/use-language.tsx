import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { type Language } from '@/i18n';

const setCookie = (name: string, value: string, days = 365): void => {
    if (typeof document === 'undefined') return;
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

export function useLanguage() {
    const { i18n } = useTranslation();

    const changeLanguage = useCallback(
        (lang: Language) => {
            i18n.changeLanguage(lang);
            localStorage.setItem('language', lang);
            setCookie('language', lang);
            if (typeof document !== 'undefined') {
                document.documentElement.lang = lang;
            }
        },
        [i18n],
    );

    return {
        currentLanguage: (i18n.language || 'fr') as Language,
        changeLanguage,
    };
}
