<?php

return [
    'name' => 'Bank Mini SMKN 1 Bantul',
    'minimum_balance' => 10000,
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
];
