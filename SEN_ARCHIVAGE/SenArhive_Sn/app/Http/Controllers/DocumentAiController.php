<?php

namespace App\Http\Controllers;

use Anthropic\Client;
use App\Models\Document;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DocumentAiController extends Controller
{
    public function ask(Request $request, Document $document): JsonResponse
    {
        $request->validate([
            'question' => 'required|string|max:2000',
            'history'  => 'array|max:20',
            'history.*.role'    => 'required|in:user,assistant',
            'history.*.content' => 'required|string|max:4000',
        ]);

        $apiKey = config('services.anthropic.key');
        if (! $apiKey) {
            return response()->json(['error' => 'Service IA non configuré.'], 503);
        }

        // Charger les relations utiles pour le contexte
        $document->loadMissing(['categorie', 'tags', 'dossier', 'createur']);

        // ── Construction du contexte documentaire ────────────────────────────
        $contexte  = "Titre : {$document->titre}\n";
        $contexte .= "Type de fichier : " . strtoupper($document->extension) . "\n";
        $contexte .= "Taille : {$document->taille_formatee}\n";

        if ($document->description) {
            $contexte .= "Description : {$document->description}\n";
        }
        if ($document->categorie) {
            $contexte .= "Catégorie : {$document->categorie->nom}\n";
        }
        if ($document->dossier) {
            $contexte .= "Dossier : {$document->dossier->nom}\n";
        }
        if ($document->tags && $document->tags->isNotEmpty()) {
            $contexte .= "Tags : " . $document->tags->pluck('nom')->join(', ') . "\n";
        }
        if ($document->date_archivage) {
            $contexte .= "Date d'archivage : " . \Carbon\Carbon::parse($document->date_archivage)->format('d/m/Y') . "\n";
        }

        $hasTexte = ! empty($document->texte_extrait);

        if ($hasTexte) {
            // Limiter à 60 000 caractères pour rester dans les limites du contexte
            $texte     = mb_substr($document->texte_extrait, 0, 60000);
            $contexte .= "\n--- CONTENU EXTRAIT DU DOCUMENT ---\n{$texte}";
        }

        // ── System prompt ────────────────────────────────────────────────────
        $systemPrompt = $hasTexte
            ? "Tu es un assistant IA expert en analyse documentaire, intégré à SEN_ARCHIV, une plateforme sénégalaise de gestion d'archives.\n\n"
              . "L'utilisateur te pose des questions sur le document suivant. Réponds de façon précise en te basant UNIQUEMENT sur le contenu du document fourni. "
              . "Si la réponse ne figure pas dans le document, indique-le clairement plutôt que d'inventer. "
              . "Sois concis, professionnel et utilise la même langue que l'utilisateur.\n\n"
              . "DOCUMENT :\n{$contexte}"
            : "Tu es un assistant IA intégré à SEN_ARCHIV. Le document suivant n'a pas encore de texte extrait (OCR non effectué). "
              . "Tu ne peux donc répondre qu'en te basant sur les métadonnées disponibles. "
              . "Encourage l'utilisateur à lancer l'OCR pour obtenir de meilleures réponses.\n\n"
              . "MÉTADONNÉES DU DOCUMENT :\n{$contexte}";

        // ── Construction des messages avec historique ─────────────────────────
        $messages = array_merge(
            $request->input('history', []),
            [['role' => 'user', 'content' => $request->input('question')]]
        );

        // ── Appel à l'API Claude ──────────────────────────────────────────────
        try {
            $client   = new Client(apiKey: $apiKey);
            $response = $client->messages->create([
                'model'      => 'claude-sonnet-4-6',
                'max_tokens' => 1500,
                'system'     => $systemPrompt,
                'messages'   => $messages,
            ]);

            return response()->json([
                'reponse' => $response->content[0]->text,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Erreur lors de la communication avec l\'IA : ' . $e->getMessage(),
            ], 500);
        }
    }
}
