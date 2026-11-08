<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Di sini kita menangani:
| 1. Webhook CI/CD untuk menjalankan migrasi & caching tanpa SSH.
| 2. SPA Fallback untuk memuat React Single Page Application (frontend/dist).
|
*/

Route::withoutMiddleware([
    \Illuminate\Session\Middleware\StartSession::class,
    \Illuminate\View\Middleware\ShareErrorsFromSession::class,
    \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
])->middleware('throttle:5,1')->group(function () {
    Route::get('/debug-test', function () {
        abort_unless(config('app.debug'), 404);

        return response()->json([
            'status' => 'ok',
            'php' => PHP_VERSION,
            'app_key_set' => !empty(config('app.key')),
            'db_connection' => config('database.default'),
            'deploy_secret_set' => !empty(env('DEPLOY_SECRET')),
            'session_driver' => config('session.driver'),
        ]);
    });

    // Endpoint Webhook CI/CD (Otomatisasi migrasi & cache pasca-deploy tanpa SSH)
    Route::get('/deploy-migrate-{secret}', function (Request $request, $secret) {
        $expectedSecret = env('DEPLOY_SECRET');
        if (empty($expectedSecret) || $secret !== $expectedSecret) {
            return response()->json([
                'status' => 'error',
                'message' => 'Akses ditolak: DEPLOY_SECRET tidak cocok.',
                'hint' => empty($expectedSecret) ? 'DEPLOY_SECRET di file .env cPanel masih KOSONG / belum diisi.' : 'Token di URL berbeda dengan nilai DEPLOY_SECRET di .env cPanel.',
            ], 403);
        }

        try {
            // 1. Jalankan migrasi database
            Artisan::call('migrate', ['--force' => true]);
            $migrateOutput = trim(Artisan::output());

            // 2. Jalankan seeder jika parameter ?seed=1 dikirimkan (berguna saat setup awal)
            $seedOutput = 'Seeding dilewati.';
            if ($request->query('seed') === '1') {
                Artisan::call('db:seed', ['--force' => true]);
                $seedOutput = trim(Artisan::output());
            }

            // 3. Pastikan symlink storage terhubung
            try {
                Artisan::call('storage:link');
                $storageOutput = trim(Artisan::output());
            } catch (\Throwable $e) {
                $storageOutput = 'Storage link info: ' . $e->getMessage();
            }

            // 4. Optimasi cache produksi
            try {
                Artisan::call('optimize:clear');
                Artisan::call('config:cache');
                Artisan::call('route:cache');
                Artisan::call('view:cache');
            } catch (\Throwable $e) {
                // Ignore cache optimization errors if any
            }

            return response()->json([
                'status'         => 'success',
                'message'        => 'Migrasi dan optimasi cache berhasil dijalankan di server live!',
                'migrate_output' => $migrateOutput,
                'seed_output'    => $seedOutput,
                'storage_output' => $storageOutput,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Gagal menjalankan migrasi database: ' . $e->getMessage(),
            ], 500);
        }
    });
});

// React SPA Fallback: Melayani index.html untuk semua route web (kecuali /api dan /deploy-migrate)
Route::get('/{any?}', function () {
    $indexPath = public_path('index.html');
    if (file_exists($indexPath)) {
        return response()->file($indexPath);
    }
    return view('welcome');
})->where('any', '^(?!api|deploy-migrate).*$');
