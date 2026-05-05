<?php

namespace App\Events;

use App\Models\Commentaire;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CommentAdded
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Commentaire $commentaire,
    ) {}
}
