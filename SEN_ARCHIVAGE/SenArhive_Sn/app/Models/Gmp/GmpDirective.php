<?php

namespace App\Models\Gmp;

use App\Models\Utilisateur;
use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GmpDirective extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'gmp_directives';

    protected $fillable = [
        'organisation_id', 'type_directive', 'titre', 'contenu', 'priorite',
        'organisations_cibles', 'date_expiration', 'emis_par', 'statut',
    ];

    protected function casts(): array
    {
        return [
            'organisations_cibles' => 'array',
            'date_expiration' => 'date',
        ];
    }

    public function emetteur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'emis_par');
    }
}
