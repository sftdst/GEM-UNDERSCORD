import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import SuperAdminLayout from '@/layouts/superadmin-layout';

interface Fonctionnalite {
    id: string;
    code: string;
    nom: string;
    description: string | null;
    categorie: string | null;
    ordre: number;
    actif: boolean;
}

const CATEGORIES = [
    { value: 'documents',     label: 'Gestion documentaire' },
    { value: 'traitement',    label: 'Traitement & Conversion' },
    { value: 'collaboration', label: 'Collaboration' },
    { value: 'securite',      label: 'Sécurité & Conformité' },
    { value: 'integration',   label: 'Intégrations & Support' },
    { value: 'ia',            label: 'Intelligence Artificielle' },
];

export default function FonctionnaliteEdit() {
    const { fonctionnalite } = usePage().props as unknown as { fonctionnalite: Fonctionnalite };

    const { data, setData, put, processing, errors } = useForm({
        code:        fonctionnalite.code,
        nom:         fonctionnalite.nom,
        description: fonctionnalite.description ?? '',
        categorie:   fonctionnalite.categorie ?? '',
        ordre:       fonctionnalite.ordre,
        actif:       fonctionnalite.actif,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/superadmin/fonctionnalites/${fonctionnalite.id}`);
    };

    return (
        <SuperAdminLayout>
            <Head title={`Modifier — ${fonctionnalite.nom}`} />

            <div className="max-w-xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Modifier la Fonctionnalité</h1>
                        <p className="text-gray-600 mt-1 font-mono text-sm">{fonctionnalite.code}</p>
                    </div>
                    <Link href="/superadmin/fonctionnalites">
                        <Button variant="outline">Retour</Button>
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Identification</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="code">Code technique *</Label>
                                <Input
                                    id="code"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                                    required
                                    className="mt-1 font-mono"
                                />
                                {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
                            </div>

                            <div>
                                <Label htmlFor="nom">Nom affiché *</Label>
                                <Input
                                    id="nom"
                                    value={data.nom}
                                    onChange={(e) => setData('nom', e.target.value)}
                                    required
                                    className="mt-1"
                                />
                                {errors.nom && <p className="text-red-500 text-sm mt-1">{errors.nom}</p>}
                            </div>

                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={2}
                                    className="mt-1"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Classification</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="categorie">Catégorie</Label>
                                <select
                                    id="categorie"
                                    value={data.categorie}
                                    onChange={(e) => setData('categorie', e.target.value)}
                                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <option value="">— Sans catégorie —</option>
                                    {CATEGORIES.map((c) => (
                                        <option key={c.value} value={c.value}>{c.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <Label htmlFor="ordre">Ordre d'affichage</Label>
                                <Input
                                    id="ordre"
                                    type="number"
                                    min="0"
                                    value={data.ordre}
                                    onChange={(e) => setData('ordre', Number(e.target.value))}
                                    className="mt-1 w-24"
                                />
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <input
                                    type="checkbox"
                                    id="actif"
                                    checked={data.actif}
                                    onChange={(e) => setData('actif', e.target.checked)}
                                    className="w-4 h-4 accent-blue-600"
                                />
                                <Label htmlFor="actif" className="cursor-pointer">
                                    Fonctionnalité active — visible dans les formulaires de plans
                                </Label>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex gap-4 justify-end">
                        <Link href="/superadmin/fonctionnalites">
                            <Button variant="outline" type="button">Annuler</Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                    </div>
                </form>
            </div>
        </SuperAdminLayout>
    );
}
