{{-- Partial récursif : nœud arborescence dossier --}}
@php
    $docCount  = count($node['documents']);
    $enfantCount = count($node['enfants']);
    $totalCount = $docCount + $enfantCount;
@endphp

<div class="tree-node">
    @if(!isset($root) || !$root)
    <div class="folder-row">
        <span class="folder-dot" style="background: {{ $node['couleur'] }};"></span>
        <span class="folder-name">{{ $node['nom'] }}</span>
        <span class="folder-counts">
            @if($docCount > 0){{ $docCount }} doc{{ $docCount > 1 ? 's' : '' }}@endif
            @if($docCount > 0 && $enfantCount > 0) &bull; @endif
            @if($enfantCount > 0){{ $enfantCount }} sous-dossier{{ $enfantCount > 1 ? 's' : '' }}@endif
            @if($totalCount === 0)<em>vide</em>@endif
        </span>
    </div>
    @endif

    {{-- Documents du nœud --}}
    @if($docCount > 0)
    <div class="doc-list {{ !isset($root) || !$root ? 'children' : '' }}" style="{{ (!isset($root) || !$root) ? 'border-left-color: '.$node['couleur'].';' : '' }}">
        @foreach($node['documents'] as $doc)
        <div class="doc-item">
            <span class="doc-ext">{{ $doc['extension'] ?: 'FILE' }}</span>
            <span class="doc-title" title="{{ $doc['titre'] }}">{{ $doc['titre'] }}</span>
            <span class="doc-meta">
                {{ $doc['taille_formatee'] }}
                @if($doc['numero_document'])
                    &bull; {{ $doc['numero_document'] }}
                @endif
                @if($doc['date_document'])
                    &bull; {{ \Carbon\Carbon::parse($doc['date_document'])->format('d/m/Y') }}
                @endif
            </span>
        </div>
        @endforeach
    </div>
    @endif

    {{-- Sous-dossiers récursifs --}}
    @if($enfantCount > 0)
    <div class="children" style="border-left-color: {{ $node['couleur'] }};">
        @foreach($node['enfants'] as $enfant)
            @include('partials.dossier_node', ['node' => $enfant, 'root' => false])
        @endforeach
    </div>
    @endif

    {{-- Dossier vide (niveau racine uniquement) --}}
    @if(isset($root) && $root && $totalCount === 0)
    <p class="empty">Ce dossier est vide.</p>
    @endif
</div>
