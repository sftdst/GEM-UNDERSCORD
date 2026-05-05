<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Commentaire extends Model
{
    use HasUuid, SoftDeletes;

    protected $table = 'commentaires';
    public $timestamps = false;
    const DELETED_AT = 'deleted_at';

    protected $fillable = [
        'document_id', 'parent_id', 'utilisateur_id',
        'contenu', 'position_json', 'est_resolu',
    ];

    protected function casts(): array
    {
        return [
            'position_json' => 'array',
            'est_resolu' => 'boolean',
        ];
    }

    public function document(): BelongsTo { return $this->belongsTo(Document::class); }
    public function utilisateur(): BelongsTo { return $this->belongsTo(Utilisateur::class); }
    public function parent(): BelongsTo { return $this->belongsTo(Commentaire::class, 'parent_id'); }
    public function reponses(): HasMany { return $this->hasMany(Commentaire::class, 'parent_id'); }
}
