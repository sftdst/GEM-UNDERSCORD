<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VitrinePartenaire extends Model
{
    protected $table = 'vitrine_partenaires';

    protected $fillable = [
        'nom',
        'logo_url',
        'site_web',
        'description',
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
}
