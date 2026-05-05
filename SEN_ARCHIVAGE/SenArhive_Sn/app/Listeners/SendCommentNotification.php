<?php

namespace App\Listeners;

use App\Events\CommentAdded;
use App\Models\NotificationCustom;

class SendCommentNotification
{
    public function handle(CommentAdded $event): void
    {
        $commentaire = $event->commentaire;
        $document = $commentaire->document;
        $auteur = $commentaire->utilisateur;

        if ($document->created_by && $document->created_by !== $auteur->id) {
            NotificationCustom::create([
                'utilisateur_id' => $document->created_by,
                'acteur_id'      => $auteur->id,
                'type'           => 'commentaire_ajoute',
                'titre'          => 'Nouveau commentaire',
                'message'        => "{$auteur->nom_complet} a commenté le document \"{$document->titre}\".",
                'lien'           => "/documents/{$document->id}",
                'document_id'    => $document->id,
            ]);
        }
    }
}
