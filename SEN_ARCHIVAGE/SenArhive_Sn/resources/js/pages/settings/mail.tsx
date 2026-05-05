import { Head, useForm } from '@inertiajs/react';
import { CheckCircle, Eye, EyeOff, Mail, Send, XCircle } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import type { BreadcrumbItem } from '@/types';

interface MailConfig {
    id: string | null;
    mailer: string;
    host: string;
    port: number;
    username: string;
    has_password: boolean;
    encryption: string | null;
    from_address: string;
    from_name: string;
    actif: boolean;
    exists: boolean;
}

interface Props {
    config: MailConfig;
    status?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Paramètres', href: '/settings/profile' },
    { title: 'Configuration Mail', href: '/settings/mail' },
];

export default function MailSettings({ config, status }: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const [showTestForm, setShowTestForm] = useState(false);
    const [testEmail, setTestEmail] = useState('');

    const form = useForm({
        mailer:       config.mailer || 'smtp',
        host:         config.host || '',
        port:         config.port || 587,
        username:     config.username || '',
        password:     '',   // vide = ne pas modifier le mot de passe existant
        encryption:   config.encryption || 'tls',
        from_address: config.from_address || '',
        from_name:    config.from_name || '',
        actif:        config.actif,
    });

    const testForm = useForm({ test_email: '' });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.put('/settings/mail');
    }

    function submitTest(e: React.FormEvent) {
        e.preventDefault();
        testForm.setData('test_email', testEmail);
        testForm.post('/settings/mail/test', {
            onSuccess: () => setShowTestForm(false),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Configuration Mail" />
            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Configuration Mail"
                        description="Paramétrez votre serveur SMTP pour l'envoi d'emails depuis la plateforme"
                    />

                    {/* Alerte de statut */}
                    {status && (
                        <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
                            status.startsWith('Erreur')
                                ? 'border-destructive/30 bg-destructive/10 text-destructive'
                                : 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400'
                        }`}>
                            {status.startsWith('Erreur')
                                ? <XCircle className="h-4 w-4 shrink-0" />
                                : <CheckCircle className="h-4 w-4 shrink-0" />
                            }
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-6">
                        {/* Activation */}
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                                <p className="font-medium text-sm">Activer cette configuration</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Utiliser ces paramètres pour l'envoi d'emails de l'organisation
                                </p>
                            </div>
                            <Checkbox
                                checked={form.data.actif}
                                onCheckedChange={(checked: boolean) => form.setData('actif', checked)}
                            />
                        </div>

                        {/* Type de mailer */}
                        <div className="grid gap-2">
                            <Label>Type de mailer</Label>
                            <Select
                                value={form.data.mailer}
                                onValueChange={(val) => form.setData('mailer', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="smtp">SMTP</SelectItem>
                                    <SelectItem value="mailgun">Mailgun</SelectItem>
                                    <SelectItem value="sendmail">Sendmail</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Hôte et port */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2 grid gap-2">
                                <Label htmlFor="host">Hôte SMTP</Label>
                                <Input
                                    id="host"
                                    type="text"
                                    placeholder="smtp.gmail.com"
                                    value={form.data.host}
                                    onChange={(e) => form.setData('host', e.target.value)}
                                />
                                {form.errors.host && (
                                    <p className="text-xs text-destructive">{form.errors.host}</p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="port">Port</Label>
                                <Input
                                    id="port"
                                    type="number"
                                    placeholder="587"
                                    value={form.data.port}
                                    onChange={(e) => form.setData('port', parseInt(e.target.value) || 587)}
                                />
                                {form.errors.port && (
                                    <p className="text-xs text-destructive">{form.errors.port}</p>
                                )}
                            </div>
                        </div>

                        {/* Chiffrement */}
                        <div className="grid gap-2">
                            <Label>Chiffrement</Label>
                            <Select
                                value={form.data.encryption ?? 'none'}
                                onValueChange={(val: string) => form.setData('encryption', val === 'none' ? '' : val)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="tls">TLS (recommandé)</SelectItem>
                                    <SelectItem value="ssl">SSL</SelectItem>
                                    <SelectItem value="none">Aucun</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Authentification */}
                        <div className="space-y-4 rounded-lg border p-4">
                            <p className="text-sm font-medium">Authentification</p>
                            <div className="grid gap-2">
                                <Label htmlFor="username">Nom d'utilisateur / Email</Label>
                                <Input
                                    id="username"
                                    type="email"
                                    placeholder="votre@email.com"
                                    value={form.data.username}
                                    onChange={(e) => form.setData('username', e.target.value)}
                                    autoComplete="off"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">
                                    Mot de passe
                                    {config.has_password && (
                                        <span className="ml-2 text-xs text-muted-foreground font-normal">
                                            (laissez vide pour conserver l'actuel)
                                        </span>
                                    )}
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder={config.has_password ? '••••••••' : 'Mot de passe SMTP'}
                                        value={form.data.password}
                                        onChange={(e) => form.setData('password', e.target.value)}
                                        autoComplete="new-password"
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Expéditeur */}
                        <div className="space-y-4 rounded-lg border p-4">
                            <p className="text-sm font-medium">Expéditeur par défaut</p>
                            <div className="grid gap-2">
                                <Label htmlFor="from_address">Adresse email</Label>
                                <Input
                                    id="from_address"
                                    type="email"
                                    placeholder="no-reply@monentreprise.com"
                                    value={form.data.from_address}
                                    onChange={(e) => form.setData('from_address', e.target.value)}
                                />
                                {form.errors.from_address && (
                                    <p className="text-xs text-destructive">{form.errors.from_address}</p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="from_name">Nom affiché</Label>
                                <Input
                                    id="from_name"
                                    type="text"
                                    placeholder="Mon Entreprise"
                                    value={form.data.from_name}
                                    onChange={(e) => form.setData('from_name', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between">
                            <Button type="submit" disabled={form.processing}>
                                <Mail className="mr-2 h-4 w-4" />
                                {form.processing ? 'Sauvegarde...' : 'Sauvegarder'}
                            </Button>

                            {config.exists && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowTestForm(!showTestForm)}
                                >
                                    <Send className="mr-2 h-4 w-4" />
                                    Tester la configuration
                                </Button>
                            )}
                        </div>
                    </form>

                    {/* Formulaire de test */}
                    {showTestForm && (
                        <div className="rounded-lg border p-4 space-y-4 bg-muted/30">
                            <p className="text-sm font-medium">Envoyer un email de test</p>
                            <form onSubmit={submitTest} className="flex items-end gap-3">
                                <div className="flex-1 grid gap-2">
                                    <Label htmlFor="test_email">Adresse destinataire</Label>
                                    <Input
                                        id="test_email"
                                        type="email"
                                        placeholder="test@example.com"
                                        value={testEmail}
                                        onChange={(e) => setTestEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" disabled={testForm.processing}>
                                    <Send className="mr-2 h-4 w-4" />
                                    {testForm.processing ? 'Envoi...' : 'Envoyer le test'}
                                </Button>
                            </form>
                        </div>
                    )}
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
