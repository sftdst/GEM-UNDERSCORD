/* ── Créer un courrier sortant ──────────────────────────────────────────────── */

import { Head, Link, router, useForm } from '@inertiajs/react';
import { Plus, ArrowLeft, Send, FileText, Clock } from 'lucide-react';
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
import type { CourrierType, Service } from '@/types/models';

interface Props {
    types: CourrierType[];
    services: (Service & { departement?: { nom: string } })[];
    numero: string;
}

interface SortantFormData {
    objet: string;
    destinataire_nom: string;
    destinataire_email: string;
    destinataire_organisation: string;
    destinataire_adresse: string;
    destinataire_telephone: string;
    categorie: string;
    urgence: string;
    moyen_envoi: string;
    service_id: string;
    courrier_type_id: string;
    reference: string;
    date_envoi: string;
    date_echeance: string;
    observations: string;
    generer_accuse_reception: boolean;
}

const URGENCE_COULEURS: Record<string, string> = {
    Normal: 'bg-green-100 text-green-800',
    Urgent: 'bg-orange-100 text-orange-800',
    TresUrgent: 'bg-red-100 text-red-800',
};

const _ = '__none__';

export default function CreateSortant({ types, services, numero }: Props) {
    const [showPreview, setShowPreview] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const form = useForm<SortantFormData>({
        objet: '',
        destinataire_nom: '',
        destinataire_email: '',
        destinataire_organisation: '',
        destinataire_adresse: '',
        destinataire_telephone: '',
        categorie: _,
        urgence: 'Normal',
        moyen_envoi: '',
        service_id: _,
        courrier_type_id: _,
        reference: '',
        date_envoi: new Date().toISOString().split('T')[0],
        date_echeance: '',
        observations: '',
        generer_accuse_reception: false,
    });

    const selectedType = types.find((t) => t.id === form.data.courrier_type_id);

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

        router.post('/courriers/sortant', data, {
            forceFormData: true,
            onSuccess: () => {
                setShowPreview(true);
            },
            onFinish: () => setSubmitted(false),
        });
    }

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Courriers', href: '/courriers' },
                { title: 'Nouveau sortant', href: '/courriers/sortant/creer' },
            ]}
        >
            <Head title="Nouveau courrier sortant" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Nouveau courrier sortant</h1>
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
                            <Badge style={{ backgroundColor: selectedType.couleur ?? '#6b7280', color: '#fff' }}>{selectedType.nom}</Badge>
                            <span className="text-muted-foreground">Code : {selectedType.code}</span>
                        </div>
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5" />Informations du courrier</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Destinataire</h3>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="md:col-span-2">
                                        <Label htmlFor="destinataire_nom">Nom / Organisation *</Label>
                                        <Input id="destinataire_nom" placeholder="Nom du destinataire ou de l'organisation" value={form.data.destinataire_nom} onChange={(e) => form.setData('destinataire_nom', e.target.value)} required />
                                    </div>
                                    <div>
                                        <Label htmlFor="destinataire_email">Email</Label>
                                        <Input id="destinataire_email" type="email" placeholder="destinataire@exemple.com" value={form.data.destinataire_email} onChange={(e) => form.setData('destinataire_email', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label htmlFor="destinataire_telephone">Téléphone</Label>
                                        <Input id="destinataire_telephone" placeholder="+221 XX XXX XXXX" value={form.data.destinataire_telephone} onChange={(e) => form.setData('destinataire_telephone', e.target.value)} />
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
                                        <Input id="reference" placeholder="Référence interne" value={form.data.reference} onChange={(e) => form.setData('reference', e.target.value)} />
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
                                                <SelectItem value="DHL/FedEx">DHL / FedEx</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="service_id">Service expéditeur</Label>
                                        <Select value={form.data.service_id} onValueChange={(v) => form.setData('service_id', v)}>
                                            <SelectTrigger><SelectValue placeholder="Sélectionner un service" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={_}>Non assigné</SelectItem>
                                                {services.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.nom}{s.departement ? ` (${s.departement.nom})` : ''}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="date_envoi">Date d'envoi</Label>
                                        <Input id="date_envoi" type="date" value={form.data.date_envoi} onChange={(e) => form.setData('date_envoi', e.target.value)} />
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
                            <DialogTitle className="flex items-center gap-2 text-green-600"><FileText className="h-5 w-5" />Courrier sortant enregistré</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="rounded-lg bg-muted p-4 text-sm"><p className="text-muted-foreground">Numéro :</p><p className="font-mono text-lg font-bold">{numero}</p></div>
                            <div className="text-sm">
                                <p className="text-muted-foreground">Objet : <span className="font-medium text-foreground">{form.data.objet}</span></p>
                                <p className="text-muted-foreground mt-1">Vers : <span className="font-medium">{form.data.destinataire_nom}</span></p>
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