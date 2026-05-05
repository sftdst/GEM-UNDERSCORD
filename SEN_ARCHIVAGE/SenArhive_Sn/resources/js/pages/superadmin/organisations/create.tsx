import { Head, Link, router, usePage } from '@inertiajs/react';
import { AlertCircle } from 'lucide-react';
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

interface Plan {
    id: string;
    nom: string;
    prix_mensuel: number;
}

export default function CreateOrganisation() {
    const page = usePage();
    const { plans } = page.props as unknown as { plans: Plan[] };

    const [formData, setFormData] = useState({
        nom: '',
        slug: '',
        domaine: '',
        plan_id: '',
        pays: 'SN',
        langue_defaut: 'fr',
        admin_nom: '',
        admin_prenom: '',
        admin_email: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const generateSlug = (nom: string) => {
        return nom
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));

        if (field === 'nom' && !formData.slug) {
            setFormData((prev) => ({
                ...prev,
                slug: generateSlug(value),
            }));
        }

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

        router.post('/superadmin/organisations', formData, {
            onError: (errors) => {
                setErrors(errors);
                setLoading(false);
            },
        });
    };

    return (
        <SuperAdminLayout>
            <Head title="Créer une Organisation" />

            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Nouvelle Organisation</h1>
                    <p className="text-gray-600 mt-1">Créer une nouvelle organisation avec administrateur</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Informations Principales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Organisation Info */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-900">Organisation</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="nom">Nom de l'organisation *</Label>
                                        <Input
                                            id="nom"
                                            placeholder="Ministère de la Santé"
                                            value={formData.nom}
                                            onChange={(e) => handleChange('nom', e.target.value)}
                                            className={errors.nom ? 'border-red-500' : ''}
                                        />
                                        {errors.nom && <p className="text-red-500 text-sm mt-1">{errors.nom}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="slug">Slug *</Label>
                                        <Input
                                            id="slug"
                                            placeholder="ministere-sante"
                                            value={formData.slug}
                                            onChange={(e) => handleChange('slug', e.target.value)}
                                            className={errors.slug ? 'border-red-500' : ''}
                                        />
                                        {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug}</p>}
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="domaine">Domaine (optionnel)</Label>
                                    <Input
                                        id="domaine"
                                        placeholder="sante.senarchive.sn"
                                        value={formData.domaine}
                                        onChange={(e) => handleChange('domaine', e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <Label htmlFor="plan_id">Plan *</Label>
                                        <Select value={formData.plan_id} onValueChange={(v) => handleChange('plan_id', v)}>
                                            <SelectTrigger className={errors.plan_id ? 'border-red-500' : ''}>
                                                <SelectValue placeholder="Sélectionner un plan" />
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

                                    <div>
                                        <Label htmlFor="pays">Pays *</Label>
                                        <Input
                                            id="pays"
                                            placeholder="SN"
                                            maxLength={2}
                                            value={formData.pays}
                                            onChange={(e) => handleChange('pays', e.target.value)}
                                            className={errors.pays ? 'border-red-500' : ''}
                                        />
                                        {errors.pays && <p className="text-red-500 text-sm mt-1">{errors.pays}</p>}
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
                            </div>

                            {/* Admin Info */}
                            <div className="space-y-4 border-t pt-6">
                                <h3 className="font-semibold text-gray-900">Administrateur</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="admin_nom">Nom *</Label>
                                        <Input
                                            id="admin_nom"
                                            placeholder="Dupont"
                                            value={formData.admin_nom}
                                            onChange={(e) => handleChange('admin_nom', e.target.value)}
                                            className={errors.admin_nom ? 'border-red-500' : ''}
                                        />
                                        {errors.admin_nom && <p className="text-red-500 text-sm mt-1">{errors.admin_nom}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="admin_prenom">Prénom *</Label>
                                        <Input
                                            id="admin_prenom"
                                            placeholder="Jean"
                                            value={formData.admin_prenom}
                                            onChange={(e) => handleChange('admin_prenom', e.target.value)}
                                            className={errors.admin_prenom ? 'border-red-500' : ''}
                                        />
                                        {errors.admin_prenom && <p className="text-red-500 text-sm mt-1">{errors.admin_prenom}</p>}
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="admin_email">Email *</Label>
                                    <Input
                                        id="admin_email"
                                        type="email"
                                        placeholder="admin@organisation.sn"
                                        value={formData.admin_email}
                                        onChange={(e) => handleChange('admin_email', e.target.value)}
                                        className={errors.admin_email ? 'border-red-500' : ''}
                                    />
                                    {errors.admin_email && <p className="text-red-500 text-sm mt-1">{errors.admin_email}</p>}
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 border-t pt-6">
                                <Link href="/superadmin/organisations">
                                    <Button variant="outline">Annuler</Button>
                                </Link>
                                <Button type="submit" disabled={loading}>
                                    {loading ? 'Création...' : 'Créer Organisation'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </SuperAdminLayout>
    );
}
