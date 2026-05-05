<?php

namespace App\Http\Controllers;

use App\Models\MessageInterne;
use App\Models\Utilisateur;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MessagerieController extends Controller
{
    /**
     * Liste des conversations (dernier message par interlocuteur unique).
     */
    public function index()
    {
        $user = auth()->user();

        // Get all unique interlocutors with the last message and unread count
        $conversations = MessageInterne::where(function ($q) use ($user) {
                $q->where('expediteur_id', $user->id)
                  ->orWhere('destinataire_id', $user->id);
            })
            ->with(['expediteur:id,nom,prenom,avatar_url', 'destinataire:id,nom,prenom,avatar_url'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy(function ($msg) use ($user) {
                // Group by the interlocutor ID
                return $msg->expediteur_id === $user->id
                    ? $msg->destinataire_id
                    : $msg->expediteur_id;
            })
            ->map(function ($msgs, $interlocuteurId) use ($user) {
                $dernierMessage = $msgs->first();
                $nonLus = $msgs->where('destinataire_id', $user->id)->where('lu', false)->count();
                $interlocuteur = $dernierMessage->expediteur_id === $user->id
                    ? $dernierMessage->destinataire
                    : $dernierMessage->expediteur;

                return [
                    'interlocuteur' => $interlocuteur,
                    'dernier_message' => [
                        'contenu' => $dernierMessage->contenu,
                        'created_at' => $dernierMessage->created_at,
                        'est_expediteur' => $dernierMessage->expediteur_id === $user->id,
                    ],
                    'non_lus' => $nonLus,
                ];
            })
            ->values();

        $orgId = $user->organisation_id;
        $utilisateurs = Utilisateur::where('organisation_id', $orgId)
            ->where('statut', 'actif')
            ->where('id', '!=', $user->id)
            ->select('id', 'nom', 'prenom', 'avatar_url')
            ->orderBy('nom')
            ->get();

        return Inertia::render('messagerie/index', [
            'conversations' => $conversations,
            'utilisateurs' => $utilisateurs,
            'interlocuteurActifId' => null,
            'messages' => [],
            'documents' => Document::where('organisation_id', $orgId)
                ->select('id', 'titre', 'extension')
                ->orderBy('titre')
                ->limit(50)
                ->get(),
        ]);
    }

    /**
     * Affiche les messages échangés avec un interlocuteur spécifique.
     */
    public function show(Utilisateur $utilisateur)
    {
        $user = auth()->user();

        // Mark messages from this user as read
        MessageInterne::where('expediteur_id', $utilisateur->id)
            ->where('destinataire_id', $user->id)
            ->where('lu', false)
            ->update(['lu' => true, 'lu_le' => now()]);

        $messages = MessageInterne::where(function ($q) use ($user, $utilisateur) {
                $q->where('expediteur_id', $user->id)->where('destinataire_id', $utilisateur->id);
            })
            ->orWhere(function ($q) use ($user, $utilisateur) {
                $q->where('expediteur_id', $utilisateur->id)->where('destinataire_id', $user->id);
            })
            ->with(['expediteur:id,nom,prenom,avatar_url', 'document:id,titre,extension'])
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(fn ($m) => [
                'id' => $m->id,
                'contenu' => $m->contenu,
                'est_expediteur' => $m->expediteur_id === $user->id,
                'expediteur' => $m->expediteur,
                'document' => $m->document,
                'lu' => $m->lu,
                'created_at' => $m->created_at,
            ]);

        $orgId = $user->organisation_id;

        // Conversations list (same as index)
        $conversations = MessageInterne::where(function ($q) use ($user) {
                $q->where('expediteur_id', $user->id)
                  ->orWhere('destinataire_id', $user->id);
            })
            ->with(['expediteur:id,nom,prenom,avatar_url', 'destinataire:id,nom,prenom,avatar_url'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy(function ($msg) use ($user) {
                return $msg->expediteur_id === $user->id
                    ? $msg->destinataire_id
                    : $msg->expediteur_id;
            })
            ->map(function ($msgs, $interlocuteurId) use ($user) {
                $dernierMessage = $msgs->first();
                $nonLus = $msgs->where('destinataire_id', $user->id)->where('lu', false)->count();
                $interlocuteur = $dernierMessage->expediteur_id === $user->id
                    ? $dernierMessage->destinataire
                    : $dernierMessage->expediteur;

                return [
                    'interlocuteur' => $interlocuteur,
                    'dernier_message' => [
                        'contenu' => $dernierMessage->contenu,
                        'created_at' => $dernierMessage->created_at,
                        'est_expediteur' => $dernierMessage->expediteur_id === $user->id,
                    ],
                    'non_lus' => $nonLus,
                ];
            })
            ->values();

        $utilisateurs = Utilisateur::where('organisation_id', $orgId)
            ->where('statut', 'actif')
            ->where('id', '!=', $user->id)
            ->select('id', 'nom', 'prenom', 'avatar_url')
            ->orderBy('nom')
            ->get();

        return Inertia::render('messagerie/index', [
            'conversations' => $conversations,
            'utilisateurs' => $utilisateurs,
            'interlocuteurActifId' => $utilisateur->id,
            'messages' => $messages,
            'documents' => Document::where('organisation_id', $orgId)
                ->select('id', 'titre', 'extension')
                ->orderBy('titre')
                ->limit(50)
                ->get(),
        ]);
    }

    /**
     * Envoyer un message.
     */
    public function store(Request $request)
    {
        $user = auth()->user();

        $validated = $request->validate([
            'destinataire_id' => 'required|exists:utilisateurs,id',
            'contenu' => 'required|string|max:5000',
            'document_id' => 'nullable|exists:documents,id',
        ]);

        // Ensure destinataire is in the same organisation
        $destinataire = Utilisateur::where('id', $validated['destinataire_id'])
            ->where('organisation_id', $user->organisation_id)
            ->firstOrFail();

        MessageInterne::create([
            'expediteur_id' => $user->id,
            'destinataire_id' => $destinataire->id,
            'contenu' => $validated['contenu'],
            'document_id' => $validated['document_id'] ?? null,
        ]);

        return redirect()->route('messagerie.show', $destinataire->id);
    }

    /**
     * Count unread messages (JSON endpoint for badge).
     */
    public function unread()
    {
        $count = MessageInterne::where('destinataire_id', auth()->id())
            ->where('lu', false)
            ->count();

        return response()->json(['count' => $count]);
    }

    /**
     * Mark all messages from a specific user as read.
     */
    public function markRead(Utilisateur $utilisateur)
    {
        MessageInterne::where('expediteur_id', $utilisateur->id)
            ->where('destinataire_id', auth()->id())
            ->where('lu', false)
            ->update(['lu' => true, 'lu_le' => now()]);

        return redirect()->back();
    }
}
