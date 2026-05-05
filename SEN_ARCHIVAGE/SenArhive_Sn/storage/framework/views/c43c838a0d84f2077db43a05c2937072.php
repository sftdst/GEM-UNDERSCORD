<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document partagé</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .header { background: #1a1a2e; padding: 24px 32px; }
        .header h1 { color: #e67e22; margin: 0; font-size: 20px; }
        .header p { color: #ccc; margin: 4px 0 0; font-size: 13px; }
        .body { padding: 32px; }
        .body p { color: #444; line-height: 1.6; }
        .doc-card { background: #f8f8f8; border: 1px solid #e0e0e0; border-radius: 6px; padding: 16px; margin: 20px 0; }
        .doc-card strong { display: block; font-size: 16px; color: #222; margin-bottom: 6px; }
        .doc-card span { font-size: 13px; color: #666; }
        .message-box { background: #fef9f0; border-left: 4px solid #e67e22; padding: 12px 16px; margin: 20px 0; border-radius: 0 6px 6px 0; }
        .message-box p { margin: 0; color: #555; font-style: italic; }
        .footer { background: #f0f0f0; padding: 16px 32px; text-align: center; }
        .footer p { font-size: 12px; color: #999; margin: 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>SEN_ARCHIV</h1>
            <p>Plateforme de gestion documentaire</p>
        </div>
        <div class="body">
            <p>Bonjour,</p>
            <p><strong><?php echo e($expediteurNom); ?></strong> vous a partagé un document via la plateforme SEN_ARCHIV.</p>

            <div class="doc-card">
                <strong><?php echo e($document->titre); ?></strong>
                <?php if($document->description): ?>
                    <span><?php echo e($document->description); ?></span>
                <?php endif; ?>
                <span style="display:block; margin-top:8px;">
                    Extension : <?php echo e(strtoupper($document->extension ?? 'N/A')); ?>

                    &nbsp;|&nbsp;
                    Taille : <?php echo e($document->taille_formatee ?? 'N/A'); ?>

                </span>
            </div>

            <?php if($messagePersonnalise): ?>
                <div class="message-box">
                    <p><?php echo e($messagePersonnalise); ?></p>
                </div>
            <?php endif; ?>

            <p>Le document est joint à cet email. Si vous ne pouvez pas l'ouvrir, contactez l'expéditeur directement.</p>
        </div>
        <div class="footer">
            <p>Cet email a été envoyé via SEN_ARCHIV &mdash; <?php echo e(config('app.name')); ?></p>
        </div>
    </div>
</body>
</html>
<?php /**PATH E:\CODING\DSTCOMPUTING\Plateforme\SEN_ARCHIVAGE\SenArhive_Sn\resources\views\emails\document.blade.php ENDPATH**/ ?>