<?php

return [
    'name' => 'Bank Mini SMKN 1 Bantul',
    'minimum_balance' => 10000,
    'daily_withdrawal_limit' => (int) env('BANK_DAILY_WITHDRAWAL_LIMIT', 1000000),
    'appointment_threshold' => (int) env('BANK_APPOINTMENT_THRESHOLD', 1000000),
    'maximum_transaction' => 1000000000000,
    'maximum_balance' => 9000000000000,
    'import_max_rows' => 2000,

    // Batas tidak aktif (menit) sebelum sesi dicabut server dan pengguna kembali ke halaman login.
    'idle_timeout_minutes' => [
        'staff' => (int) env('BANK_IDLE_STAFF_MINUTES', 10),
        'student' => (int) env('BANK_IDLE_STUDENT_MINUTES', 5),
    ],

    // Pembatasan percobaan login. Hanya percobaan GAGAL yang dihitung.
    'login' => [
        'pair_max_failures' => (int) env('BANK_LOGIN_PAIR_MAX', 5),
        'account_max_failures' => (int) env('BANK_LOGIN_ACCOUNT_MAX', 15),
        'ip_max_failures' => (int) env('BANK_LOGIN_IP_MAX', 40),
        'lockout_seconds' => (int) env('BANK_LOGIN_LOCKOUT_SECONDS', 900),
        'ip_window_seconds' => 600,
        'max_active_tokens' => (int) env('BANK_MAX_ACTIVE_TOKENS', 3),
    ],

    // Jam operasional loket kas teller dan auto-close kas 17:00 WIB
    'operating_hours' => [
        'open_time' => env('BANK_OPERATING_OPEN', '07:30'),
        'close_time' => env('BANK_OPERATING_CLOSE', '17:00'),
        'timezone' => env('BANK_TIMEZONE', 'Asia/Jakarta'),
        'enforce' => env('BANK_ENFORCE_OPERATING_HOURS', true),
    ],
];
