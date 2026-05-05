import { Head, useForm } from '@inertiajs/react';
import { FileText, Download, FolderOpen, Lock, Clock } from 'lucide-react';
import { type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { LienPartage, Document, Dossier } from '@/types/models';

interface Props {
    token: string;
    lien: LienPartage & {
        document?: Document;
        dossier?: Dossier & { documents: Document[] };
    };
    has_password: boolean;
    verified: boolean;
}

export default function SharePublic({ token, lien, has_password, verified }: Props) {
    const form = useForm({ mot_de_passe: '' });

    function submitPassword(e: FormEvent) {
        e.preventDefault();
        form.post(`/s/${token}/verify`);
    }

    return (
        <>
            <Head title="Lien de partage — SEN_ARCHIV" />
            <div className="flex min-h-screen flex-col items-center bg-background">
                {/* Header */}
                <div className="w-full border-b bg-card">
                    <div className="mx-auto flex h-14 max-w-2xl items-center px-4">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md" style={{ backgroundColor: '#ff7631' }}>
                                <FileText className="h-4 w-4 text-white" />
                            </div>
                            <span className="font-bold" style={{ color: '#002f59' }}>SEN_ARCHIV</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="mx-auto w-full max-w-2xl px-4 py-12">
                    {has_password && !verified ? (
                        <Card>
                            <CardContent className="p-8">
                                <div className="text-center">
                                    <Lock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                    <h2 className="text-xl font-bold">Accès protégé</h2>
                                    <p className="mt-2 text-muted-foreground">
                                        Ce lien de partage est protégé par un mot de passe.
                                    </p>
                                </div>
                                <form onSubmit={submitPassword} className="mt-6 space-y-4">
                                    <div>
                                        <Label>Mot de passe</Label>
                                        <Input
                                            type="password"
                                            value={form.data.mot_de_passe}
                                            onChange={(e) => form.setData('mot_de_passe', e.target.value)}
                                            placeholder="Entrez le mot de passe"
                                            className="mt-1"
                                            autoFocus
                                        />
                                        {form.errors.mot_de_passe && (
                                            <p className="mt-1 text-sm text-destructive">{form.errors.mot_de_passe}</p>
                                        )}
                                    </div>
                                    <Button type="submit" disabled={form.processing} className="w-full">
                                        Accéder
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {/* Document share */}
                            {lien.document && (
                                <Card>
                                    <CardContent className="p-8">
                                        <div className="flex flex-col items-center text-center">
                                            <FileText className="mb-4 h-16 w-16 text-primary" />
                                            <h2 className="text-xl font-bold">{lien.document.titre}</h2>
                                            <p className="mt-2 text-sm text-muted-foreground">
                                                {lien.document.extension?.toUpperCase()} &middot; {lien.document.taille_formatee}
                                            </p>
                                            {lien.document.description && (
                                                <p className="mt-3 text-sm text-muted-foreground">{lien.document.description}</p>
                                            )}
                                            <a href={`/s/${token}/download`}>
                                                <Button className="mt-6" size="lg">
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Télécharger
                                                </Button>
                                            </a>
                                        </div>
                                        {lien.expire_le && (
                                            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                Expire le {new Date(lien.expire_le).toLocaleDateString('fr-FR', {
                                                    day: 'numeric', month: 'long', year: 'numeric',
                                                })}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Folder share */}
                            {lien.dossier && (
                                <Card>
                                    <CardContent className="p-8">
                                        <div className="mb-6 text-center">
                                            <FolderOpen className="mx-auto mb-4 h-16 w-16 text-primary" />
                                            <h2 className="text-xl font-bold">{lien.dossier.nom}</h2>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {lien.dossier.documents.length} document(s)
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            {lien.dossier.documents.map((doc) => (
                                                <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3">
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="h-5 w-5 text-primary" />
                                                        <div>
                                                            <p className="text-sm font-medium">{doc.titre}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {doc.extension?.toUpperCase()} &middot; {doc.taille_formatee}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <a href={`/s/${token}/download/${doc.id}`}>
                                                        <Button variant="outline" size="sm">
                                                            <Download className="mr-1 h-3 w-3" />
                                                            Télécharger
                                                        </Button>
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                        {lien.expire_le && (
                                            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                Expire le {new Date(lien.expire_le).toLocaleDateString('fr-FR', {
                                                    day: 'numeric', month: 'long', year: 'numeric',
                                                })}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
