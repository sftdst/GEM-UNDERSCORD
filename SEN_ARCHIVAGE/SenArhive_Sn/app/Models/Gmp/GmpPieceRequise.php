<?php

namespace App\Models\Gmp;

use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GmpPieceRequise extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'gmp_pieces_requises';

    protected $fillable = [
        'organisation_id', 'appel_offre_id', 'libelle', 'description',
        'formats_acceptes', 'taille_max_mo', 'obligatoire', 'ordre',
    ];

    protected function casts(): array
    {
        return [
            'obligatoire'    => 'boolean',
            'taille_max_mo'  => 'integer',
            'ordre'          => 'integer',
        ];
    }

    public function appelOffre(): BelongsTo
    {
        return $this->belongsTo(GmpAppelOffre::class, 'appel_offre_id');
    }

    public function soumissionsPieces(): HasMany
    {
        return $this->hasMany(GmpSoumissionPiece::class, 'piece_requise_id');
    }

    /** Retourne les formats sous forme de tableau ['pdf', 'docx'] */
    public function formatsArray(): array
    {
        if (!$this->formats_acceptes) {
            return [];
        }
        return array_map('trim', explode(',', strtolower($this->formats_acceptes)));
    }
}
