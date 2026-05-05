<?php

namespace App\Events;

use App\Models\Document;
use App\Models\Utilisateur;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DocumentShared
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Document $document,
        public Utilisateur $sharedBy,
        public Utilisateur $sharedWith,
    ) {}
}
