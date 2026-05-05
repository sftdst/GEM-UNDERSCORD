import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const CATEGORY_LABELS: Record<string, string> = {
    documents:     'Gestion documentaire',
    traitement:    'Traitement & Conversion',
    collaboration: 'Collaboration',
    securite:      'Sécurité & Conformité',
    integration:   'Intégrations & Support',
    ia:            'Intelligence Artificielle',
};

const CATEGORY_COLORS: Record<string, string> = {
    documents:     'bg-blue-50 text-blue-700 border-blue-200',
    traitement:    'bg-purple-50 text-purple-700 border-purple-200',
    collaboration: 'bg-green-50 text-green-700 border-green-200',
    securite:      'bg-red-50 text-red-700 border-red-200',
    integration:   'bg-orange-50 text-orange-700 border-orange-200',
    ia:            'bg-pink-50 text-pink-700 border-pink-200',
};

export default function FonctionnaliteIndex() {
    const { fonctionnalites, flash } = usePage().props as unknown as {
        fonctionnalites: Fonctionnalite[];
        flash: { success?: string; error?: string };
    };

    const grouped = fonctionnalites.reduce<Record<string, Fonctionnalite[]>>((acc, f) => {
        const cat = f.categorie ?? 'autres';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(f);
        return acc;
    }, {});

    const handleToggle = (f: Fonctionnalite) => {
        router.post(`/superadmin/fonctionnalites/${f.id}/toggle`);
    };

    const handleDelete = (f: Fonctionnalite) => {
        if (!confirm(`Supprimer la fonctionnalité "${f.nom}" ?`)) return;
        router.delete(`/superadmin/fonctionnalites/${f.id}`);
    };

    return (
        <SuperAdminLayout>
            <Head title="Fonctionnalités" />

            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Fonctionnalités</h1>
                        <p className="text-gray-600 mt-1">
                            Gérez la liste des fonctionnalités disponibles à octroyer aux plans
                        </p>
                    </div>
                    <Link href="/superadmin/fonctionnalites/create">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" /> Nouvelle fonctionnalité
                        </Button>
                    </Link>
                </div>

                {/* Flash */}
                {flash?.success && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                        <XCircle className="w-4 h-4" /> {flash.error}
                    </div>
                )}

                {fonctionnalites.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center text-gray-400">
                            <p className="text-lg">Aucune fonctionnalité définie</p>
                            <p className="text-sm mt-1">Commencez par créer les fonctionnalités disponibles sur la plateforme.</p>
                        </CardContent>
                    </Card>
                ) : (
                    Object.entries(grouped).map(([cat, items]) => (
                        <Card key={cat}>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${CATEGORY_COLORS[cat] ?? 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                                        {CATEGORY_LABELS[cat] ?? cat}
                                    </span>
                                    <span className="text-gray-400 font-normal text-sm">{items.length} fonctionnalité(s)</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="divide-y">
                                    {items.map((f) => (
                                        <div key={f.id} className="flex items-center justify-between py-3 gap-4">
                                            <div className="flex items-center gap-3 min-w-0">
                                                {f.actif
                                                    ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                                                    : <XCircle className="w-4 h-4 text-gray-300 shrink-0" />}
                                                <div className="min-w-0">
                                                    <p className="font-medium text-gray-900 text-sm">{f.nom}</p>
                                                    <p className="text-xs text-gray-400 font-mono">{f.code}</p>
                                                    {f.description && (
                                                        <p className="text-xs text-gray-500 mt-0.5 truncate">{f.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    onClick={() => handleToggle(f)}
                                                    title={f.actif ? 'Désactiver' : 'Activer'}
                                                    className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${f.actif ? 'text-green-600' : 'text-gray-400'}`}
                                                >
                                                    {f.actif
                                                        ? <ToggleRight className="w-5 h-5" />
                                                        : <ToggleLeft className="w-5 h-5" />}
                                                </button>
                                                <Link href={`/superadmin/fonctionnalites/${f.id}/edit`}>
                                                    <button className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors">
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(f)}
                                                    className="p-1.5 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </SuperAdminLayout>
    );
}
