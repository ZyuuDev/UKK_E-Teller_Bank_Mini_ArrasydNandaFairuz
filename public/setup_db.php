<?php

declare(strict_types=1);

header('Content-Type: application/json');

$expectedSecret = 'skansaba_super_secret_token_12345';
$secret = $_GET['secret'] ?? '';

if ($secret !== $expectedSecret) {
    http_response_code(403);
    echo json_encode([
        'status' => 'error',
        'message' => 'Akses ditolak: secret tidak cocok.',
    ]);
    exit;
}

try {
    // 1. Hapus cache bootstrap lawas jika ada
    $cacheDir = __DIR__ . '/../bootstrap/cache';
    $deletedCache = [];
    foreach (['config.php', 'routes-v7.php', 'events.php'] as $file) {
        $filePath = $cacheDir . '/' . $file;
        if (file_exists($filePath)) {
            @unlink($filePath);
            $deletedCache[] = $file;
        }
    }

    // 2. Inisialisasi framework Laravel
    require __DIR__ . '/../vendor/autoload.php';
    $app = require_once __DIR__ . '/../bootstrap/app.php';
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();

    // 3. Jalankan migrasi
    Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
    $migrateOutput = trim(Illuminate\Support\Facades\Artisan::output());

    // 4. Jalankan seeder
    Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);
    $seedOutput = trim(Illuminate\Support\Facades\Artisan::output());

    // 5. Pastikan akun admin & teller terdaftar dan aktif dengan role huruf kecil
    \App\Models\User::updateOrCreate(
        ['username' => 'admin'],
        [
            'name'                 => 'Administrator Bank Mini',
            'password'             => 'password123',
            'role'                 => 'admin',
            'is_active'            => true,
            'must_change_password' => false,
        ]
    );

    \App\Models\User::updateOrCreate(
        ['username' => 'teller01'],
        [
            'name'                 => 'Teller Loket 1',
            'password'             => 'password123',
            'role'                 => 'teller',
            'is_active'            => true,
            'must_change_password' => false,
        ]
    );

    // Normalize roles
    \Illuminate\Support\Facades\DB::table('users')->where('role', 'Administrator')->update(['role' => 'admin']);
    \Illuminate\Support\Facades\DB::table('users')->where('role', 'Teller')->update(['role' => 'teller']);
    \Illuminate\Support\Facades\DB::table('users')->where('role', 'Supervisor')->update(['role' => 'admin']);
    \Illuminate\Support\Facades\DB::table('users')->whereIn('username', ['admin', 'teller01'])->update(['is_active' => true]);

    $users = \App\Models\User::select('id', 'username', 'role', 'is_active')->get();

    echo json_encode([
        'status'         => 'success',
        'message'        => 'Inisialisasi database dan akun petugas berhasil!',
        'deleted_cache'  => $deletedCache,
        'migrate_output' => $migrateOutput,
        'seed_output'    => $seedOutput,
        'users'          => $users,
    ], JSON_PRETTY_PRINT);
} catch (\Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => $e->getMessage(),
        'file'    => $e->getFile() . ':' . $e->getLine(),
    ], JSON_PRETTY_PRINT);
}
