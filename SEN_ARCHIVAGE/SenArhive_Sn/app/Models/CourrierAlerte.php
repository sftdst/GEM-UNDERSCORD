<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourrierAlerte extends Model
{
    use HasUuid;
    protected $table = 'courrier_alerts';
    public $timestamps = true;

    protected $fillable = [
        'courrier_id','user_id','type',
        'date_alerte','envoyee','lue',
    ];

    protected $casts = [
        'date_alerte' => 'datetime',
        'envoyee' => 'boolean',
        'lue' => 'boolean',
    ];

    public function courrier(): BelongsTo
    {
        return $this->belongsTo(Courrier::class);
    }

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'user_id');
    }
}