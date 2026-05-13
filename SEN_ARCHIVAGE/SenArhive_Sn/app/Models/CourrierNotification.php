<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourrierNotification extends Model
{
    use HasUuid;
    protected $table = 'courrier_notifications';
    public $timestamps = true;

    protected $fillable = [
        'user_id','courrier_id','type','titre','message','lien','lu','lu_le',
    ];

    protected $casts = [
        'lu' => 'boolean',
        'lu_le' => 'datetime',
    ];

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'user_id');
    }

    public function courrier(): BelongsTo
    {
        return $this->belongsTo(Courrier::class);
    }
}