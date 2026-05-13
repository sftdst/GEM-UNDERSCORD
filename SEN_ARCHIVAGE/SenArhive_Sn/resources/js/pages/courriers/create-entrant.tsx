/* ── Créer un courrier entrant ──────────────────────────────────────────────── */

import { Head, Link, router, useForm } from '@inertiajs/react';
import { Plus, ArrowLeft, Send, FileText, Upload, Clock } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import type { CourrierType, Service, Utilisateur } from '@/types/models';

interface Props {
    types: CourrierType[];
    services: (Service & { departement?: { nom: string } })[];
    agents: Utilisateur[];
    numero: string;
}

interface EntrantFormData {
    objet: string;
    expediteur_nom: string;
    expediteur_email: string;
    expediteur_organisation: string;
    expediteur_adresse: string;
    expediteur_telephone: string;
    destinataire_nom: string;
    destinataire_email: string;
    destinataire_adresse: string;
    destinataire_organisation: string;
    categorie: string;
    urgence: string;
    moyen_envoi: string;
    service_id: string;
    courrier_type_id: string;
    reference: string;
    date_reception: string;
    date_echeance: string;
    observations: string;
    generer_accuse_reception: boolean;
    check_doublon: boolean;
    agent_affecte_id: string;
}

const URGENCE_COULEURS: Record<string, string> = {
    Normal: 'bg-green-100 text-green-800',
    Urgent: 'bg-orange-100 text-orange-800',
    TresUrgent: 'bg-red-100 text-red-800',
};

const _ = '__none__'; // Sentinel for empty Select values

