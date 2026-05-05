<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vos identifiants d'accès — SEN ARCHIVE</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f9; font-family: Arial, sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9; padding: 40px 0;">
    <tr>
        <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">

                {{-- Header --}}
                <tr>
                    <td style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 32px 40px; text-align:center;">
                        <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:bold; letter-spacing:1px;">
                            SEN ARCHIVE
                        </h1>
                        <p style="margin:8px 0 0; color:#bfdbfe; font-size:13px;">
                            Plateforme d'archivage numérique
                        </p>
                    </td>
                </tr>

                {{-- Body --}}
                <tr>
                    <td style="padding: 36px 40px;">

                        <p style="margin:0 0 16px; font-size:16px; color:#1e293b;">
                            Bonjour <strong>{{ $utilisateur->prenom }} {{ $utilisateur->nom }}</strong>,
                        </p>

                        @if($organisationNom)
                        <p style="margin:0 0 24px; font-size:15px; color:#475569; line-height:1.6;">
                            Votre compte administrateur pour l'organisation
                            <strong style="color:#2563eb;">{{ $organisationNom }}</strong>
                            a été créé avec succès sur la plateforme SEN ARCHIVE.
                        </p>
                        @else
                        <p style="margin:0 0 24px; font-size:15px; color:#475569; line-height:1.6;">
                            Votre compte utilisateur a été créé avec succès sur la plateforme SEN ARCHIVE.
                        </p>
                        @endif

                        {{-- Credentials box --}}
                        <table width="100%" cellpadding="0" cellspacing="0"
                               style="background-color:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; margin-bottom:24px;">
                            <tr>
                                <td style="padding: 20px 24px;">
                                    <p style="margin:0 0 16px; font-size:14px; font-weight:bold; color:#1e40af; text-transform:uppercase; letter-spacing:0.5px;">
                                        Vos identifiants de connexion
                                    </p>

                                    <table width="100%" cellpadding="6" cellspacing="0">
                                        <tr>
                                            <td style="font-size:13px; color:#64748b; width:40%;">Adresse email (login) :</td>
                                            <td>
                                                <code style="background:#dbeafe; color:#1e40af; padding:4px 10px; border-radius:4px; font-size:14px; font-weight:bold;">
                                                    {{ $utilisateur->email }}
                                                </code>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="font-size:13px; color:#64748b; padding-top:12px;">Mot de passe temporaire :</td>
                                            <td style="padding-top:12px;">
                                                <code style="background:#dbeafe; color:#1e40af; padding:4px 10px; border-radius:4px; font-size:14px; font-weight:bold; letter-spacing:1px;">
                                                    {{ $temporaryPassword }}
                                                </code>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>

                        {{-- CTA Button --}}
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                            <tr>
                                <td align="center">
                                    <a href="{{ $loginUrl }}"
                                       style="display:inline-block; background-color:#2563eb; color:#ffffff; padding:14px 36px;
                                              text-decoration:none; border-radius:6px; font-weight:bold; font-size:15px;">
                                        Se connecter à SEN ARCHIVE →
                                    </a>
                                </td>
                            </tr>
                        </table>

                        {{-- Warning --}}
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                            <tr>
                                <td style="background-color:#fffbeb; border-left:4px solid #f59e0b; border-radius:4px; padding:14px 18px;">
                                    <p style="margin:0; font-size:13px; color:#92400e; line-height:1.5;">
                                        <strong>⚠ Important :</strong> Ce mot de passe est temporaire.
                                        Veuillez le modifier dès votre première connexion depuis votre profil.
                                        Ne le partagez avec personne.
                                    </p>
                                </td>
                            </tr>
                        </table>

                        <p style="margin:0; font-size:14px; color:#64748b; line-height:1.6;">
                            Si vous avez des questions ou rencontrez un problème de connexion,
                            n'hésitez pas à contacter le support de votre organisation.
                        </p>

                    </td>
                </tr>

                {{-- Footer --}}
                <tr>
                    <td style="background-color:#f8fafc; border-top:1px solid #e2e8f0; padding:20px 40px; text-align:center;">
                        <p style="margin:0; font-size:12px; color:#94a3b8;">
                            <strong>SEN ARCHIVE</strong> — Plateforme d'archivage numérique sécurisée
                        </p>
                        <p style="margin:6px 0 0; font-size:11px; color:#cbd5e1;">
                            © {{ date('Y') }} SEN ARCHIVE. Tous droits réservés.
                        </p>
                    </td>
                </tr>

            </table>
        </td>
    </tr>
</table>

</body>
</html>
