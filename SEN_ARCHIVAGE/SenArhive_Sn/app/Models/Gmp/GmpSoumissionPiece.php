<?php

namespace App\Models\Gmp;

use App\Models\Document;
use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GmpSoumissionPiece extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'gmp_soumissions_pieces';

    protected $fillable = [
        'organisation_id', 'soumission_id', 'piece_requise_id', 'libelle_libre',
        'document_id', 'nom_fichier_original', 'taille_octets',
        'statut', 'motif_rejet',
    ];

    protected function casts(): array
    {
        return [
            'taille_octets' => 'integer',
        ];
    }

    public function soumission(): BelongsTo
    {
        return $this->belongsTo(GmpSoumission::class);
    }

    public function pieceRequise(): BelongsTo
    {
        return $this->belongsTo(GmpPieceRequise::class, 'piece_requise_id');
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }
}
