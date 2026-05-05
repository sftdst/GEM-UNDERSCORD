<?php

namespace App\Mail;

use App\Models\Utilisateur;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SendAccessCredentials extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Utilisateur $utilisateur,
        public string $temporaryPassword,
        public string $loginUrl,
        public string $organisationNom = '',
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Vos identifiants d\'accès à SEN ARCHIVE',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.access_credentials',
            with: [
                'utilisateur' => $this->utilisateur,
                'temporaryPassword' => $this->temporaryPassword,
                'loginUrl' => $this->loginUrl,
                'organisationNom' => $this->organisationNom,
            ],
        );
    }
}
