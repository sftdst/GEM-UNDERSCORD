<?php

namespace App\Listeners;

use App\Events\DocumentShared;
use App\Models\NotificationCustom;

class SendShareNotification
{
    public function handle(DocumentShared $event): void
    {
        NotificationCustom::create([
            'utilisateur_id' => $event->sharedWith->id,
            'acteur_id'      => $event->sharedBy->id,
            'type'           => 'document_partage',
            'titre'          => 'Document partagé avec vous',
            'message'        => "{$event->sharedBy->nom_complet} a partagé le document \"{$event->document->titre}\" avec vous.",
            'lien'           => "/documents/{$event->document->id}",
            'document_id'    => $event->document->id,
        ]);
    }
}
