import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import pt from './locales/pt.json';

export type Language = 'fr' | 'en' | 'es' | 'pt';

export const LANGUAGES: { value: Language; label: string; flag: string }[] = [
    { value: 'fr', label: 'Français', flag: '🇫🇷' },
    { value: 'en', label: 'English', flag: '🇬🇧' },
    { value: 'es', label: 'Español', flag: '🇪🇸' },
    { value: 'pt', label: 'Português', flag: '🇵🇹' },
];

type TranslationTree = Record<string, unknown>;

function flattenTranslations(
    tree: TranslationTree,
    prefix = '',
    result: Record<string, string> = {},
): Record<string, string> {
    Object.entries(tree).forEach(([key, value]) => {
        const path = prefix ? `${prefix}.${key}` : key;

        if (typeof value === 'string') {
            result[path] = value;
            return;
        }

        if (value && typeof value === 'object' && !Array.isArray(value)) {
            flattenTranslations(value as TranslationTree, path, result);
        }
    });

    return result;
}

const flattenedLocales: Record<Language, Record<string, string>> = {
    fr: flattenTranslations(fr as TranslationTree),
    en: flattenTranslations(en as TranslationTree),
    es: flattenTranslations(es as TranslationTree),
    pt: flattenTranslations(pt as TranslationTree),
};

const runtimePhraseMaps = new Map<Language, Map<string, string>>();

export function getRuntimeTranslationMap(language: string): Map<string, string> {
    const normalized = (['fr', 'en', 'es', 'pt'].includes(language) ? language : 'fr') as Language;

    const cached = runtimePhraseMaps.get(normalized);
    if (cached) return cached;

    const source = flattenedLocales.fr;
    const target = flattenedLocales[normalized];
    const map = new Map<string, string>();

    Object.entries(source).forEach(([key, frValue]) => {
        const targetValue = target[key];
        if (typeof frValue === 'string' && typeof targetValue === 'string') {
            map.set(frValue, targetValue);
        }
    });

    runtimePhraseMaps.set(normalized, map);
    return map;
}

const getStoredLanguage = (): Language => {
    if (typeof window === 'undefined') return 'fr';
    return (localStorage.getItem('language') as Language) || 'fr';
};

i18n.use(initReactI18next).init({
    resources: {
        fr: { translation: fr },
        en: { translation: en },
        es: { translation: es },
        pt: { translation: pt },
    },
    lng: getStoredLanguage(),
    fallbackLng: 'fr',
    interpolation: {
        escapeValue: false,
    },
});

export default i18n;
