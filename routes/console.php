<?php

use App\Services\CashSessionService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('bank:auto-close-sessions', function (CashSessionService $sessions) {
    $closed = $sessions->autoCloseForgottenSessions();
    $this->info("Pemeriksaan auto-close kas selesai. Total sesi kas yang ditutup otomatis: {$closed}.");
})->purpose('Menutup otomatis sesi kas loket teller yang belum ditutup pada jam 17:00 WIB');

Schedule::command('bank:auto-close-sessions')->dailyAt('17:00')->timezone('Asia/Jakarta');
