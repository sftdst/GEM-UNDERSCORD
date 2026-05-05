<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VitrineTemoignage extends Model
{
    protected $table = 'vitrine_temoignages';

    protected $fillable = [
        'nom',
        'role',
        'entreprise',
        'initiales',
        'photo_url',
        'contenu',
        'note',
        'ordre',
        'actif',
    ];

    protected $casts = [
        'note'  => 'integer',
        'ordre' => 'integer',
        'actif' => 'boolean',
    ];

    public function scopeActif($query)
    {
        return $query->where('actif', true)->orderBy('ordre');
    }
}
