<?php

namespace App\Http\Middleware;

use App\Services\PermissionService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckDocumentPermission
{
    public function __construct(protected PermissionService $permissionService) {}

    public function handle(Request $request, Closure $next, string $permission = 'peut_lire'): Response
    {
        $document = $request->route('document');
        $dossier = $request->route('dossier');
        $espace = $request->route('espace');

        $user = $request->user();
        if (!$user) {
            abort(403, 'Non authentifié');
        }

        $perms = null;

        if ($document) {
            $perms = $this->permissionService->getPermissionsEffectives($user, $document);
        } elseif ($dossier) {
            $perms = $this->permissionService->getPermissionsEffectives($user, null, $dossier);
        } elseif ($espace) {
            $perms = $this->permissionService->getPermissionsEffectives($user, null, null, $espace);
        }

        if ($perms && !($perms[$permission] ?? false)) {
            abort(403, 'Vous n\'avez pas la permission requise.');
        }

        return $next($request);
    }
}
