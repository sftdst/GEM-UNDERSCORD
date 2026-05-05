<?php

namespace App\Mail;

use App\Models\Document;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class DocumentMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Document $document,
        public string $destinataire,
        public string $messagePersonnalise,
        public string $expediteurNom,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Document partagé : {$this->document->titre}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.document',
            with: [
                'document' => $this->document,
                'messagePersonnalise' => $this->messagePersonnalise,
                'expediteurNom' => $this->expediteurNom,
            ],
        );
    }

    public function attachments(): array
    {
        $version = $this->document->derniereVersion;

        if (!$version) {
            return [];
        }

        $path = $version->chemin_stockage;

        if (!Storage::disk('local')->exists($path)) {
            return [];
        }

        return [
            Attachment::fromStorageDisk('local', $path)
                ->as($this->document->nom_fichier_original ?? $this->document->titre)
                ->withMime($this->document->type_mime ?? 'application/octet-stream'),
        ];
    }
}
