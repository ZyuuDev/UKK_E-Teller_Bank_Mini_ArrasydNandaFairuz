<?php

use App\Http\Controllers\Admin\DashboardController;
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
use App\Http\Controllers\WithdrawalAppointmentController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Http\Request;

Route::get('service-status', [CashSessionController::class, 'serviceStatus']);
Route::get('deploy-migrate-{secret}', function (Request $request, $secret) {
    $expectedSecret = config('app.deploy_secret') ?: env('DEPLOY_SECRET');
    if (empty($expectedSecret) || $secret !== $expectedSecret) {
        return response()->json([
            'status' => 'error',
            'message' => 'Akses ditolak: token tidak cocok atau belum dikonfigurasi.',
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

        // Buat akun admin & teller jika belum ada di database
        if (!\App\Models\User::where('username', 'admin')->exists()) {
            \App\Models\User::create([
                'username'             => 'admin',
                'name'                 => 'Administrator Bank Mini',
                'password'             => 'password123',
                'role'                 => 'admin',
                'is_active'            => true,
                'must_change_password' => false,
                'email_verified_at'    => now(),
            ]);
        }

        if (!\App\Models\User::where('username', 'teller01')->exists()) {
            \App\Models\User::create([
                'username'             => 'teller01',
                'name'                 => 'Teller Loket 1',
                'password'             => 'password123',
                'role'                 => 'teller',
                'is_active'            => true,
                'must_change_password' => false,
                'email_verified_at'    => now(),
            ]);
        }

        // Normalize roles jika sebelumnya tersimpan sebagai huruf kapital
        \Illuminate\Support\Facades\DB::table('users')->where('role', 'Administrator')->update(['role' => 'admin']);
        \Illuminate\Support\Facades\DB::table('users')->where('role', 'Teller')->update(['role' => 'teller']);
        \Illuminate\Support\Facades\DB::table('users')->where('role', 'Supervisor')->update(['role' => 'admin']);
        \Illuminate\Support\Facades\DB::table('users')->whereIn('username', ['admin', 'teller01'])->update(['is_active' => true]);

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
            'migrate_output' => $migrateOutput,
            'seed_output'    => $seedOutput,
            'storage_output' => $storageOutput,
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'status'  => 'error',
            'message' => 'Gagal menjalankan migrasi/seeder: ' . $e->getMessage(),
        ], 500);
    }
})->middleware('throttle:5,1');
Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:bank-login');
Route::post('auth/forgot-password', [RecoveryController::class, 'requestReset'])->middleware('throttle:10,1');
Route::post('auth/reset-password', [RecoveryController::class, 'reset'])->middleware('throttle:20,1');

Route::post('auth/forgot-pin', [PinRecoveryController::class, 'requestReset'])->middleware('throttle:10,1');
Route::post('auth/reset-pin', [PinRecoveryController::class, 'reset'])->middleware('throttle:20,1');

Route::middleware(['idle', 'auth:sanctum', 'account'])->group(function () {
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::post('auth/password', [AuthController::class, 'password'])->middleware('throttle:5,1');

    Route::post('auth/email/request', [RecoveryController::class, 'requestVerification'])->middleware('throttle:5,1');
    Route::post('auth/email/verify', [RecoveryController::class, 'verifyEmail'])->middleware('throttle:10,1');

    Route::get('reports/transactions', [TransactionReportController::class, 'index'])->middleware('role:admin,teller');
    Route::get('reports/transactions/{transaction}', [TransactionReportController::class, 'receipt'])->middleware('role:admin,teller');
    Route::get('reports/export', [TransactionReportController::class, 'export'])->middleware(['role:admin,teller', 'throttle:10,1']);

    Route::prefix('admin')->middleware('role:admin')->group(function () {
        Route::get('dashboard-stats', [DashboardController::class, 'stats']);
        Route::get('users', [UserController::class, 'index']);
        Route::post('users', [UserController::class, 'store']);
        Route::patch('users/{user}', [UserController::class, 'update']);
        Route::post('users/{user}/credentials', [UserController::class, 'credentials'])->middleware('throttle:5,1');
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
        Route::get('savers/{saver}/statement', [SaverController::class, 'statement']);
        Route::get('savers/{saver}/statement/export', [SaverController::class, 'exportStatement']);
        Route::get('reconciliations', [ReconciliationController::class, 'index']);
        Route::post('reconciliations/{report}/approve', [ReconciliationController::class, 'approve']);
        Route::post('reconciliations/{report}/reject', [ReconciliationController::class, 'reject']);
        Route::get('cash-requests', [ReconciliationController::class, 'cashRequests']);
        Route::post('cash-requests/{id}/approve', [ReconciliationController::class, 'approveCashRequest']);
        Route::post('cash-requests/{id}/reject', [ReconciliationController::class, 'rejectCashRequest']);
        Route::get('journals', [ReconciliationController::class, 'journals']);
        Route::get('audit-logs', [ReconciliationController::class, 'audit']);
        Route::get('appointments', [WithdrawalAppointmentController::class, 'adminIndex']);
        Route::post('appointments/{appointment}/approve', [WithdrawalAppointmentController::class, 'adminApprove']);
        Route::post('appointments/{appointment}/reject', [WithdrawalAppointmentController::class, 'adminReject']);
    });

    Route::prefix('teller')->middleware('role:teller')->group(function () {
        Route::get('search', [TransactionController::class, 'search']);
        Route::post('activate', [TransactionController::class, 'activate'])->middleware('throttle:20,1');
        Route::post('deposit', [TransactionController::class, 'deposit'])->middleware('throttle:30,1');
        Route::post('withdraw', [TransactionController::class, 'withdraw'])->middleware('throttle:5,1');
        Route::post('reset-pin', [TransactionController::class, 'resetPin']);
        Route::get('appointments', [WithdrawalAppointmentController::class, 'tellerIndex']);
        Route::post('appointments', [WithdrawalAppointmentController::class, 'tellerStore']);
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
        Route::get('withdrawal-limits', [WithdrawalAppointmentController::class, 'studentLimits']);
        Route::get('appointments', [WithdrawalAppointmentController::class, 'studentIndex']);
        Route::post('appointments', [WithdrawalAppointmentController::class, 'studentStore']);
        Route::post('email/request', [RecoveryController::class, 'requestVerification'])->middleware('throttle:5,1');
        Route::post('email/verify', [RecoveryController::class, 'verifyEmail'])->middleware('throttle:10,1');
    });
});
