<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VitrineMedia extends Model
{
    protected $table = 'vitrine_medias';

    protected $fillable = [
        'type',
        'titre',
        'description',
        'url',
        'thumbnail_url',
        'section',
        'duree_secondes',
        'ordre',
        'actif',
    ];

    protected $casts = [
        'duree_secondes' => 'integer',
        'ordre'          => 'integer',
        'actif'          => 'boolean',
    ];

    public function scopeActif($query)
    {
        return $query->where('actif', true)->orderBy('ordre');
    }

    public function scopeVideos($query)
    {
        return $query->where('type', 'video');
    }

    public function scopeScreenshots($query)
    {
        return $query->where('type', 'screenshot');
    }

    /** Durée formatée ex: "3:42" */
    public function getDureeFormateeAttribute(): ?string
    {
        if (! $this->duree_secondes) return null;
        $m = intdiv($this->duree_secondes, 60);
        $s = $this->duree_secondes % 60;
        return $m . ':' . str_pad((string)$s, 2, '0', STR_PAD_LEFT);
    }
}
