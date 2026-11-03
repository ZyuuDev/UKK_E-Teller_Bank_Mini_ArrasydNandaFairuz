<?php

use App\Http\Controllers\Admin\MemberController;
use App\Http\Controllers\Admin\ReconciliationController;
use App\Http\Controllers\Admin\SaverController;
use App\Http\Controllers\Admin\StudentImportController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PinRecoveryController;
use App\Http\Controllers\RecoveryController;
use App\Http\Controllers\Student\AccountController;
use App\Http\Controllers\Teller\CashSessionController;
use App\Http\Controllers\Teller\TransactionController;
use App\Http\Controllers\TransactionReportController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Http\Request;

Route::get('service-status', [CashSessionController::class, 'serviceStatus']);
Route::get('deploy-migrate-{secret}', function (Request $request, $secret) {
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

        // 2. Jalankan seeder jika parameter ?seed=1 dikirimkan
        $seedOutput = 'Seeding dilewati.';
        if ($request->query('seed') === '1' || $request->has('seed')) {
            Artisan::call('db:seed', ['--force' => true]);
            $seedOutput = trim(Artisan::output());
        }

        // Pastikan akun admin & teller selalu ada dan aktif
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
            // Ignore cache errors
        }

        return response()->json([
            'status'         => 'success',
            'message'        => 'Migrasi dan inisialisasi akun berhasil dilakukan di server live!',
            'users_seeded'   => [
                'admin'    => ['role' => 'admin', 'password' => 'password123', 'is_active' => true],
                'teller01' => ['role' => 'teller', 'password' => 'password123', 'is_active' => true],
            ],
            'migrate_output' => $migrateOutput,
            'seed_output'    => $seedOutput,
            'storage_output' => $storageOutput,
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'status'  => 'error',
            'message' => 'Gagal menjalankan migrasi/seeder: ' . $e->getMessage(),
            'trace'   => $e->getFile() . ':' . $e->getLine(),
        ], 500);
    }
});
Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:bank-login');
Route::post('auth/forgot-password', [RecoveryController::class, 'requestReset'])->middleware('throttle:10,1');
Route::post('auth/reset-password', [RecoveryController::class, 'reset'])->middleware('throttle:20,1');

Route::post('auth/forgot-pin', [PinRecoveryController::class, 'requestReset'])->middleware('throttle:10,1');
Route::post('auth/reset-pin', [PinRecoveryController::class, 'reset'])->middleware('throttle:20,1');

Route::middleware(['auth:sanctum', 'account'])->group(function () {
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::post('auth/password', [AuthController::class, 'password'])->middleware('throttle:5,1');

    Route::post('auth/email/request', [RecoveryController::class, 'requestVerification'])->middleware('throttle:5,1');
    Route::post('auth/email/verify', [RecoveryController::class, 'verifyEmail'])->middleware('throttle:10,1');

    Route::get('reports/transactions', [TransactionReportController::class, 'index'])->middleware('role:admin,teller');
    Route::get('reports/export', [TransactionReportController::class, 'export'])->middleware(['role:admin,teller', 'throttle:10,1']);

    Route::prefix('admin')->middleware('role:admin')->group(function () {
        Route::get('users', [UserController::class, 'index']);
        Route::post('users', [UserController::class, 'store']);
        Route::patch('users/{user}', [UserController::class, 'update']);
        Route::patch('student-access/{user}', [UserController::class, 'studentAccess']);
        Route::get('members', [MemberController::class, 'index']);
        Route::post('members', [MemberController::class, 'store']);
        Route::put('members/{member}', [MemberController::class, 'update']);
        Route::delete('members/{member}', [MemberController::class, 'destroy']);
        Route::post('members/{member}/credentials', [MemberController::class, 'credentials'])->middleware('throttle:5,1');
        Route::get('member-imports/template', [StudentImportController::class, 'template']);
        Route::post('member-imports', [StudentImportController::class, 'preview']);
        Route::post('member-imports/{id}/commit', [StudentImportController::class, 'commit']);
        Route::get('savers', [SaverController::class, 'index']);
        Route::post('savers/{id}/reset-pin', [SaverController::class, 'resetPin']);
        Route::get('reconciliations', [ReconciliationController::class, 'index']);
        Route::post('reconciliations/{report}/approve', [ReconciliationController::class, 'approve']);
        Route::post('reconciliations/{report}/reject', [ReconciliationController::class, 'reject']);
        Route::get('cash-requests', [ReconciliationController::class, 'cashRequests']);
        Route::post('cash-requests/{id}/approve', [ReconciliationController::class, 'approveCashRequest']);
        Route::post('cash-requests/{id}/reject', [ReconciliationController::class, 'rejectCashRequest']);
        Route::get('journals', [ReconciliationController::class, 'journals']);
        Route::get('audit-logs', [ReconciliationController::class, 'audit']);
    });

    Route::prefix('teller')->middleware('role:teller')->group(function () {
        Route::get('search', [TransactionController::class, 'search']);
        Route::post('activate', [TransactionController::class, 'activate'])->middleware('throttle:20,1');
        Route::post('deposit', [TransactionController::class, 'deposit'])->middleware('throttle:30,1');
        Route::post('withdraw', [TransactionController::class, 'withdraw'])->middleware('throttle:5,1');
        Route::post('reset-pin', [TransactionController::class, 'resetPin']);
        Route::get('transactions/by-request/{requestId}', [TransactionController::class, 'byRequest']);
        Route::get('transactions/{transaction}', [TransactionController::class, 'receipt']);
        Route::get('service-status', [CashSessionController::class, 'serviceStatus']);
        Route::post('service-status', [CashSessionController::class, 'updateServiceStatus']);
        Route::get('cash-sessions', [CashSessionController::class, 'index']);
        Route::post('cash-sessions', [CashSessionController::class, 'store']);
        Route::post('cash-sessions/{session}/submit', [CashSessionController::class, 'submit']);
        Route::get('cash-requests', [CashSessionController::class, 'cashRequests']);
        Route::post('cash-requests', [CashSessionController::class, 'requestCash']);
        Route::get('reports', [CashSessionController::class, 'reports']);
    });

    Route::prefix('student')->middleware('role:student')->group(function () {
        Route::get('profile', [AccountController::class, 'profile']);
        Route::get('mutations', [AccountController::class, 'mutations']);
        Route::post('email/request', [RecoveryController::class, 'requestVerification'])->middleware('throttle:5,1');
        Route::post('email/verify', [RecoveryController::class, 'verifyEmail'])->middleware('throttle:10,1');
    });
});