export default function CreateEntrant({ types, services, agents, numero }: Props) {
    const [showPreview, setShowPreview] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const form = useForm<EntrantFormData>({
        objet: '',
        expediteur_nom: '',
        expediteur_email: '',
        expediteur_organisation: '',
        expediteur_adresse: '',
        expediteur_telephone: '',
        destinataire_nom: '',
        destinataire_email: '',
        destinataire_adresse: '',
        destinataire_organisation: '',
        categorie: _,
        urgence: 'Normal',
        moyen_envoi: '',
        service_id: _,
        courrier_type_id: _,
        reference: '',
        date_reception: new Date().toISOString().split('T')[0],
        date_echeance: '',
        observations: '',
        generer_accuse_reception: false,
        check_doublon: true,
        agent_affecte_id: _,
    });

    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setSubmitted(true);

        const data = new FormData();
        const cleaned: Record<string, string> = {};
        Object.entries(form.data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                cleaned[key] = value === _ ? '' : String(value);
            }
        });
        Object.entries(cleaned).forEach(([key, value]) => {
            if (value !== '') data.append(key, value);
        });
        if (selectedFile) {
            data.append('fichier', selectedFile);
        }

        router.post('/courriers/entrant', data, {
            forceFormData: true,
            onSuccess: () => {
                setShowPreview(true);
            },
            onFinish: () => setSubmitted(false),
        });
    }

    const selectedType = types.find((t) => t.id === form.data.courrier_type_id);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Courriers', href: '/courriers' },
                { title: 'Nouveau entrant', href: '/courriers/entrant/creer' },
            ]}
        >
            <Head title="Nouveau courrier entrant" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Nouveau courrier entrant</h1>
                        <p className="text-sm text-muted-foreground">
                            Numéro généré :{' '}
                            <span className="font-mono text-sm font-bold text-primary">{numero}</span>
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/courriers"><ArrowLeft className="mr-2 h-4 w-4" />Retour</Link>
                    </Button>
                </div>

                {selectedType && (
                    <div className="rounded-lg border border-border bg-muted/50 p-3">
                        <div className="flex items-center gap-2 text-sm">
                            <Badge style={{ backgroundColor: selectedType.couleur ?? '#6b7280', color: '#fff' }}>
                                {selectedType.nom}
                            </Badge>
                            <span className="text-muted-foreground">Code : {selectedType.code}</span>
                        </div>
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Send className="h-5 w-5" />
                            Informations du courrier
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Expéditeur</h3>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="md:col-span-2">
                                        <Label htmlFor="expediteur_nom">Nom / Organisation *</Label>
                                        <Input id="expediteur_nom" placeholder="Nom de l'expéditeur ou de l'organisation" value={form.data.expediteur_nom} onChange={(e) => form.setData('expediteur_nom', e.target.value)} required />
                                    </div>
                                    <div>
                                        <Label htmlFor="expediteur_email">Email</Label>
                                        <Input id="expediteur_email" type="email" placeholder="expediteur@exemple.com" value={form.data.expediteur_email} onChange={(e) => form.setData('expediteur_email', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label htmlFor="expediteur_telephone">Téléphone</Label>
                                        <Input id="expediteur_telephone" placeholder="+221 XX XXX XXXX" value={form.data.expediteur_telephone} onChange={(e) => form.setData('expediteur_telephone', e.target.value)} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label htmlFor="expediteur_adresse">Adresse</Label>
                                        <Input id="expediteur_adresse" placeholder="Adresse postale de l'expéditeur" value={form.data.expediteur_adresse} onChange={(e) => form.setData('expediteur_adresse', e.target.value)} />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-border" />

                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Destinataire (interne)</h3>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="destinataire_nom">Nom du destinataire *</Label>
                                        <Input id="destinataire_nom" placeholder="Nom et prénom du destinataire" value={form.data.destinataire_nom} onChange={(e) => form.setData('destinataire_nom', e.target.value)} required />
                                    </div>
                                    <div>
                                        <Label htmlFor="destinataire_email">Email du destinataire</Label>
                                        <Input id="destinataire_email" type="email" placeholder="destinataire@exemple.com" value={form.data.destinataire_email} onChange={(e) => form.setData('destinataire_email', e.target.value)} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label htmlFor="destinataire_adresse">Adresse</Label>
                                        <Input id="destinataire_adresse" placeholder="Adresse postale du destinataire" value={form.data.destinataire_adresse} onChange={(e) => form.setData('destinataire_adresse', e.target.value)} />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-border" />

                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Détails</h3>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="objet">Objet *</Label>
                                        <Input id="objet" placeholder="Objet du courrier" value={form.data.objet} onChange={(e) => form.setData('objet', e.target.value)} required />
                                    </div>
                                    <div>
                                        <Label htmlFor="reference">Référence</Label>
                                        <Input id="reference" placeholder="Référence externe" value={form.data.reference} onChange={(e) => form.setData('reference', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label htmlFor="type_courrier">Type de courrier</Label>
                                        <Select value={form.data.courrier_type_id} onValueChange={(v) => form.setData('courrier_type_id', v)}>
                                            <SelectTrigger><SelectValue placeholder="Sélectionner un type" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={_}>Aucun</SelectItem>
                                                {types.map((t) => <SelectItem key={t.id} value={t.id}>{t.nom}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="categorie">Catégorie</Label>
                                        <Select value={form.data.categorie} onValueChange={(v) => form.setData('categorie', v)}>
                                            <SelectTrigger><SelectValue placeholder="Sélectionner une catégorie" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={_}>Aucune</SelectItem>
                                                <SelectItem value="Ordinaire">Ordinaire</SelectItem>
                                                <SelectItem value="Confidentiel">Confidentiel</SelectItem>
                                                <SelectItem value="Facture">Facture</SelectItem>
                                                <SelectItem value="Juridique">Juridique</SelectItem>
                                                <SelectItem value="RH">RH</SelectItem>
                                                <SelectItem value="Autre">Autre</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="urgence">Urgence</Label>
                                        <Select value={form.data.urgence} onValueChange={(v) => form.setData('urgence', v)}>
                                            <SelectTrigger><SelectValue placeholder="Sélectionner l'urgence" /></SelectTrigger>
                                            <SelectContent>
                                                {['Normal', 'Urgent', 'TresUrgent'].map((u) => (
                                                    <SelectItem key={u} value={u}>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`h-2 w-2 rounded-full ${URGENCE_COULEURS[u]?.replace('100', '500') ?? 'bg-gray-400'}`} />
                                                            <span>{u === 'TresUrgent' ? 'Très urgent' : u}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="moyen_envoi">Moyen d'envoi</Label>
                                        <Select value={form.data.moyen_envoi} onValueChange={(v) => form.setData('moyen_envoi', v)}>
                                            <SelectTrigger><SelectValue placeholder="Moyen d'envoi" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Courrier postal">Courrier postal</SelectItem>
                                                <SelectItem value="Email">Email</SelectItem>
                                                <SelectItem value="Remise en main propre">Remise en main propre</SelectItem>
                                                <SelectItem value="Fax">Fax</SelectItem>
                                                <SelectItem value="Porteur">Porteur</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="service_id">Service destinataire</Label>
                                        <Select value={form.data.service_id} onValueChange={(v) => form.setData('service_id', v)}>
                                            <SelectTrigger><SelectValue placeholder="Sélectionner un service" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={_}>Non assigné</SelectItem>
                                                {services.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.nom}{s.departement ? ` (${s.departement.nom})` : ''}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="agent_affecte">Agent affecté</Label>
                                        <Select value={form.data.agent_affecte_id} onValueChange={(v) => form.setData('agent_affecte_id', v)}>
                                            <SelectTrigger><SelectValue placeholder="Sélectionner un agent (optionnel)" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={_}>Non affecté</SelectItem>
                                                {agents.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.prenom} {a.nom}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="date_reception">Date de réception</Label>
                                        <Input id="date_reception" type="date" value={form.data.date_reception} onChange={(e) => form.setData('date_reception', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label htmlFor="date_echeance">Date d'échéance</Label>
                                        <Input id="date_echeance" type="date" value={form.data.date_echeance} min={new Date().toISOString().split('T')[0]} onChange={(e) => form.setData('date_echeance', e.target.value)} />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-border" />

                            <div>
                                <Label htmlFor="observations">Observations</Label>
                                <Textarea id="observations" placeholder="Notes ou observations..." value={form.data.observations} onChange={(e) => form.setData('observations', e.target.value)} rows={3} />
                            </div>

                            <div>
                                <Label>Pièce jointe (optionnel)</Label>
                                <div className="mt-2">
                                    <input type="file" accept="application/pdf,image/*,.doc,.docx,.xlsx,.xls" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-primary/20" />
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 pt-4">
                                <Button type="submit" disabled={submitted} className="min-w-[160px]">
                                    {submitted ? <><Clock className="mr-2 h-4 w-4 animate-spin" />Enregistrement...</> : <><Send className="mr-2 h-4 w-4" />Enregistrer le courrier</>}
                                </Button>
                                <Button type="button" variant="outline" asChild><Link href="/courriers">Annuler</Link></Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Dialog open={showPreview} onOpenChange={setShowPreview}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-green-600"><FileText className="h-5 w-5" />Courrier enregistré avec succès</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="rounded-lg bg-muted p-4 text-sm"><p className="text-muted-foreground">Numéro :</p><p className="font-mono text-lg font-bold">{numero}</p></div>
                            <div className="text-sm">
                                <p className="text-muted-foreground">Objet : <span className="font-medium text-foreground">{form.data.objet}</span></p>
                                <p className="text-muted-foreground mt-1">Type : <span className="font-medium">{selectedType?.nom ?? 'Non défini'}</span></p>
                                <p className="text-muted-foreground mt-1">Catégorie : <span className="font-medium">{form.data.categorie === _ ? 'Non définie' : form.data.categorie}</span></p>
                            </div>
                            <div className="flex gap-2 justify-end pt-2">
                                <Button variant="outline" onClick={() => setShowPreview(false)}>Fermer</Button>
                                <Button onClick={() => router.visit(`/courriers/${numero}`)}>Voir le courrier</Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}