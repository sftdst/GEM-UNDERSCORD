import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/hooks/use-language';
import { LANGUAGES } from '@/i18n';

export function LanguageToggle() {
    const { t } = useTranslation();
    const { currentLanguage, changeLanguage } = useLanguage();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Globe className="h-4 w-4" />
                    <span className="sr-only">{t('language.change')}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {LANGUAGES.map(({ value, label, flag }) => (
                    <DropdownMenuItem
                        key={value}
                        onClick={() => changeLanguage(value)}
                        className={currentLanguage === value ? 'bg-accent font-medium' : ''}
                    >
                        <span className="mr-2 text-base leading-none">{flag}</span>
                        {label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
