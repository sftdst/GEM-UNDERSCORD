<?php

namespace App\Models;

use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class CourrierType extends Model
{
    use HasUuid, BelongsToOrganisation;
    protected $table = 'courrier_types';
    protected $fillable = ['organisation_id','nom','code','couleur','icone','actif'];
    public $timestamps = true;
    const UPDATED_AT = null;
}