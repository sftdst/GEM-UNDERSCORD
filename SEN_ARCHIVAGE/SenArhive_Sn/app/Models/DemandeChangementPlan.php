<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DemandeChangementPlan extends Model
{
    use HasUuid;

    protected $table = 'demandes_changement_plan';

    protected $fillable = [
        'organisation_id', 'plan_actuel_id', 'plan_demande_id',
        'periodicite_demandee', 'statut', 'message', 'motif_rejet', 'traite_le',
    ];

    protected function casts(): array
    {
        return [
            'traite_le' => 'datetime',
        ];
    }

    public function organisation(): BelongsTo
    {
        return $this->belongsTo(Organisation::class);
    }

    public function planActuel(): BelongsTo
    {
        return $this->belongsTo(Plan::class, 'plan_actuel_id');
    }

    public function planDemande(): BelongsTo
    {
        return $this->belongsTo(Plan::class, 'plan_demande_id');
    }

    public function estEnAttente(): bool
    {
        return $this->statut === 'en_attente';
    }
}
