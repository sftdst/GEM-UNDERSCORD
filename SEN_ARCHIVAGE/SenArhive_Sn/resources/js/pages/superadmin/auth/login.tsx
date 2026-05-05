import { Head, useForm } from '@inertiajs/react';
import { AlertCircle, Loader2 } from 'lucide-react';
import type { FormEventHandler } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Props = {
    status?: string;
};

export default function SuperAdminLogin({ status }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/superadmin/login', {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="SuperAdmin — Connexion" />

            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
                <Card className="w-full max-w-md bg-slate-800 border-slate-700">
                    <CardHeader className="space-y-2 text-center">
                        <div className="mx-auto w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">SA</span>
                        </div>
                        <CardTitle className="text-2xl font-bold text-white">SuperAdmin</CardTitle>
                        <p className="text-slate-400 text-sm">Connexion au tableau de bord administrateur</p>
                    </CardHeader>

                    <CardContent>
                        {status && (
                            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm text-center">
                                {status}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Email */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-200 mb-2">
                                    Email
                                </label>
                                <Input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="superadmin@senarchive.sn"
                                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                                    autoComplete="email"
                                    autoFocus
                                    required
                                />
                                {errors.email && (
                                    <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                                        <p className="text-red-400 text-xs">{errors.email}</p>
                                    </div>
                                )}
                            </div>

                            {/* Mot de passe */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-200 mb-2">
                                    Mot de passe
                                </label>
                                <Input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="••••••••"
                                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                                    autoComplete="current-password"
                                    required
                                />
                                {errors.password && (
                                    <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                                        <p className="text-red-400 text-xs">{errors.password}</p>
                                    </div>
                                )}
                            </div>

                            {/* Submit */}
                            <Button
                                type="submit"
                                disabled={processing}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Connexion…
                                    </>
                                ) : (
                                    'Se connecter'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
