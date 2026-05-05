<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Réponse à votre ticket — SEN ARCHIVE</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f9; font-family: Arial, sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9; padding: 40px 0;">
    <tr>
        <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">

                
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

                
                <tr>
                    <td style="padding: 36px 40px;">

                        <p style="margin:0 0 16px; font-size:16px; color:#1e293b;">
                            Bonjour <strong><?php echo e($ticket->utilisateur?->prenom); ?> <?php echo e($ticket->utilisateur?->nom); ?></strong>,
                        </p>

                        <p style="margin:0 0 24px; font-size:15px; color:#475569; line-height:1.6;">
                            Le support SEN ARCHIVE a répondu à votre ticket.
                        </p>

                        
                        <table width="100%" cellpadding="0" cellspacing="0"
                               style="background-color:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; margin-bottom:20px;">
                            <tr>
                                <td style="padding: 16px 20px;">
                                    <p style="margin:0 0 4px; font-size:12px; font-weight:bold; color:#1e40af; text-transform:uppercase; letter-spacing:0.5px;">
                                        Votre ticket
                                    </p>
                                    <p style="margin:0; font-size:15px; color:#1e293b; font-weight:bold;">
                                        <?php echo e($ticket->sujet); ?>

                                    </p>
                                </td>
                            </tr>
                        </table>

                        
                        <table width="100%" cellpadding="0" cellspacing="0"
                               style="background-color:#f8fafc; border-left:4px solid #2563eb; border-radius:4px; margin-bottom:28px;">
                            <tr>
                                <td style="padding: 18px 20px;">
                                    <p style="margin:0 0 10px; font-size:12px; font-weight:bold; color:#64748b; text-transform:uppercase; letter-spacing:0.5px;">
                                        Réponse du support
                                    </p>
                                    <p style="margin:0; font-size:14px; color:#334155; line-height:1.7; white-space:pre-line;"><?php echo e($reponse); ?></p>
                                </td>
                            </tr>
                        </table>

                        
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                            <tr>
                                <td align="center">
                                    <a href="<?php echo e(url('/support/' . $ticket->id)); ?>"
                                       style="display:inline-block; background-color:#2563eb; color:#ffffff; padding:14px 36px;
                                              text-decoration:none; border-radius:6px; font-weight:bold; font-size:15px;">
                                        Voir le ticket →
                                    </a>
                                </td>
                            </tr>
                        </table>

                        <p style="margin:0; font-size:13px; color:#94a3b8; line-height:1.6;">
                            Si vous avez d'autres questions, vous pouvez répondre directement sur la plateforme.
                        </p>

                    </td>
                </tr>

                
                <tr>
                    <td style="background-color:#f8fafc; border-top:1px solid #e2e8f0; padding:20px 40px; text-align:center;">
                        <p style="margin:0; font-size:12px; color:#94a3b8;">
                            <strong>SEN ARCHIVE</strong> — Plateforme d'archivage numérique sécurisée
                        </p>
                        <p style="margin:6px 0 0; font-size:11px; color:#cbd5e1;">
                            © <?php echo e(date('Y')); ?> SEN ARCHIVE. Tous droits réservés.
                        </p>
                    </td>
                </tr>

            </table>
        </td>
    </tr>
</table>

</body>
</html>
<?php /**PATH E:\CODING\DSTCOMPUTING\Plateforme\SEN_ARCHIVAGE\SenArhive_Sn\resources\views\emails\ticket_reponse.blade.php ENDPATH**/ ?>