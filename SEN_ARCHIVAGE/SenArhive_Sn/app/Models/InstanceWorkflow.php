<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InstanceWorkflow extends Model
{
    use HasUuid;

    protected $table = 'instances_workflow';

    protected $fillable = [
        'workflow_id', 'document_id', 'statut', 'etape_courante',
        'initie_par', 'commentaire',
    ];

    public function workflow(): BelongsTo { return $this->belongsTo(Workflow::class); }
    public function document(): BelongsTo { return $this->belongsTo(Document::class); }
    public function initiateur(): BelongsTo { return $this->belongsTo(Utilisateur::class, 'initie_par'); }
    public function etapes(): HasMany { return $this->hasMany(EtapeWorkflow::class, 'instance_id')->orderBy('numero_etape'); }
}
