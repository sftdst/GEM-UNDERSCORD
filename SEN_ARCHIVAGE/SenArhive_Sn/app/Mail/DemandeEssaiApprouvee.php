<?php

namespace App\Mail;

use App\Models\Organisation;
use App\Models\Utilisateur;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DemandeEssaiApprouvee extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Utilisateur $utilisateur,
        public Organisation $organisation,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Votre demande d\'essai SenArhive a été approuvée !',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.demande_essai_approuvee',
            with: [
                'utilisateur'  => $this->utilisateur,
                'organisation' => $this->organisation,
                'loginUrl'     => url('/login'),
            ],
        );
    }
}
