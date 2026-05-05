<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Anthropic\Client;

class ChatbotController extends Controller
{
    public function send(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:2000',
            'history' => 'array|max:20',
            'history.*.role' => 'required|in:user,assistant',
            'history.*.content' => 'required|string|max:4000',
        ]);

        $apiKey = config('services.anthropic.key');

        if (! $apiKey) {
            return response()->json(['error' => 'Service IA non configuré.'], 503);
        }

        $client = new Client(apiKey: $apiKey);

        $messages = array_merge(
            $request->input('history', []),
            [['role' => 'user', 'content' => $request->input('message')]]
        );

        $response = $client->messages->create([
            'model' => 'claude-opus-4-6',
            'max_tokens' => 1024,
            'system' => "Tu es un assistant IA intégré à SEN_ARCHIV, une plateforme sénégalaise de gestion documentaire et d'archivage. Tu aides les utilisateurs à :\n- Gérer leurs documents (upload, classement, recherche, partage)\n- Naviguer dans les espaces et dossiers\n- Utiliser les workflows de validation\n- Comprendre les rôles et permissions\n- Gérer les organisations, départements et services\n\nSois concis, professionnel et utile. Réponds en français sauf si l'utilisateur écrit dans une autre langue.",
            'messages' => $messages,
        ]);

        return response()->json([
            'message' => $response->content[0]->text,
        ]);
    }
}
