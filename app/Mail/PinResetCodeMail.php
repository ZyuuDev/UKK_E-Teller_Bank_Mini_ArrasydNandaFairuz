<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PinResetCodeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public string $code, public string $expires) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Kode pemulihan PIN Bank Mini');
    }

    public function content(): Content
    {
        return new Content(text: 'emails.pin-reset-code');
    }
}