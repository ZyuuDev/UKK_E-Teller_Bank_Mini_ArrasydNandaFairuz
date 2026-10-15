<?php

use App\Http\Controllers\Admin\MemberController;
use App\Http\Controllers\Admin\ReconciliationController;
use App\Http\Controllers\Admin\SaverController;
use App\Http\Controllers\Admin\StudentImportController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\RecoveryController;
use App\Http\Controllers\Student\AccountController;
use App\Http\Controllers\Teller\CashSessionController;
use App\Http\Controllers\Teller\TransactionController;
use Illuminate\Support\Facades\Route;

Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:bank-login');
Route::post('auth/forgot-password', [RecoveryController::class, 'requestReset'])->middleware('throttle:10,1');
Route::post('auth/reset-password', [RecoveryController::class, 'reset'])->middleware('throttle:20,1');

Route::middleware(['auth:sanctum', 'account'])->group(function () {
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::post('auth/password', [AuthController::class, 'password'])->middleware('throttle:5,1');

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
        Route::get('reconciliations', [ReconciliationController::class, 'index']);
        Route::post('reconciliations/{report}/approve', [ReconciliationController::class, 'approve']);
        Route::post('reconciliations/{report}/reject', [ReconciliationController::class, 'reject']);
        Route::get('journals', [ReconciliationController::class, 'journals']);
        Route::get('audit-logs', [ReconciliationController::class, 'audit']);
    });

    Route::prefix('teller')->middleware('role:teller')->group(function () {
        Route::get('search', [TransactionController::class, 'search']);
        Route::post('activate', [TransactionController::class, 'activate'])->middleware('throttle:20,1');
        Route::post('deposit', [TransactionController::class, 'deposit'])->middleware('throttle:30,1');
        Route::post('withdraw', [TransactionController::class, 'withdraw'])->middleware('throttle:5,1');
        Route::get('transactions/by-request/{requestId}', [TransactionController::class, 'byRequest']);
        Route::get('transactions/{transaction}', [TransactionController::class, 'receipt']);
        Route::get('cash-sessions', [CashSessionController::class, 'index']);
        Route::post('cash-sessions', [CashSessionController::class, 'store']);
        Route::post('cash-sessions/{session}/submit', [CashSessionController::class, 'submit']);
        Route::get('reports', [CashSessionController::class, 'reports']);
    });

    Route::prefix('student')->middleware('role:student')->group(function () {
        Route::get('profile', [AccountController::class, 'profile']);
        Route::get('mutations', [AccountController::class, 'mutations']);
        Route::post('email/request', [RecoveryController::class, 'requestVerification'])->middleware('throttle:5,1');
        Route::post('email/verify', [RecoveryController::class, 'verifyEmail'])->middleware('throttle:10,1');
    });
});