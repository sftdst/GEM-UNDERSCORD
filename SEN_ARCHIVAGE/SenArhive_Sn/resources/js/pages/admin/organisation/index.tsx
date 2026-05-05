import { Head, useForm } from '@inertiajs/react';
import { Building2, Pencil, Globe, Clock, Languages } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Organisation } from '@/types/models';

interface Props {
    organisation: Organisation;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Administration', href: '/admin' },
    { title: 'Organisation', href: '/admin/organisation' },
];

const TIMEZONES = [
    'Africa/Dakar',
    'Africa/Abidjan',
    'Africa/Lagos',
    'Africa/Casablanca',
    'Europe/Paris',
    'UTC',
];

const LANGUES = [
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'Anglais' },
    { value: 'ar', label: 'Arabe' },
];

function formatStatut(statut: string): string {
    const map: Record<string, string> = {
        actif: 'Actif',
        suspendu: 'Suspendu',
        resilie: 'Résilié',
        essai: 'Essai',
    };
    return map[statut] ?? statut;
}

function statutVariant(statut: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    const map: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
        actif: 'default',
        essai: 'secondary',
        suspendu: 'destructive',
        resilie: 'outline',
    };
    return map[statut] ?? 'secondary';
}

export default function OrganisationIndex({ organisation }: Props) {
    const [showEdit, setShowEdit] = useState(false);

    const form = useForm({
        nom: organisation.nom,
        slug: organisation.slug,
        pays: organisation.pays,
        langue_defaut: organisation.langue_defaut,
        timezone: organisation.timezone,
        logo_url: organisation.logo_url ?? '',
    });

    function openEdit() {
        form.setData({
            nom: organisation.nom,
            slug: organisation.slug,
            pays: organisation.pays,
            langue_defaut: organisation.langue_defaut,
            timezone: organisation.timezone,
            logo_url: organisation.logo_url ?? '',
        });
        setShowEdit(true);
    }

    function submitEdit(e: FormEvent) {
        e.preventDefault();
        form.put('/admin/organisation', {
            onSuccess: () => setShowEdit(false),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Organisation" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Organisation</h1>
                    <Button onClick={openEdit}>
                        <Pencil className="mr-2 h-4 w-4" />Modifier
                    </Button>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Info generales */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-[#ff7631]" />
                                Informations generales
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Nom</span>
                                <span className="font-medium">{organisation.nom}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Slug</span>
                                <span className="font-mono text-sm">{organisation.slug}</span>
                            </div>
                            {organisation.domaine && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Domaine</span>
                                    <span className="font-mono text-sm">{organisation.domaine}</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Statut</span>
                                <Badge variant={statutVariant(organisation.statut)}>
                                    {formatStatut(organisation.statut)}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Localisation */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="h-5 w-5 text-[#002f59]" />
                                Localisation
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Pays</span>
                                <span className="font-medium">{organisation.pays}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                    <Languages className="mr-1 inline h-4 w-4" />Langue
                                </span>
                                <span className="font-medium">
                                    {LANGUES.find(l => l.value === organisation.langue_defaut)?.label ?? organisation.langue_defaut}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                    <Clock className="mr-1 inline h-4 w-4" />Fuseau horaire
                                </span>
                                <span className="font-mono text-sm">{organisation.timezone}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Plan & Abonnement */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Plan et stockage</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div>
                                    <span className="text-sm text-muted-foreground">Plan actuel</span>
                                    <p className="mt-1 text-lg font-semibold text-[#ff7631]">
                                        {organisation.plan?.nom ?? 'Aucun plan'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground">Stockage utilise</span>
                                    <p className="mt-1 text-lg font-semibold">
                                        {(organisation.stockage_utilise_mo / 1024).toFixed(2)} Go
                                        {organisation.plan && (
                                            <span className="text-sm font-normal text-muted-foreground">
                                                {' '}/ {organisation.plan.stockage_max_go} Go
                                            </span>
                                        )}
                                    </p>
                                    {organisation.plan && (
                                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                                            <div
                                                className="h-full rounded-full bg-[#ff7631]"
                                                style={{
                                                    width: `${Math.min(100, (organisation.stockage_utilise_mo / 1024 / organisation.plan.stockage_max_go) * 100)}%`,
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground">Fin de la periode d'essai</span>
                                    <p className="mt-1 text-lg font-semibold">
                                        {organisation.date_essai_fin
                                            ? new Date(organisation.date_essai_fin).toLocaleDateString('fr-FR')
                                            : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Edit Dialog */}
                <Dialog open={showEdit} onOpenChange={setShowEdit}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Modifier l'organisation</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={submitEdit} className="space-y-4">
                            <div>
                                <Label>Nom</Label>
                                <Input
                                    value={form.data.nom}
                                    onChange={(e) => form.setData('nom', e.target.value)}
                                    className="mt-1"
                                />
                                {form.errors.nom && <p className="mt-1 text-sm text-red-600">{form.errors.nom}</p>}
                            </div>
                            <div>
                                <Label>Slug</Label>
                                <Input
                                    value={form.data.slug}
                                    onChange={(e) => form.setData('slug', e.target.value)}
                                    className="mt-1"
                                />
                                {form.errors.slug && <p className="mt-1 text-sm text-red-600">{form.errors.slug}</p>}
                            </div>
                            <div>
                                <Label>Pays</Label>
                                <Input
                                    value={form.data.pays}
                                    onChange={(e) => form.setData('pays', e.target.value)}
                                    className="mt-1"
                                />
                                {form.errors.pays && <p className="mt-1 text-sm text-red-600">{form.errors.pays}</p>}
                            </div>
                            <div>
                                <Label>Langue par defaut</Label>
                                <select
                                    value={form.data.langue_defaut}
                                    onChange={(e) => form.setData('langue_defaut', e.target.value)}
                                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                >
                                    {LANGUES.map((l) => (
                                        <option key={l.value} value={l.value}>{l.label}</option>
                                    ))}
                                </select>
                                {form.errors.langue_defaut && <p className="mt-1 text-sm text-red-600">{form.errors.langue_defaut}</p>}
                            </div>
                            <div>
                                <Label>Fuseau horaire</Label>
                                <select
                                    value={form.data.timezone}
                                    onChange={(e) => form.setData('timezone', e.target.value)}
                                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                >
                                    {TIMEZONES.map((tz) => (
                                        <option key={tz} value={tz}>{tz}</option>
                                    ))}
                                </select>
                                {form.errors.timezone && <p className="mt-1 text-sm text-red-600">{form.errors.timezone}</p>}
                            </div>
                            <div>
                                <Label>URL du logo</Label>
                                <Input
                                    value={form.data.logo_url}
                                    onChange={(e) => form.setData('logo_url', e.target.value)}
                                    className="mt-1"
                                    placeholder="https://..."
                                />
                                {form.errors.logo_url && <p className="mt-1 text-sm text-red-600">{form.errors.logo_url}</p>}
                            </div>
                            <Button type="submit" disabled={form.processing} className="w-full">
                                Enregistrer
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
