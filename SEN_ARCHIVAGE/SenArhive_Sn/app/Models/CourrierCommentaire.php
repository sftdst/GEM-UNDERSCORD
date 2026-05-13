<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourrierCommentaire extends Model
{
    use HasUuid;
    protected $table = 'courrier_commentaires';
    public $timestamps = true;

    protected $fillable = ['courrier_id','user_id','contenu','interne'];

    public function courrier(): BelongsTo
    {
        return $this->belongsTo(Courrier::class);
    }

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'user_id');
    }
}