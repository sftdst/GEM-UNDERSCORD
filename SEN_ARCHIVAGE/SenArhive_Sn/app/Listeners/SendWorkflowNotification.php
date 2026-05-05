<?php

namespace App\Listeners;

use App\Events\WorkflowApprovalRequested;
use App\Models\NotificationCustom;

class SendWorkflowNotification
{
    public function handle(WorkflowApprovalRequested $event): void
    {
        $etape = $event->etape;
        $instance = $event->instance;
        $document = $instance->document;

        if ($etape->utilisateur_id) {
            NotificationCustom::create([
                'utilisateur_id' => $etape->utilisateur_id,
                'acteur_id'      => $instance->initiateur_id ?? null,
                'type'           => 'approbation_requise',
                'titre'          => 'Approbation requise',
                'message'        => "Votre approbation est requise pour le document \"{$document->titre}\" (étape: {$etape->nom}).",
                'lien'           => "/workflows/instances/{$instance->id}",
                'document_id'    => $document->id,
            ]);
        }
    }
}
