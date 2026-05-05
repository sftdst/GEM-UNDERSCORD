<?php

namespace App\Mail;

use App\Models\TicketSupport;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TicketReponseMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public TicketSupport $ticket,
        public string $reponse,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Réponse à votre ticket : {$this->ticket->sujet}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.ticket_reponse',
            with: [
                'ticket'  => $this->ticket,
                'reponse' => $this->reponse,
            ],
        );
    }
}
