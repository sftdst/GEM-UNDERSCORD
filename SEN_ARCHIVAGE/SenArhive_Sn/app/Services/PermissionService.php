<?php

namespace App\Services;

use App\Models\PermissionDocument;
use App\Models\Utilisateur;
use Illuminate\Database\Eloquent\Model;

class PermissionService
{
    public function peutAcceder(Utilisateur $user, string $action, Model $ressource): bool
    {
        $rolePerms = $user->role?->permissions ?? [];
        if (!empty($rolePerms['org_manage'])) {
            return true;
        }

        $actionMap = [
            'lire' => 'peut_lire',
            'ecrire' => 'peut_ecrire',
            'supprimer' => 'peut_supprimer',
            'partager' => 'peut_partager',
            'telecharger' => 'peut_telecharger',
            'commenter' => 'peut_commenter',
        ];

        $column = $actionMap[$action] ?? null;
        if (!$column) return false;

        $perms = $this->getPermissionsEffectives($user, $ressource);
        return $perms[$column] ?? false;
    }

    public function getPermissionsEffectives(Utilisateur $user, Model $ressource): array
    {
        $defaults = [
            'peut_lire' => false, 'peut_ecrire' => false, 'peut_supprimer' => false,
            'peut_partager' => false, 'peut_telecharger' => false, 'peut_commenter' => false,
        ];

        $groupeIds = $user->groupes()->pluck('groupes.id')->toArray();
        $resourceField = $this->getResourceField($ressource);
        if (!$resourceField) return $defaults;

        $permissions = PermissionDocument::where($resourceField, $ressource->id)
            ->where(function ($q) use ($user, $groupeIds) {
                $q->where('utilisateur_id', $user->id)
                  ->orWhereIn('groupe_id', $groupeIds);
            })
            ->where(function ($q) {
                $q->whereNull('expire_le')->orWhere('expire_le', '>', now());
            })
            ->get();

        foreach ($permissions as $perm) {
            foreach ($defaults as $key => $val) {
                if ($perm->$key) $defaults[$key] = true;
            }
        }

        return $defaults;
    }

    private function getResourceField(Model $ressource): ?string
    {
        return match ($ressource->getTable()) {
            'documents' => 'document_id',
            'dossiers' => 'dossier_id',
            'espaces' => 'espace_id',
            default => null,
        };
    }
}
