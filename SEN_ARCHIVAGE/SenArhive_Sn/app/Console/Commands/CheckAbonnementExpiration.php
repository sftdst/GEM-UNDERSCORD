<?php

namespace App\Console\Commands;

use App\Models\Abonnement;
use App\Models\NotificationCustom;
use App\Models\Organisation;
use App\Models\Utilisateur;
use App\Scopes\OrganisationScope;
use Illuminate\Console\Command;

class CheckAbonnementExpiration extends Command
{
    protected $signature   = 'abonnement:check-expiration';
    protected $description = 'Vérifie les expirations d\'abonnements, notifie les admins (J-5) et désactive les organisations expirées (+30 j)';

    public function handle(): void
    {
        $this->notifierExpirationProche();
        $this->desactiverOrganisationsExpirees();

        $this->info('Vérification des abonnements terminée.');
    }

    /**
     * Règle 1 — Envoie une notification quotidienne aux admins
     * pour chaque abonnement expirant dans ≤ 5 jours.
     */
    private function notifierExpirationProche(): void
    {
        $abonnements = Abonnement::withoutGlobalScope(OrganisationScope::class)
            ->where('statut', 'actif')
            ->whereBetween('date_fin', [now(), now()->addDays(5)])
            ->with('organisation', 'plan')
            ->get();

        $count = 0;

        foreach ($abonnements as $abonnement) {
            $joursRestants = (int) now()->diffInDays($abonnement->date_fin, false);
            $admins        = $this->getAdmins($abonnement->organisation_id);

            foreach ($admins as $admin) {
                // Ne pas envoyer si une notification de ce type a déjà été créée aujourd'hui
                $dejaEnvoye = NotificationCustom::where('utilisateur_id', $admin->id)
                    ->where('type', 'expiration_abonnement')
                    ->whereDate('created_at', today())
                    ->exists();

                if ($dejaEnvoye) {
                    continue;
                }

                NotificationCustom::create([
                    'utilisateur_id' => $admin->id,
                    'type'           => 'expiration_abonnement',
                    'titre'          => "Abonnement expirant dans {$joursRestants} jour(s)",
                    'message'        => "Votre abonnement \"{$abonnement->plan->nom}\" expire le "
                                       . $abonnement->date_fin->format('d/m/Y')
                                       . '. Renouvelez-le pour maintenir l\'accès à la plateforme.',
                    'lien'           => '/admin/abonnement',
                    'lu'             => false,
                ]);

                $count++;
            }
        }

        $this->info("Notifications J-5 envoyées : {$count}.");
    }

    /**
     * Règle 2 — Désactive automatiquement les organisations dont
     * l'abonnement actif est expiré depuis plus de 30 jours.
     */
    private function desactiverOrganisationsExpirees(): void
    {
        // Organisations actives dont TOUS les abonnements actifs sont expirés depuis > 30 jours
        // et qui n'ont aucun abonnement actif encore valide
        $organisations = Organisation::where('statut', 'actif')
            ->whereHas('abonnements', function ($q) {
                $q->withoutGlobalScope(OrganisationScope::class)
                  ->where('statut', 'actif')
                  ->where('date_fin', '<', now()->subDays(30));
            })
            ->whereDoesntHave('abonnements', function ($q) {
                $q->withoutGlobalScope(OrganisationScope::class)
                  ->where('statut', 'actif')
                  ->where('date_fin', '>=', now()->subDays(30));
            })
            ->get();

        foreach ($organisations as $organisation) {
            $organisation->update(['statut' => 'inactif']);
            $this->warn("Organisation désactivée automatiquement : {$organisation->nom}");
        }

        $this->info("Organisations désactivées automatiquement : {$organisations->count()}.");
    }

    /**
     * Retourne les utilisateurs administrateurs actifs d'une organisation.
     */
    private function getAdmins(string $organisationId): \Illuminate\Database\Eloquent\Collection
    {
        return Utilisateur::where('organisation_id', $organisationId)
            ->where('statut', 'actif')
            ->whereHas('role', fn ($q) => $q->where('nom', 'Administrator'))
            ->get();
    }
}
