<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\ConfigurationMail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class MailConfigController extends Controller
{
    /**
     * Affiche la page de configuration mail.
     */
    public function edit(Request $request): Response
    {
        $organisation = $request->user()->organisation;

        $config = ConfigurationMail::firstOrNew(
            ['organisation_id' => $organisation->id],
            [
                'mailer'       => 'smtp',
                'host'         => '',
                'port'         => 587,
                'username'     => '',
                'password'     => '',
                'encryption'   => 'tls',
                'from_address' => '',
                'from_name'    => $organisation->nom,
                'actif'        => false,
            ]
        );

        return Inertia::render('settings/mail', [
            'config' => [
                'id'           => $config->id,
                'mailer'       => $config->mailer,
                'host'         => $config->host,
                'port'         => $config->port,
                'username'     => $config->username,
                // Le mot de passe n'est jamais renvoyé tel quel
                'has_password' => !empty($config->password),
                'encryption'   => $config->encryption,
                'from_address' => $config->from_address,
                'from_name'    => $config->from_name,
                'actif'        => $config->actif,
                'exists'       => $config->exists,
            ],
            'status' => session('status'),
        ]);
    }

    /**
     * Sauvegarde la configuration mail.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'mailer'       => 'required|in:smtp,sendmail,mailgun',
            'host'         => 'required|string|max:255',
            'port'         => 'required|integer|min:1|max:65535',
            'username'     => 'nullable|string|max:255',
            'password'     => 'nullable|string|max:500',
            'encryption'   => 'nullable|in:tls,ssl',
            'from_address' => 'required|email|max:255',
            'from_name'    => 'required|string|max:255',
            'actif'        => 'boolean',
        ]);

        $organisation = $request->user()->organisation;

        $config = ConfigurationMail::firstOrNew(
            ['organisation_id' => $organisation->id]
        );

        // Ne pas écraser le mot de passe si le champ est vide (masqué)
        if (empty($validated['password'])) {
            unset($validated['password']);
        }

        $config->fill(array_merge($validated, ['organisation_id' => $organisation->id]));
        $config->save();

        return redirect()->route('settings.mail.edit')
            ->with('status', 'Configuration mail sauvegardée avec succès.');
    }

    /**
     * Envoie un email de test avec la configuration stockée.
     */
    public function test(Request $request): RedirectResponse
    {
        $request->validate([
            'test_email' => 'required|email|max:255',
        ]);

        $organisation = $request->user()->organisation;
        $config = ConfigurationMail::where('organisation_id', $organisation->id)->first();

        if (!$config || !$config->actif) {
            return redirect()->route('settings.mail.edit')
                ->with('status', 'Aucune configuration mail active trouvée.');
        }

        // Configurer le mailer dynamiquement
        config($config->toMailConfig());
        config(['mail.default' => 'org_smtp']);

        try {
            Mail::mailer('org_smtp')->raw(
                "Ceci est un email de test envoyé depuis {$organisation->nom}.\n\nLa configuration mail est correctement paramétrée.",
                function ($message) use ($request, $config) {
                    $message->to($request->test_email)
                            ->subject("Test de configuration mail - {$config->from_name}");
                }
            );

            return redirect()->route('settings.mail.edit')
                ->with('status', "Email de test envoyé à {$request->test_email} avec succès.");
        } catch (\Exception $e) {
            return redirect()->route('settings.mail.edit')
                ->with('status', "Erreur lors de l'envoi : " . $e->getMessage());
        }
    }
}
