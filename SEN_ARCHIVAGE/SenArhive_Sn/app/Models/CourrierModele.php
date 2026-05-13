<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourrierModele extends Model
{
    use HasUuid;
    protected $table = 'courrier_modeles';
    public $timestamps = true;

    protected $fillable = ['nom','type_modele','contenu_html','created_by'];

    public function createur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'created_by');
    }
}