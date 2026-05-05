import { Head, Link, router, usePage } from '@inertiajs/react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import SuperAdminLayout from '@/layouts/superadmin-layout';

interface Organisation {
    id: string;
    nom: string;
    slug: string;
    statut: 'actif' | 'inactif' | 'suspendu';
    langue_defaut: string;
    plan_id: string;
}

interface Plan {
    id: string;
    nom: string;
    prix_mensuel: number;
}

export default function EditOrganisation() {
    const page = usePage();
    const { organisation, plans } = page.props as unknown as {
        organisation: Organisation;
        plans: Plan[];
    };

    const [formData, setFormData] = useState({
        nom: organisation.nom,
        plan_id: organisation.plan_id,
        statut: organisation.statut,
        langue_defaut: organisation.langue_defaut,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));

        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        router.put(`/superadmin/organisations/${organisation.id}`, formData, {
            onError: (errors) => {
                setErrors(errors);
                setLoading(false);
            },
        });
    };

    return (
        <SuperAdminLayout>
            <Head title={`Éditer ${organisation.nom}`} />

            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Éditer l'Organisation</h1>
                    <p className="text-gray-600 mt-1">{organisation.nom}</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Informations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <Label htmlFor="nom">Nom *</Label>
                                <Input
                                    id="nom"
                                    value={formData.nom}
                                    onChange={(e) => handleChange('nom', e.target.value)}
                                    className={errors.nom ? 'border-red-500' : ''}
                                />
                                {errors.nom && <p className="text-red-500 text-sm mt-1">{errors.nom}</p>}
                            </div>

                            <div>
                                <Label htmlFor="plan_id">Plan *</Label>
                                <Select value={formData.plan_id} onValueChange={(v) => handleChange('plan_id', v)}>
                                    <SelectTrigger className={errors.plan_id ? 'border-red-500' : ''}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {plans.map((plan) => (
                                            <SelectItem key={plan.id} value={plan.id}>
                                                {plan.nom}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.plan_id && <p className="text-red-500 text-sm mt-1">{errors.plan_id}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="statut">Statut *</Label>
                                    <Select value={formData.statut} onValueChange={(v) => handleChange('statut', v)}>
                                        <SelectTrigger className={errors.statut ? 'border-red-500' : ''}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="actif">Actif</SelectItem>
                                            <SelectItem value="inactif">Inactif</SelectItem>
                                            <SelectItem value="suspendu">Suspendu</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.statut && <p className="text-red-500 text-sm mt-1">{errors.statut}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="langue_defaut">Langue *</Label>
                                    <Select value={formData.langue_defaut} onValueChange={(v) => handleChange('langue_defaut', v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="fr">Français</SelectItem>
                                            <SelectItem value="en">English</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex gap-3 border-t pt-6">
                                <Link href={`/superadmin/organisations/${organisation.id}`}>
                                    <Button variant="outline">Annuler</Button>
                                </Link>
                                <Button type="submit" disabled={loading}>
                                    {loading ? 'Mise à jour...' : 'Mettre à jour'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </SuperAdminLayout>
    );
}
