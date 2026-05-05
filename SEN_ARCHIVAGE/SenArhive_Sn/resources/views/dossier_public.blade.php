<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $dossier->nom }} — SenArhive</title>
    <link rel="icon" href="/favicon.png" type="image/png">
    <link rel="icon" href="/favicon.ico" sizes="any">
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: #f8fafc;
            color: #1e293b;
            min-height: 100vh;
        }

        .container {
            max-width: 860px;
            margin: 0 auto;
            padding: 2rem 1.5rem;
        }

        /* Header */
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            margin-bottom: 2rem;
            padding-bottom: 1.5rem;
            border-bottom: 2px solid #e2e8f0;
        }
        .header-left { display: flex; align-items: center; gap: 1rem; }
        .logo { font-size: 1.5rem; font-weight: 800; color: #6366f1; letter-spacing: -0.5px; }
        .badge {
            display: inline-flex; align-items: center; gap: .4rem;
            background: #ede9fe; color: #4f46e5;
            padding: .3rem .8rem; border-radius: 9999px; font-size: .75rem; font-weight: 600;
        }

        /* Dossier title */
        .dossier-header {
            display: flex; align-items: center; gap: 1rem;
            margin-bottom: 1.5rem;
        }
        .folder-icon {
            width: 3rem; height: 3rem; border-radius: .75rem;
            display: flex; align-items: center; justify-content: center;
            font-size: 1.5rem;
        }
        .dossier-title { font-size: 1.75rem; font-weight: 700; }
        .dossier-path { color: #64748b; font-size: .875rem; margin-top: .25rem; font-family: monospace; }

        /* Arborescence */
        .tree { margin-top: 1.5rem; }
        .tree-node { margin-bottom: .5rem; }

        .folder-row {
            display: flex; align-items: center; gap: .6rem;
            padding: .6rem .9rem;
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: .5rem;
            margin-bottom: .35rem;
        }
        .folder-row .folder-dot {
            width: .75rem; height: .75rem; border-radius: 50%; flex-shrink: 0;
        }
        .folder-row .folder-name { font-weight: 600; font-size: .9375rem; }
        .folder-row .folder-counts {
            margin-left: auto; color: #94a3b8; font-size: .8125rem;
        }

        .children { padding-left: 1.5rem; border-left: 2px solid #e2e8f0; margin-left: .9rem; margin-top: .25rem; margin-bottom: .5rem; }

        /* Documents list */
        .doc-list { margin-top: .35rem; }
        .doc-item {
            display: flex; align-items: center; gap: .75rem;
            padding: .5rem .9rem;
            background: #f8fafc;
            border: 1px solid #f1f5f9;
            border-radius: .375rem;
            margin-bottom: .25rem;
        }
        .doc-ext {
            font-size: .65rem; font-weight: 700; background: #dbeafe; color: #1d4ed8;
            padding: .15rem .4rem; border-radius: .25rem; min-width: 2.5rem; text-align: center;
        }
        .doc-title { font-size: .875rem; font-weight: 500; flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .doc-meta { font-size: .75rem; color: #94a3b8; white-space: nowrap; }

        /* Empty */
        .empty { color: #94a3b8; font-size: .875rem; font-style: italic; padding: .5rem .9rem; }

        /* Print button */
        .print-btn {
            display: inline-flex; align-items: center; gap: .5rem;
            background: #6366f1; color: #fff;
            border: none; cursor: pointer;
            padding: .6rem 1.2rem; border-radius: .5rem;
            font-size: .875rem; font-weight: 600;
            transition: background .2s;
        }
        .print-btn:hover { background: #4f46e5; }

        /* Footer */
        .footer {
            margin-top: 3rem; padding-top: 1rem;
            border-top: 1px solid #e2e8f0;
            color: #94a3b8; font-size: .75rem; text-align: center;
        }

        @media print {
            body { background: #fff; }
            .no-print { display: none !important; }
            .container { padding: 1rem; }
            .folder-row, .doc-item { break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="container">

        <!-- Header -->
        <div class="header">
            <div class="header-left">
                <span class="logo">SenArhive</span>
                <span class="badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                    Consultation dossier
                </span>
            </div>
            <button class="print-btn no-print" onclick="window.print()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                Imprimer
            </button>
        </div>

        <!-- Dossier name -->
        <div class="dossier-header">
            <div class="folder-icon" style="background: {{ $dossier->couleur ?? '#6366f1' }}22;">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="{{ $dossier->couleur ?? '#6366f1' }}" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div>
                <div class="dossier-title">{{ $dossier->nom }}</div>
                @if($dossier->chemin)
                    <div class="dossier-path">{{ $dossier->chemin }}</div>
                @endif
            </div>
        </div>

        <!-- Arborescence récursive -->
        <div class="tree">
            @include('partials.dossier_node', ['node' => $arborescence, 'root' => true])
        </div>

        <div class="footer">
            Généré le {{ now()->format('d/m/Y à H:i') }} &bull; SenArhive — Plateforme de Gestion Électronique de Documents
        </div>
    </div>
</body>
</html>
