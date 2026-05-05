<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Abonnement;
use App\Models\DemandeChangementPlan;
use App\Models\Facture;
use App\Models\Organisation;
use App\Models\Paiement;
use App\Models\Plan;
use App\Scopes\OrganisationScope;
use App\Services\PayDunyaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class PaiementController extends Controller
{
    public function __construct(
        protected PayDunyaService $payDunyaService,
    ) {}

    /**
     * Initier une transaction de paiement.
     *
        * Ce endpoint crée une facture PayDunya et retourne l'URL de checkout
        * pour finaliser le paiement côté prestataire.
     *
     * Flux prévu après intégration :
     *   1. Appel POST ici avec plan_id, periodicite, methode, telephone/carte
     *   2. Appel à l'API du prestataire → retour d'une URL de redirection ou d'un token
     *   3. Utilisateur validé côté prestataire
     *   4. Webhook reçu sur /webhooks/paiement/{provider} → mise à jour du statut
     *   5. Activation automatique du plan
     */
    public function initier(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'plan_id'    => 'required|exists:plans,id',
            'periodicite' => 'required|in:mensuel,annuel',
            'methode'    => 'required|in:wave,orange_money,carte',
            'telephone'  => 'nullable|string|max:20',
        ]);

        $orgId = (string) $request->user()->organisation_id;

        $demandeExistante = DemandeChangementPlan::query()
            ->where('organisation_id', $orgId)
            ->where('statut', 'en_attente')
            ->exists();

        if ($demandeExistante) {
            return response()->json([
                'success' => false,
                'message' => 'Vous avez déjà une demande de changement de plan en attente.',
            ], 422);
        }

        $plan   = Plan::findOrFail($validated['plan_id']);
        $montant = $validated['periodicite'] === 'mensuel'
            ? $plan->prix_mensuel
            : $plan->prix_annuel;

        $abonnementActuel = Abonnement::query()
            ->where('organisation_id', $orgId)
            ->latest()
            ->first();

        if (! $abonnementActuel) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun abonnement existant trouvé pour votre organisation. Contactez le support.',
            ], 422);
        }

        $demande = DemandeChangementPlan::create([
            'organisation_id' => $orgId,
            'plan_actuel_id' => $abonnementActuel->plan_id,
            'plan_demande_id' => $plan->id,
            'periodicite_demandee' => $validated['periodicite'],
            'message' => 'Paiement initié via PayDunya (' . $validated['methode'] . ').',
            'statut' => 'en_attente',
        ]);

        $facture = Facture::create([
            'organisation_id' => $orgId,
            'abonnement_id' => $abonnementActuel->id,
            'numero' => 'FAC-PENDING-' . strtoupper(uniqid()),
            'montant_ht' => $montant,
            'taux_tva' => 18.00,
            'montant_tva' => round($montant * 0.18, 2),
            'montant_ttc' => round($montant * 1.18, 2),
            'devise' => 'XOF',
            'statut' => 'en_attente',
            'periode_debut' => now()->toDateString(),
            'periode_fin' => $validated['periodicite'] === 'annuel'
                ? now()->addYear()->toDateString()
                : now()->addMonth()->toDateString(),
        ]);

        $paiement = Paiement::create([
            'facture_id' => $facture->id,
            'organisation_id' => $orgId,
            'montant' => $facture->montant_ttc,
            'devise' => 'XOF',
            'methode' => $validated['methode'],
            'statut' => 'en_attente',
            'metadata' => [
                'provider' => 'paydunya',
                'plan_id' => $plan->id,
                'periodicite' => $validated['periodicite'],
                'demande_id' => $demande->id,
                'telephone' => $validated['telephone'] ?? null,
            ],
        ]);

        $checkoutPayload = [
            'invoice' => [
                'items' => [[
                    'name' => 'Abonnement ' . $plan->nom,
                    'quantity' => 1,
                    'unit_price' => (float) $facture->montant_ttc,
                    'total_price' => (float) $facture->montant_ttc,
                    'description' => 'Abonnement ' . $validated['periodicite'] . ' - ' . $plan->nom,
                ]],
                'total_amount' => (float) $facture->montant_ttc,
                'description' => 'Paiement abonnement SenArchive',
            ],
            'store' => [
                'name' => config('app.name'),
            ],
            'actions' => [
                'callback_url' => route('paiement.webhook', ['provider' => 'paydunya']),
                'return_url' => route('admin.abonnement.index'),
                'cancel_url' => route('admin.abonnement.index'),
            ],
            'custom_data' => [
                'paiement_id' => $paiement->id,
                'demande_id' => $demande->id,
                'facture_id' => $facture->id,
                'organisation_id' => $orgId,
            ],
        ];

        try {
            $checkout = $this->payDunyaService->createCheckoutInvoice($checkoutPayload);
            $token = (string) Arr::get($checkout, 'token', '');

            $paiement->update([
                'reference_externe' => $token ?: null,
                'metadata' => array_merge($paiement->metadata ?? [], [
                    'paydunya_token' => $token,
                    'checkout_url' => Arr::get($checkout, 'response_url'),
                ]),
            ]);

            return response()->json([
                'success' => true,
                'provider' => 'paydunya',
                'reference' => $paiement->id,
                'token' => $token,
                'checkout_url' => Arr::get($checkout, 'response_url'),
                'statut' => 'en_attente',
                'montant' => $facture->montant_ttc,
                'devise' => 'XOF',
                'message' => 'Paiement PayDunya initié. Redirection vers la page sécurisée.',
            ]);
        } catch (RuntimeException $exception) {
            $paiement->update([
                'statut' => 'echoue',
                'metadata' => array_merge($paiement->metadata ?? [], [
                    'erreur' => $exception->getMessage(),
                ]),
            ]);

            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
            ], 502);
        }
    }

    /**
     * Webhook reçu depuis un prestataire de paiement.
     *
     * Ce endpoint doit être enregistré SANS middleware d'authentification
     * (voir routes/web.php) car il est appelé par le serveur du prestataire.
     *
    * Ce endpoint confirme l'état de la transaction via l'API PayDunya,
    * met à jour Paiement / Facture et applique automatiquement
    * le changement de plan si le paiement est confirmé.
     *
    * @param  string  $provider  paydunya
     */
    public function webhook(Request $request, string $provider): JsonResponse
    {
        if ($provider !== 'paydunya') {
            return response()->json(['status' => 'ignored', 'provider' => $provider]);
        }

        $payload = $request->all();
        $token = $this->extractToken($payload);

        if (! $token) {
            return response()->json(['status' => 'invalid_payload'], 422);
        }

        $paiement = Paiement::query()->where('reference_externe', $token)->first();

        if (! $paiement) {
            return response()->json(['status' => 'payment_not_found'], 404);
        }

        try {
            $confirmation = $this->payDunyaService->confirmInvoice($token);
        } catch (RuntimeException $exception) {
            return response()->json([
                'status' => 'confirmation_failed',
                'message' => $exception->getMessage(),
            ], 502);
        }

        $invoiceStatus = strtolower((string) (
            Arr::get($confirmation, 'invoice.status')
            ?? Arr::get($confirmation, 'status')
            ?? Arr::get($payload, 'status', '')
        ));
        $success = in_array($invoiceStatus, ['completed', 'paid', 'success', 'successful'], true);

        DB::transaction(function () use ($paiement, $payload, $confirmation, $success, $invoiceStatus) {
            $paiement->update([
                'statut' => $success ? 'reussi' : 'echoue',
                'metadata' => array_merge($paiement->metadata ?? [], [
                    'webhook_payload' => $payload,
                    'confirmation' => $confirmation,
                    'invoice_status' => $invoiceStatus,
                ]),
            ]);

            $facture = $paiement->facture;

            if ($success && $facture && $facture->statut !== 'payee') {
                $facture->update([
                    'statut' => 'payee',
                    'paye_le' => now(),
                ]);
            }

            if ($success) {
                $this->appliquerChangementPlan($paiement, $facture);
            }
        });

        return response()->json([
            'status' => 'processed',
            'provider' => 'paydunya',
            'invoice_status' => $invoiceStatus,
        ]);
    }

    private function extractToken(array $payload): ?string
    {
        $token = Arr::get($payload, 'token')
            ?? Arr::get($payload, 'invoice.token')
            ?? Arr::get($payload, 'data.token')
            ?? Arr::get($payload, 'data.invoice.token');

        if (! is_string($token) || trim($token) === '') {
            return null;
        }

        return trim($token);
    }

    private function appliquerChangementPlan(Paiement $paiement, ?Facture $facture): void
    {
        $demandeId = Arr::get($paiement->metadata ?? [], 'demande_id');

        if (! is_string($demandeId) || $demandeId === '') {
            return;
        }

        $demande = DemandeChangementPlan::query()->find($demandeId);

        if (! $demande || ! $demande->estEnAttente()) {
            return;
        }

        $plan = $demande->planDemande;

        if (! $plan) {
            return;
        }

        $dateFin = $demande->periodicite_demandee === 'annuel'
            ? now()->addYear()
            : now()->addMonth();

        Abonnement::withoutGlobalScope(OrganisationScope::class)
            ->where('organisation_id', $demande->organisation_id)
            ->where('statut', 'actif')
            ->update([
                'statut' => 'termine',
                'date_fin' => now(),
            ]);

        $abonnement = Abonnement::create([
            'organisation_id' => $demande->organisation_id,
            'plan_id' => $plan->id,
            'statut' => 'actif',
            'periodicite' => $demande->periodicite_demandee,
            'date_debut' => now(),
            'date_fin' => $dateFin,
            'date_renouvellement' => $dateFin,
            'prix_applique' => (float) $plan->{'prix_' . $demande->periodicite_demandee},
            'devise' => 'XOF',
        ]);

        if ($facture) {
            $facture->update([
                'abonnement_id' => $abonnement->id,
                'periode_debut' => now()->toDateString(),
                'periode_fin' => $dateFin->toDateString(),
            ]);
        }

        Organisation::query()
            ->where('id', $demande->organisation_id)
            ->update(['plan_id' => $plan->id]);

        $demande->update([
            'statut' => 'approuvee',
            'traite_le' => now(),
        ]);
    }
}
