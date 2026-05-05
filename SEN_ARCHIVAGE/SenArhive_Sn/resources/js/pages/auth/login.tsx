import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: Props) {
    const { t } = useTranslation();

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData) as Record<string, string | FormDataEntryValue>;

        router.post('/login', data, {
            onSuccess: () => {
                // Redirect happens automatically
            },
            replace: true,
        });
    };

    return (
        <AuthLayout
            title={t('auth.login_title')}
            description={t('auth.login_description')}
        >
            <Head title={t('auth.login_button')} />

            <form onSubmit={onSubmit} className="flex flex-col gap-6">
                <div className="grid gap-5">
                    {/* Adresse email */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="email" className="text-gray-700 font-semibold text-sm">
                            {t('auth.email')}
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="email"
                            placeholder={t('auth.email_placeholder')}
                            className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus-visible:border-orange-400 focus-visible:ring-orange-400/25"
                        />
                    </div>

                    {/* Mot de passe */}
                    <div className="grid gap-1.5">
                        <div className="flex items-center">
                            <Label htmlFor="password" className="text-gray-700 font-semibold text-sm">
                                {t('auth.password')}
                            </Label>
                            {canResetPassword && (
                                <TextLink
                                    href="/forgot-password"
                                    className="ml-auto text-sm text-orange-600 hover:text-orange-700"
                                    tabIndex={5}
                                >
                                    {t('auth.forgot_password')}
                                </TextLink>
                            )}
                        </div>
                        <Input
                            id="password"
                            type="password"
                            name="password"
                            required
                            tabIndex={2}
                            autoComplete="current-password"
                            placeholder={t('auth.password_placeholder')}
                            className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus-visible:border-orange-400 focus-visible:ring-orange-400/25"
                        />
                    </div>

                    {/* Se souvenir de moi */}
                    <div className="flex items-center space-x-3">
                        <Checkbox
                            id="remember"
                            name="remember"
                            tabIndex={3}
                        />
                        <Label htmlFor="remember" className="text-gray-600 font-normal text-sm cursor-pointer">
                            {t('auth.remember_me')}
                        </Label>
                    </div>

                    <Button
                        type="submit"
                        className="mt-2 w-full"
                        tabIndex={4}
                        data-test="login-button"
                    >
                        {t('auth.login_button')}
                    </Button>
                </div>

                {canRegister && (
                    <div className="text-center text-sm text-gray-500">
                        {t('auth.no_account')}{' '}
                        <TextLink href="/register" tabIndex={5} className="text-orange-600 hover:text-orange-700 font-medium">
                            {t('auth.create_account')}
                        </TextLink>
                    </div>
                )}
            </form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </AuthLayout>
    );
}
