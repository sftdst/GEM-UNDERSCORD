import { Head, Link } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { Clock, CheckCircle, Mail, LogOut } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';

interface Props {
    organisation?: { nom: string } | null;
    utilisateur?: { nom: string; prenom: string; email: string } | null;
}

export default function EnAttenteValidation({ organisation, utilisateur }: Props) {
    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <>
            <Head title="Demande en cours de validation" />

            <div
                className="min-h-screen flex flex-col items-center justify-center p-6"
                style={{ background: 'linear-gradient(135deg, oklch(0.22 0.05 250) 0%, oklch(0.25 0.06 250) 100%)' }}
            >
                {/* Logo */}
                <div className="mb-8">
                    <Link href="/">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xl"
                                style={{ background: 'oklch(0.65 0.19 45)' }}
                            >
                                S
                            </div>
                            <span className="text-white font-bold text-xl">SenArhive</span>
                        </div>
                    </Link>
                </div>

                {/* Card principale */}
                <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 text-center">
                    {/* Icône animée */}
                    <div
                        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                        style={{ background: 'oklch(0.97 0.05 80)' }}
                    >
                        <Clock
                            className="w-10 h-10"
                            style={{ color: 'oklch(0.65 0.19 45)' }}
                        />
                    </div>

                    <h1
                        className="text-2xl font-bold mb-2"
                        style={{ color: 'oklch(0.25 0.06 250)' }}
                    >
                        Demande en cours de validation
                    </h1>

                    {organisation && (
                        <p className="text-gray-500 mb-4">
                            Organisation :{' '}
                            <span className="font-semibold text-gray-700">{organisation.nom}</span>
                        </p>
                    )}

                    <p className="text-gray-600 leading-relaxed mb-6">
                        Votre demande d'essai a bien été reçue. Notre équipe va l'examiner et vous
                        notifier par email dès qu'elle sera validée.
                    </p>

                    {/* Étapes */}
                    <div className="text-left space-y-3 bg-gray-50 rounded-xl p-5 mb-6">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                            <span className="text-sm text-gray-700">Compte créé avec succès</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div
                                className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                                style={{ borderColor: 'oklch(0.65 0.19 45)' }}
                            >
                                <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ background: 'oklch(0.65 0.19 45)' }}
                                />
                            </div>
                            <span className="text-sm text-gray-700 font-medium">
                                Validation par l'équipe SenArhive
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
                            <span className="text-sm text-gray-400">Accès à votre espace de travail</span>
                        </div>
                    </div>

                    {/* Email info */}
                    {utilisateur?.email && (
                        <div
                            className="flex items-center gap-3 rounded-xl p-4 mb-6"
                            style={{ background: 'oklch(0.97 0.03 250)' }}
                        >
                            <Mail className="w-5 h-5 shrink-0" style={{ color: 'oklch(0.45 0.10 250)' }} />
                            <p className="text-sm text-left" style={{ color: 'oklch(0.35 0.08 250)' }}>
                                Un email de confirmation vous sera envoyé à{' '}
                                <span className="font-semibold">{utilisateur.email}</span>
                            </p>
                        </div>
                    )}

                    <Button
                        variant="outline"
                        onClick={handleLogout}
                        className="w-full gap-2 text-gray-600"
                    >
                        <LogOut className="w-4 h-4" />
                        Se déconnecter
                    </Button>
                </div>

                <p className="text-white/40 text-xs mt-6">
                    © {new Date().getFullYear()} SenArhive — Plateforme d'archivage électronique
                </p>
            </div>
        </>
    );
}
