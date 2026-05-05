<?php

namespace App\Models;

use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Tag extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'tags';
    const UPDATED_AT = null;

    protected $fillable = ['organisation_id', 'nom', 'couleur'];

    public function documents(): BelongsToMany
    {
        return $this->belongsToMany(Document::class, 'documents_tags');
    }
}
