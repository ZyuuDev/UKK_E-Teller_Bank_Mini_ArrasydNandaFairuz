<?php
header('Content-Type: text/plain; charset=utf-8');

echo "=== DIAGNOSTIK SERVER DOMAINESIA ===\n\n";

// 1. PHP Version
echo "PHP Version: " . PHP_VERSION . "\n";
echo "Server Software: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'Unknown') . "\n";
echo "Document Root: " . ($_SERVER['DOCUMENT_ROOT'] ?? 'Unknown') . "\n\n";

// 2. Cek Berkas .env
$baseDir = dirname(__DIR__);
$envFile = $baseDir . '/.env';
echo "File .env lokasi: $envFile\n";
if (file_exists($envFile)) {
    echo "Status .env: DITEMUKAN (Ukuran: " . filesize($envFile) . " bytes)\n";
    $envContent = file_get_contents($envFile);
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
    echo "Status .env: TIDAK DITEMUKAN!\n";
}
echo "\n";

// 3. Cek Permission Direktori Storage
$dirs = [
    'storage' => $baseDir . '/storage',
    'storage/logs' => $baseDir . '/storage/logs',
    'storage/framework' => $baseDir . '/storage/framework',
    'storage/framework/sessions' => $baseDir . '/storage/framework/sessions',
    'bootstrap/cache' => $baseDir . '/bootstrap/cache',
];

echo "=== PERMISSION DIREKTORI ===\n";
foreach ($dirs as $name => $path) {
    if (!file_exists($path)) {
        @mkdir($path, 0775, true);
    }
    $writable = is_writable($path) ? 'BISA DITULIS (OK)' : 'TIDAK BISA DITULIS';
    echo "- $name: $writable\n";
}
echo "\n";

// 4. Eksekusi Migrasi & Seeder jika diminta (?action=migrate)
if (isset($_GET['action']) && $_GET['action'] === 'migrate') {
    echo "=== MENJALANKAN MIGRASI & SEEDER VIA ARTISAN ===\n";
    try {
        require $baseDir . '/vendor/autoload.php';
        /** @var \Illuminate\Foundation\Application $app */
        $app = require_once $baseDir . '/bootstrap/app.php';
        
        // Buat kernel console
        $kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
        $kernel->bootstrap();

        echo "1. Menjalankan migrate --force...\n";
        $code = \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
        echo \Illuminate\Support\Facades\Artisan::output() . "\n";

        if (isset($_GET['seed']) && $_GET['seed'] === '1') {
            echo "2. Menjalankan db:seed --force...\n";
            \Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);
            echo \Illuminate\Support\Facades\Artisan::output() . "\n";
        }

        echo "3. Membuat symlink storage...\n";
        try {
            \Illuminate\Support\Facades\Artisan::call('storage:link');
            echo \Illuminate\Support\Facades\Artisan::output() . "\n";
        } catch (\Throwable $te) {
            echo "Storage link note: " . $te->getMessage() . "\n";
        }

        echo "HASIL: SEMUA PROSES DATABASE SUKSES!\n";
    } catch (\Throwable $e) {
        echo "ERROR SAAT MIGRASI:\n";
        echo $e->getMessage() . "\n";
        echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
        echo $e->getTraceAsString() . "\n";
    }
    echo "\n";
}

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
        // Cek tabel-tabel yang ada
        $stmt = $pdo->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        echo "Daftar tabel yang sudah ada (" . count($tables) . "): " . implode(", ", $tables) . "\n";
    } catch (\Throwable $e) {
        echo "Koneksi Database GAGAL: " . $e->getMessage() . "\n";
    }
}
