<?php
header('Content-Type: text/plain; charset=utf-8');

echo "=== DIAGNOSTIK SERVER DOMAINESIA ===\n\n";

// 1. PHP Version
echo "PHP Version: " . PHP_VERSION . "\n";
echo "Server Software: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'Unknown') . "\n";
echo "Document Root: " . ($_SERVER['DOCUMENT_ROOT'] ?? 'Unknown') . "\n\n";

// 2. Cek Berkas .env
$envFile = dirname(__DIR__) . '/.env';
echo "File .env lokasi: $envFile\n";
if (file_exists($envFile)) {
    echo "Status .env: DITEMUKAN (Ukuran: " . filesize($envFile) . " bytes)\n";
    $envContent = file_get_contents($envFile);
    // Parse key-value sederhana
    preg_match('/^APP_KEY=(.*)$/m', $envContent, $mKey);
    preg_match('/^DB_DATABASE=(.*)$/m', $envContent, $mDb);
    preg_match('/^DB_USERNAME=(.*)$/m', $envContent, $mUser);
    preg_match('/^DB_PASSWORD=(.*)$/m', $envContent, $mPass);
    preg_match('/^DEPLOY_SECRET=(.*)$/m', $envContent, $mSec);

    echo "- APP_KEY: " . (empty(trim($mKey[1] ?? '')) ? 'KOSONG / BELUM ADA' : 'TERISI (' . substr(trim($mKey[1]), 0, 15) . '...)') . "\n";
    echo "- DB_DATABASE: " . trim($mDb[1] ?? 'KOSONG') . "\n";
    echo "- DB_USERNAME: " . trim($mUser[1] ?? 'KOSONG') . "\n";
    echo "- DEPLOY_SECRET: " . trim($mSec[1] ?? 'KOSONG') . "\n";
} else {
    echo "Status .env: TIDAK DITEMUKAN! (Harus dibuat di public_html/.env)\n";
}
echo "\n";

// 3. Cek Permission Direktori Storage
$dirs = [
    'storage' => dirname(__DIR__) . '/storage',
    'storage/logs' => dirname(__DIR__) . '/storage/logs',
    'storage/framework' => dirname(__DIR__) . '/storage/framework',
    'storage/framework/sessions' => dirname(__DIR__) . '/storage/framework/sessions',
    'bootstrap/cache' => dirname(__DIR__) . '/bootstrap/cache',
];

echo "=== PERMISSION DIREKTORI ===\n";
foreach ($dirs as $name => $path) {
    if (!file_exists($path)) {
        @mkdir($path, 0775, true);
    }
    $writable = is_writable($path) ? 'BISA DITULIS (OK)' : 'TIDAK BISA DITULIS (PERLU CHMOD 775/777)';
    echo "- $name: $writable\n";
}
echo "\n";

// 4. Baca Isi Log Laravel Terakhir
$logFile = dirname(__DIR__) . '/storage/logs/laravel.log';
echo "=== LOG ERROR LARAVEL TERAKHIR ===\n";
if (file_exists($logFile)) {
    $lines = file($logFile);
    $lastLines = array_slice($lines, -30);
    echo implode("", $lastLines) . "\n";
} else {
    echo "Belum ada file storage/logs/laravel.log\n";
}
echo "\n";

// 5. Coba Koneksi Database PDO
if (!empty($mDb[1]) && !empty($mUser[1])) {
    echo "=== TES KONEKSI DATABASE ===\n";
    try {
        $db = trim($mDb[1]);
        $user = trim($mUser[1]);
        $pass = trim($mPass[1] ?? '');
        $pdo = new PDO("mysql:host=127.0.0.1;dbname=$db;charset=utf8mb4", $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        ]);
        echo "Koneksi Database: BERHASIL TERHUBUNG!\n";
    } catch (\Throwable $e) {
        echo "Koneksi Database GAGAL: " . $e->getMessage() . "\n";
    }
}
