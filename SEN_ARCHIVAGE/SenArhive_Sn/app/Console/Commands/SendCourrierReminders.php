<?php

namespace App\Console\Commands;

use App\Models\Courrier;
use App\Models\CourrierAlerte;
use App\Models\CourrierNotification;
use App\Models\Utilisateur;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;

class SendCourrierReminders extends Command
{
    protected $signature = 'courriers:reminders {--dry-run : Run without sending emails}';
    protected $description = 'Send automatic reminders for courrier deadlines';

    public function handle(): int
    {
        $now = now();
        $dryRun = $this->option('dry-run');

        // Reminders J-2
        $courriersJ2 = Courrier::where('statut', '!=', Courrier::STATUT_CLOTURE)
            ->where('date_echeance', now()->addDays(2)->toDateString())
            ->where('agent_affecte_id', '!=', null)
            ->with(['agent', 'service'])
            ->get();

        // Reminders J (due today)
        $courriersJ = Courrier::where('statut', '!=', Courrier::STATUT_CLOTURE)
            ->where('date_echeance', now()->toDateString())
            ->where('agent_affecte_id', '!=', null)
            ->with(['agent', 'service'])
            ->get();

        // Escalation for overdue (more than 2 days)
        $courriersEscalade = Courrier::where('statut', '!=', Courrier::STATUT_CLOTURE)
            ->where('date_echeance', '<', now()->subDays(2))
            ->where('agent_affecte_id', '!=', null)
            ->with(['agent.service', 'service'])
            ->get();

        $count = 0;

        // Process J-2 reminders
        foreach ($courriersJ2 as $courrier) {
            $this->sendReminder($courrier, 'rappel_j2', $dryRun);
            $count++;
        }

        // Process J reminders
        foreach ($courriersJ as $courrier) {
            $this->sendReminder($courrier, 'rappel_j', $dryRun);
            $count++;
        }

        // Process escalations
        foreach ($courriersEscalade as $courrier) {
            $this->sendEscalade($courrier, $dryRun);
            $count++;
        }

        $this->info("Processed {$count} reminders/escalations");
        return self::SUCCESS;
    }

    private function sendReminder(Courrier $courrier, string $type, bool $dryRun): void
    {
        $agent = $courrier->agent;
        if (!$agent || !$agent->email) {
            return;
        }

        // Create notification
        CourrierNotification::create([
            'user_id' => $agent->id,
            'courrier_id' => $courrier->id,
            'type' => $type,
            'titre' => $type === 'rappel_j2' ? 'Rappel: délais dans 2 jours' : 'Rappel: échéance aujourd\'hui',
            'message' => "Le courrier {$courrier->numero} ({$courrier->objet}) arrive à échéance.",
            'lien' => "/courriers/{$courrier->id}",
        ]);

        // Create alert record
        CourrierAlerte::create([
            'courrier_id' => $courrier->id,
            'user_id' => $agent->id,
            'type' => $type,
            'date_alerte' => now(),
            'envoyee' => true,
        ]);

        if (!$dryRun && $agent->email) {
            Mail::raw(
                "Rappel: Le courrier {$courrier->numero} arrive à échéance le {$courrier->date_echeance->format('d/m/Y')}.",
                function ($message) use ($agent, $courrier) {
                    $message->to($agent->email)
                        ->subject("[GEC] Rappel courrier {$courrier->numero}");
                }
            );
        }
    }

    private function sendEscalade(Courrier $courrier, bool $dryRun): void
    {
        $agent = $courrier->agent;
        if (!$agent || !$agent->email) {
            return;
        }

        // Get superior (manager) - find someone in same service with higher role
        $superieur = Utilisateur::where('service_id', $agent->service_id)
            ->where('role_id', '!=', $agent->role_id)
            ->whereHas('role', fn($q) => $q->whereIn('nom', ['Chef de service', 'Directeur', 'Administrateur']))
            ->first();

        $destinataire = $superieur ?? $agent;

        // Create notification for escalation
        CourrierNotification::create([
            'user_id' => $destinataire->id,
            'courrier_id' => $courrier->id,
            'type' => 'escalade',
            'titre' => 'Courrier en retard - Escalade',
            'message' => "Le courrier {$courrier->numero} est en retard. Action requise.",
            'lien' => "/courriers/{$courrier->id}",
        ]);

        CourrierAlerte::create([
            'courrier_id' => $courrier->id,
            'user_id' => $destinataire->id,
            'type' => 'escalade',
            'date_alerte' => now(),
            'envoyee' => true,
        ]);

        if (!$dryRun && $destinataire->email) {
            Mail::raw(
                "Escalade: Le courrier {$courrier->numero} est en retard. Responsable: {$agent->prenom} {$agent->nom}.",
                function ($message) use ($destinataire, $courrier) {
                    $message->to($destinataire->email)
                        ->subject("[GEC] Escalade courrier en retard");
                }
            );
        }
    }
}