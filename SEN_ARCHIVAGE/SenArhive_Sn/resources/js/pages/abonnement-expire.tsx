import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, CreditCard, LogOut, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
    organisation?: { nom: string };
}

export default function AbonnementExpire({ organisation }: Props) {
    return (
        <>
            <Head title="Accès suspendu" />
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="w-full max-w-lg border-red-200 dark:border-red-800">
                    <CardContent className="p-8 text-center">
                        {/* Icône */}
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                            <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
                        </div>

                        {/* Titre */}
                        <h1 className="mb-2 text-2xl font-bold text-foreground">
                            Accès suspendu
                        </h1>

                        {/* Organisation */}
                        {organisation?.nom && (
                            <p className="mb-4 text-sm font-medium text-muted-foreground">
                                Organisation : <span className="text-foreground">{organisation.nom}</span>
                            </p>
                        )}

                        {/* Message */}
                        <p className="mb-6 text-muted-foreground">
                            L'abonnement de votre organisation a expiré depuis plus de 30 jours.
                            L'accès à la plateforme a été automatiquement suspendu.
                        </p>

                        {/* Instructions */}
                        <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-left dark:border-amber-800 dark:bg-amber-950">
                            <p className="mb-2 text-sm font-semibold text-amber-800 dark:text-amber-200">
                                Comment réactiver votre accès ?
                            </p>
                            <ul className="space-y-1 text-sm text-amber-700 dark:text-amber-300">
                                <li className="flex items-start gap-2">
                                    <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                                    <span>Contactez le Super Administrateur pour renouveler votre abonnement.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CreditCard className="mt-0.5 h-4 w-4 shrink-0" />
                                    <span>Une fois l'abonnement renouvelé, votre accès sera rétabli automatiquement.</span>
                                </li>
                            </ul>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                            >
                                <Button variant="outline" className="w-full sm:w-auto">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Se déconnecter
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
