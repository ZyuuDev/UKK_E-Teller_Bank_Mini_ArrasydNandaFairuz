<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class AccessCodeMail extends Mailable
{
    public function __construct(public string $code, public string $purpose, public string $expires)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->purpose === 'password_reset' ? 'Kode reset password Bank Mini SMKN 1 Bantul' : 'Verifikasi email Bank Mini SMKN 1 Bantul');
    }

    public function content(): Content
    {
        return new Content(text: 'emails.access-code');
    }
}