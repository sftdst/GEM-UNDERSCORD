<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\LienPartage;
use App\Services\DocumentStorageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ShareLinkController extends Controller
{
    public function index()
    {
        $liens = LienPartage::where('organisation_id', auth()->user()->organisation_id)
            ->with(['document', 'createur'])
            ->latest('created_at')
            ->get()
            ->map(function ($lien) {
                $lien->url = url("/s/{$lien->token}");
                $lien->est_expire = $lien->expire_le && $lien->expire_le->isPast();
                $lien->est_epuise = $lien->max_telechargements && $lien->nb_telechargements >= $lien->max_telechargements;
                return $lien;
            });

        return Inertia::render('partage/index', [
            'liens' => $liens,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'document_id' => 'required|exists:documents,id',
            'peut_telecharger' => 'nullable|boolean',
            'type_acces' => 'nullable|in:public,restreint',
            'utilisateur_ids' => 'nullable|array',
            'utilisateur_ids.*' => 'exists:utilisateurs,id',
            'expire_le' => 'nullable|date|after:now',
            'max_telechargements' => 'nullable|integer|min:1',
            'mot_de_passe' => 'nullable|string|min:4',
        ]);

        $token = Str::random(64);

        $lien = LienPartage::create([
            'organisation_id' => auth()->user()->organisation_id,
            'document_id' => $validated['document_id'],
            'token' => $token,
            'peut_telecharger' => $validated['peut_telecharger'] ?? true,
            'type_acces' => $validated['type_acces'] ?? 'public',
            'expire_le' => $validated['expire_le'] ?? null,
            'max_telechargements' => $validated['max_telechargements'] ?? null,
            'mot_de_passe' => !empty($validated['mot_de_passe']) ? Hash::make($validated['mot_de_passe']) : null,
            'nb_telechargements' => 0,
            'created_by' => auth()->id(),
        ]);

        if (($validated['type_acces'] ?? 'public') === 'restreint' && !empty($validated['utilisateur_ids'])) {
            $lien->utilisateursAutorises()->sync($validated['utilisateur_ids']);
        }

        $url = url("/s/{$token}");

        return redirect()->back()->with('success', "Lien de partage cree : {$url}");
    }

    public function showPublic(string $token)
    {
        $lien = LienPartage::where('token', $token)->firstOrFail();

        if ($lien->expire_le && $lien->expire_le->isPast()) {
            abort(410, 'Ce lien de partage a expire.');
        }

        if ($lien->max_telechargements && $lien->nb_telechargements >= $lien->max_telechargements) {
            abort(410, 'Ce lien de partage a atteint le nombre maximum de telechargements.');
        }

        // Enforce restricted access
        if ($lien->type_acces === 'restreint') {
            if (!auth()->check()) {
                return redirect()->route('login')->with('message', 'Vous devez vous connecter pour acceder a ce document.');
            }
            $isAuthorized = $lien->utilisateursAutorises()->where('utilisateur_id', auth()->id())->exists();
            if (!$isAuthorized) {
                abort(403, 'Vous n\'etes pas autorise a acceder a ce document.');
            }
        }

        $lien->load('document');

        $hasPassword = !is_null($lien->mot_de_passe);
        $verified = !$hasPassword || session("share_verified_{$token}");

        return Inertia::render('share/public', [
            'token' => $token,
            'lien' => $verified ? $lien : (object) [
                'id' => $lien->id,
                'expire_le' => $lien->expire_le,
            ],
            'has_password' => $hasPassword,
            'verified' => (bool) $verified,
        ]);
    }

    public function verifyPassword(Request $request, string $token)
    {
        $lien = LienPartage::where('token', $token)->firstOrFail();

        if (!$lien->mot_de_passe || !Hash::check($request->input('mot_de_passe'), $lien->mot_de_passe)) {
            return redirect()->back()->withErrors(['mot_de_passe' => 'Mot de passe incorrect.']);
        }

        session(["share_verified_{$token}" => true]);

        return redirect()->back();
    }

    public function downloadPublic(string $token)
    {
        $lien = LienPartage::where('token', $token)->firstOrFail();

        if ($lien->expire_le && $lien->expire_le->isPast()) {
            abort(410, 'Ce lien de partage a expire.');
        }

        if ($lien->max_telechargements && $lien->nb_telechargements >= $lien->max_telechargements) {
            abort(410, 'Nombre maximum de telechargements atteint.');
        }

        if ($lien->mot_de_passe && !session("share_verified_{$token}")) {
            abort(403, 'Acces non autorise.');
        }

        if ($lien->type_acces === 'restreint') {
            if (!auth()->check()) {
                abort(403, 'Vous devez etre connecte pour telecharger ce document.');
            }
            $isAuthorized = $lien->utilisateursAutorises()->where('utilisateur_id', auth()->id())->exists();
            if (!$isAuthorized) {
                abort(403, 'Vous n\'etes pas autorise a telecharger ce document.');
            }
        }

        $lien->increment('nb_telechargements');

        $document = $lien->document;
        $storageService = app(DocumentStorageService::class);

        return $storageService->download($document);
    }

    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'document_ids' => 'required|array|min:1',
            'document_ids.*' => 'exists:documents,id',
            'peut_telecharger' => 'nullable|boolean',
            'type_acces' => 'nullable|in:public,restreint',
            'utilisateur_ids' => 'nullable|array',
            'utilisateur_ids.*' => 'exists:utilisateurs,id',
            'expire_le' => 'nullable|date|after:now',
            'max_telechargements' => 'nullable|integer|min:1',
            'mot_de_passe' => 'nullable|string|min:4',
        ]);

        $typeAcces = $validated['type_acces'] ?? 'public';
        $utilisateurIds = ($typeAcces === 'restreint' && !empty($validated['utilisateur_ids']))
            ? $validated['utilisateur_ids']
            : [];

        $count = 0;
        foreach ($validated['document_ids'] as $documentId) {
            $token = Str::random(64);
            $lien = LienPartage::create([
                'organisation_id' => auth()->user()->organisation_id,
                'document_id' => $documentId,
                'token' => $token,
                'peut_telecharger' => $validated['peut_telecharger'] ?? true,
                'type_acces' => $typeAcces,
                'expire_le' => $validated['expire_le'] ?? null,
                'max_telechargements' => !empty($validated['max_telechargements']) ? $validated['max_telechargements'] : null,
                'mot_de_passe' => !empty($validated['mot_de_passe']) ? Hash::make($validated['mot_de_passe']) : null,
                'nb_telechargements' => 0,
                'created_by' => auth()->id(),
            ]);
            if ($utilisateurIds) {
                $lien->utilisateursAutorises()->sync($utilisateurIds);
            }
            $count++;
        }

        return redirect()->back()->with('success', "{$count} lien(s) de partage cree(s) avec succes.");
    }

    public function destroy(LienPartage $lienPartage)
    {
        $lienPartage->delete();

        return redirect()->back()->with('success', 'Lien de partage supprime.');
    }
}
