<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VitrineFonctionnalite extends Model
{
    protected $table = 'vitrine_fonctionnalites';

    protected $fillable = [
        'icone',
        'titre',
        'description',
        'couleur_bg',
        'couleur_icone',
        'ordre',
        'actif',
    ];

    protected $casts = [
        'ordre' => 'integer',
        'actif' => 'boolean',
    ];

    public function scopeActif($query)
    {
        return $query->where('actif', true)->orderBy('ordre');
    }

    /** Médias (captures / vidéos) associés à cette fonctionnalité */
    public function medias()
    {
        return $this->hasMany(VitrineMedia::class, 'section', 'titre')
                    ->orderBy('ordre');
    }
}
