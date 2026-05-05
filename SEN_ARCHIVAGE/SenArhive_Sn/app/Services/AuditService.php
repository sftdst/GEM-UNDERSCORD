<?php

namespace App\Services;

use App\Models\JournalActivite;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditService
{
    /**
     * Log an activity. Accepts either a Model or explicit type/id strings.
     */
    public function log(string $action, Model|string|null $ressource = null, ?string $ressourceId = null, array $detail = []): void
    {
        $user = Auth::user();

        // Pas de contexte organisation (ex. : actions SuperAdmin) → journal ignoré
        if (!$user?->organisation_id) {
            return;
        }

        if ($ressource instanceof Model) {
            $ressourceType = class_basename($ressource);
            $ressourceId = (string) $ressource->getKey();
        } else {
            $ressourceType = $ressource;
        }

        JournalActivite::create([
            'organisation_id' => $user->organisation_id,
            'utilisateur_id' => $user->id,
            'action' => $action,
            'ressource_type' => $ressourceType,
            'ressource_id' => $ressourceId,
            'detail' => $detail,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
            'statut' => 'succes',
        ]);
    }
}
