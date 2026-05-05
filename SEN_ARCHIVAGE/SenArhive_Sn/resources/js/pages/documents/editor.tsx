import { usePage, Head, Link, router } from '@inertiajs/react';
import { AlertCircle, Save, Download, ArrowLeft, CheckCircle } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';

interface Document {
    id: number | string;
    titre: string;
    version_courante: number;
    extension: string;
    taille_octets: number;
    createur?: {
        prenom: string;
        nom: string;
    };
}

export default function DocumentEditor({ document, preview }: { document: Document; preview: string | boolean }) {
    const { flash, errors } = usePage().props;
    const [isSaving, setIsSaving] = useState(false);
    const [commentaire, setCommentaire] = useState('');
    const editorRef = useRef<HTMLDivElement>(null);
    const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');

    useEffect(() => {
        // Initialiser le contenu de l'éditeur
        if (editorRef.current && preview && typeof preview === 'string') {
            editorRef.current.innerHTML = preview;
        }
    }, [preview]);

    useEffect(() => {
        // Lorsqu'on repasse en mode édition, réinjecter l'aperçu dans l'éditeur
        if (viewMode === 'edit' && editorRef.current && typeof preview === 'string') {
            editorRef.current.innerHTML = preview;
        }
    }, [viewMode, preview]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!editorRef.current) {
            alert('Erreur: éditeur non disponible');
            return;
        }

        const content = editorRef.current.innerHTML || '';
        if (!content.trim()) {
            alert('Le contenu ne peut pas être vide');
            return;
        }

        setIsSaving(true);

        router.post(`/documents/${document.id}/editor/save`, {
            content: content,
            commentaire: commentaire,
        }, {
            onFinish: () => {
                setIsSaving(false);
            },
        });
    };

    const handleDownload = () => {
        window.location.href = `/documents/${document.id}/download`;
    };

    const handleFormat = (cmd: string, value: string | null = null) => {
        // Utiliser try-catch pour éviter les erreurs liées à execCommand
        try {
            (document as any).execCommand(cmd, false, value || undefined);
        } catch (e) {
            console.error('Format error:', e);
        }
        editorRef.current?.focus();
    };

    const breadcrumbs = [
        { title: 'Documents', href: '/documents' },
        { title: document.titre, href: `/documents/${document.id}` },
        { title: 'Édition', href: `/documents/${document.id}/edit` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Éditer - ${document.titre}`} />
            
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4">
                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <a href={`/documents/${document.id}`}>
                                    <Button variant="ghost" size="icon">
                                        <ArrowLeft className="w-5 h-5" />
                                    </Button>
                                </a>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{document.titre}</h1>
                                    <p className="text-sm text-gray-600">Version {document.version_courante}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')}
                                    variant="outline"
                                >
                                    {viewMode === 'edit' ? 'Aperçu' : 'Éditer'}
                                </Button>
                                <Button 
                                    onClick={handleDownload}
                                    variant="outline"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Télécharger
                                </Button>
                                <Button 
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                                </Button>
                            </div>
                        </div>

                        {/* Notifications */}
                        {(flash as any)?.success && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <p className="text-green-700">{(flash as any).success}</p>
                            </div>
                        )}
                        {(flash as any)?.error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                <p className="text-red-700">{(flash as any).error}</p>
                            </div>
                        )}
                        {Object.keys(errors).length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                <div className="text-red-700">
                                    {Object.entries(errors).map(([key, value]) => (
                                        <p key={key}>{Array.isArray(value) ? value.join(', ') : value}</p>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {/* Editeur */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Édition du document</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Toolbar */}
                                <div className="p-4 bg-gray-50 border rounded-lg">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                                        <Button 
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleFormat('bold')}
                                            type="button"
                                            title="Gras (Ctrl+B)"
                                        >
                                            <strong>B</strong>
                                        </Button>
                                        <Button 
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleFormat('italic')}
                                            type="button"
                                            title="Italique"
                                        >
                                            <em>I</em>
                                        </Button>
                                        <Button 
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleFormat('underline')}
                                            type="button"
                                            title="Souligné"
                                        >
                                            <u>U</u>
                                        </Button>
                                        <Button 
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleFormat('insertUnorderedList')}
                                            type="button"
                                            title="Liste à puces"
                                        >
                                            • Liste
                                        </Button>
                                        <Button 
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleFormat('insertOrderedList')}
                                            type="button"
                                            title="Liste numérotée"
                                        >
                                            1. Liste
                                        </Button>
                                        <Button 
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleFormat('justifyLeft')}
                                            type="button"
                                            title="Aligner à gauche"
                                        >
                                            ⬅
                                        </Button>
                                        <Button 
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleFormat('justifyCenter')}
                                            type="button"
                                            title="Centrer"
                                        >
                                            ↔
                                        </Button>
                                        <Button 
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleFormat('justifyRight')}
                                            type="button"
                                            title="Aligner à droite"
                                        >
                                            ➡
                                        </Button>
                                    </div>
                                </div>

                                {/* Editeur contentEditable / Aperçu */}
                                {viewMode === 'edit' ? (
                                    <form onSubmit={handleSave} className="space-y-4">
                                        <div
                                            ref={editorRef}
                                            contentEditable
                                            suppressContentEditableWarning
                                            className="w-full min-h-96 p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                            style={{
                                                whiteSpace: 'pre-wrap',
                                                wordWrap: 'break-word',
                                            }}
                                        />
                                    </form>
                                ) : (
                                    <div className="w-full min-h-96 p-4 border rounded-lg bg-white overflow-auto" style={{whiteSpace: 'pre-wrap', wordWrap: 'break-word'}}>
                                        <div dangerouslySetInnerHTML={{ __html: preview || '<p>Aucun aperçu disponible</p>' }} />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Commentaire de version */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Commentaire de la version</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Input
                                    type="text"
                                    placeholder="Décrivez les modifications (optionnel)"
                                    value={commentaire}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCommentaire(e.target.value)}
                                    className="w-full"
                                />
                                <p className="text-sm text-gray-600 mt-2">
                                    Cela aidera à identifier les modifications apportées à ce document.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Informations */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Informations</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <dl className="grid grid-cols-2 gap-4">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-700">Format</dt>
                                        <dd className="text-sm text-gray-900 uppercase">{document.extension}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-700">Version actuelle</dt>
                                        <dd className="text-sm text-gray-900">v{document.version_courante}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-700">Taille</dt>
                                        <dd className="text-sm text-gray-900">{((document.taille_octets || 0) / 1024).toFixed(2)} KB</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-700">Créé par</dt>
                                        <dd className="text-sm text-gray-900">
                                            {document.createur?.prenom || ''} {document.createur?.nom || ''}
                                        </dd>
                                    </div>
                                </dl>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
