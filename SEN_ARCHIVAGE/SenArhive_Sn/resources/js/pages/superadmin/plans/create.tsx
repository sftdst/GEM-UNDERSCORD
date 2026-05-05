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
}

const CATEGORY_LABELS: Record<string, string> = {
    documents:     'Gestion documentaire',
    traitement:    'Traitement & Conversion',
    collaboration: 'Collaboration',
    securite:      'Sécurité & Conformité',
    integration:   'Intégrations & Support',
    ia:            'Intelligence Artificielle',
};

export default function PlanCreate() {
    const { fonctionnalites } = usePage().props as unknown as { fonctionnalites: Fonctionnalite[] };

    const { data, setData, post, processing, errors } = useForm({
        nom:               '',
        description:       '',
        prix_mensuel:      '',
        prix_annuel:       '',
        stockage_max_go:   '5',
        users_max:         '',
        documents_max:     '',
        actif:             true,
        fonctionnalite_ids: [] as string[],
    });

    const toggleFeature = (id: string) => {
        const ids = data.fonctionnalite_ids.includes(id)
            ? data.fonctionnalite_ids.filter((x) => x !== id)
            : [...data.fonctionnalite_ids, id];
        setData('fonctionnalite_ids', ids);
    };

    const grouped = fonctionnalites.reduce<Record<string, Fonctionnalite[]>>((acc, f) => {
        const cat = f.categorie ?? 'autres';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(f);
        return acc;
    }, {});

    const economie = () => {
        const m = Number(data.prix_mensuel);
        const a = Number(data.prix_annuel);
        if (!m || !a || a >= m * 12) return null;
        const pct = Math.round((1 - a / (m * 12)) * 100);
        return { montant: new Intl.NumberFormat('fr-FR').format(m * 12 - a), pct };
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/superadmin/plans');
    };

    const eco = economie();

    return (
        <SuperAdminLayout>
            <Head title="Nouveau Plan" />

            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Nouveau Plan</h1>
                        <p className="text-gray-600 mt-1">Créer un nouveau plan d'abonnement</p>
                    </div>
                    <Link href="/superadmin/plans">
                        <Button variant="outline">Retour</Button>
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Infos générales */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Informations Générales</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="nom">Nom du Plan *</Label>
                                <Input
                                    id="nom"
                                    value={data.nom}
                                    onChange={(e) => setData('nom', e.target.value)}
                                    placeholder="Ex: Starter, Pro, Enterprise..."
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
                                    placeholder="Décrivez ce que ce plan offre..."
                                    rows={3}
                                    className="mt-1"
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
                                    Plan actif — visible et souscriptible par les clients
                                </Label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tarification */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Tarification</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="prix_mensuel">Prix Mensuel (FCFA) *</Label>
                                    <Input
                                        id="prix_mensuel"
                                        type="number"
                                        min="0"
                                        step="500"
                                        value={data.prix_mensuel}
                                        onChange={(e) => setData('prix_mensuel', e.target.value)}
                                        placeholder="0"
                                        required
                                        className="mt-1"
                                    />
                                    {errors.prix_mensuel && (
                                        <p className="text-red-500 text-sm mt-1">{errors.prix_mensuel}</p>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="prix_annuel">Prix Annuel (FCFA) *</Label>
                                    <Input
                                        id="prix_annuel"
                                        type="number"
                                        min="0"
                                        step="1000"
                                        value={data.prix_annuel}
                                        onChange={(e) => setData('prix_annuel', e.target.value)}
                                        placeholder="0"
                                        required
                                        className="mt-1"
                                    />
                                    {errors.prix_annuel && (
                                        <p className="text-red-500 text-sm mt-1">{errors.prix_annuel}</p>
                                    )}
                                </div>
                            </div>
                            {eco && (
                                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                                    <CheckIcon />
                                    Économie annuelle : <strong>{eco.montant} FCFA</strong> ({eco.pct}% de réduction)
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Limites */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Limites & Quotas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="stockage">Stockage Maximum (Go) *</Label>
                                <Input
                                    id="stockage"
                                    type="number"
                                    min="1"
                                    value={data.stockage_max_go}
                                    onChange={(e) => setData('stockage_max_go', e.target.value)}
                                    required
                                    className="mt-1"
                                />
                                {errors.stockage_max_go && (
                                    <p className="text-red-500 text-sm mt-1">{errors.stockage_max_go}</p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="users_max">
                                        Utilisateurs Max{' '}
                                        <span className="text-gray-400 font-normal">(vide = illimité)</span>
                                    </Label>
                                    <Input
                                        id="users_max"
                                        type="number"
                                        min="1"
                                        value={data.users_max}
                                        onChange={(e) => setData('users_max', e.target.value)}
                                        placeholder="Illimité"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="documents_max">
                                        Documents Max{' '}
                                        <span className="text-gray-400 font-normal">(vide = illimité)</span>
                                    </Label>
                                    <Input
                                        id="documents_max"
                                        type="number"
                                        min="1"
                                        value={data.documents_max}
                                        onChange={(e) => setData('documents_max', e.target.value)}
                                        placeholder="Illimité"
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Fonctionnalités */}
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                Fonctionnalités Incluses{' '}
                                {data.fonctionnalite_ids.length > 0 && (
                                    <span className="ml-2 text-sm font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                        {data.fonctionnalite_ids.length} sélectionnée(s)
                                    </span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {fonctionnalites.length === 0 ? (
                                <p className="text-sm text-gray-400 py-4 text-center">
                                    Aucune fonctionnalité disponible.{' '}
                                    <a href="/superadmin/fonctionnalites/create" className="text-blue-600 hover:underline">
                                        Créer des fonctionnalités
                                    </a>
                                </p>
                            ) : (
                                <div className="space-y-5">
                                    {Object.entries(grouped).map(([cat, items]) => (
                                        <div key={cat}>
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                                {CATEGORY_LABELS[cat] ?? cat}
                                            </p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {items.map((f) => {
                                                    const checked = data.fonctionnalite_ids.includes(f.id);
                                                    return (
                                                        <label
                                                            key={f.id}
                                                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                                                checked
                                                                    ? 'bg-blue-50 border-blue-300'
                                                                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                onChange={() => toggleFeature(f.id)}
                                                                className="mt-0.5 w-4 h-4 accent-blue-600 shrink-0"
                                                            />
                                                            <div>
                                                                <p className={`text-sm font-medium ${checked ? 'text-blue-800' : 'text-gray-700'}`}>
                                                                    {f.nom}
                                                                </p>
                                                                {f.description && (
                                                                    <p className="text-xs text-gray-400 mt-0.5">{f.description}</p>
                                                                )}
                                                            </div>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Submit */}
                    <div className="flex gap-4 justify-end">
                        <Link href="/superadmin/plans">
                            <Button variant="outline" type="button">
                                Annuler
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Enregistrement...' : 'Créer le Plan'}
                        </Button>
                    </div>
                </form>
            </div>
        </SuperAdminLayout>
    );
}

function CheckIcon() {
    return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    );
}
