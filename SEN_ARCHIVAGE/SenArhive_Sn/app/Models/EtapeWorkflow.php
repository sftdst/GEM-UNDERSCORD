<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EtapeWorkflow extends Model
{
    use HasUuid;

    protected $table = 'etapes_workflow';
    public $timestamps = false;

    protected $fillable = [
        'instance_id', 'numero_etape', 'approbateur_id',
        'statut', 'commentaire', 'traite_le',
    ];

    protected function casts(): array
    {
        return ['traite_le' => 'datetime'];
    }

    public function instance(): BelongsTo { return $this->belongsTo(InstanceWorkflow::class, 'instance_id'); }
    public function approbateur(): BelongsTo { return $this->belongsTo(Utilisateur::class, 'approbateur_id'); }
}
