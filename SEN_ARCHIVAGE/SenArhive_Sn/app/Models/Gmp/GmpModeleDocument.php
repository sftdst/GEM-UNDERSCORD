<?php

namespace App\Models\Gmp;

use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GmpModeleDocument extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'gmp_modeles_documents';

    protected $fillable = [
        'organisation_id', 'type_marche_id', 'nom', 'description',
        'type_document', 'contenu_html', 'variables_json', 'version', 'actif',
    ];

    protected function casts(): array
    {
        return [
            'variables_json' => 'array',
            'actif' => 'boolean',
            'version' => 'integer',
        ];
    }

    public function typeMarche(): BelongsTo
    {
        return $this->belongsTo(GmpTypeMarche::class, 'type_marche_id');
    }
}
