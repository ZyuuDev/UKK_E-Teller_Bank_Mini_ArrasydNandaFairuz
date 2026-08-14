<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {

    // POST /api/auth/login
    Route::post('/login', [AuthController::class, 'login']);
});

Route::middleware('auth:sanctum')->group(function () {
    //POST /api/auth/logout
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // GET /api/auth/me (lihat profil sendiri)
    Route::get('/auth/me', [AuthController::class, 'me']);

    Route::middleware('role:Administrator')->prefix('admin')->group(function () {

        // --- User Management ---
        // GET    /api/admin/users         → list semua user
        // POST   /api/admin/users         → buat user baru
        // GET    /api/admin/users/{id}    → detail 1 user
        // PUT    /api/admin/users/{id}    → edit user
        // DELETE /api/admin/users/{id}   → hapus user
        Route::apiResource('users', \App\Http\Controllers\Admin\UserController::class);

        // --- Customer Management ---
        // GET    /api/admin/customers     → list semua nasabah
        // POST   /api/admin/customers     → buat rekening baru (auto-generate nomor rekening & QR)
        // GET    /api/admin/customers/{id}→ detail nasabah
        // PUT    /api/admin/customers/{id}→ edit data nasabah
        Route::apiResource('customers', \App\Http\Controllers\Admin\CustomerController::class);
    });

    Route::middleware('role:Teller')->prefix('teller')->group(function () {

        // GET  /api/teller/search?account_number=BMS-...
        // GET  /api/teller/search?qr_token=...
        Route::get('/search', [\App\Http\Controllers\Teller\TransactionController::class, 'search']);

        // POST /api/teller/deposit
        // Body: { "account_number": "BMS-2026-0001", "amount": 100000, "notes": "..." }
        Route::post('/deposit', [\App\Http\Controllers\Teller\TransactionController::class, 'deposit']);

        // POST /api/teller/withdraw
        // Body: { "account_number": "...", "amount": 50000, "security_pin": "123456" }
        Route::post('/withdraw', [\App\Http\Controllers\Teller\TransactionController::class, 'withdraw']);

        // POST /api/teller/reconciliation
        // Body: { "opening_balance": 500000, "actual_cash_on_hand": 750000 }
        Route::post('/reconciliation', [\App\Http\Controllers\Teller\ReconciliationController::class, 'submit']);

        // GET /api/teller/report/{id} → lihat detail laporan rekonsiliasi
        Route::get('/report/{id}', [\App\Http\Controllers\Teller\ReconciliationController::class, 'show']);
    });

    Route::middleware('role:Supervisor')->prefix('supervisor')->group(function () {
        // GET  /api/supervisor/reconciliations → list semua rekonsiliasi pending/disputed
        Route::get('/reconciliations', [\App\Http\Controllers\Supervisor\ReconciliationController::class, 'index']);
        // POST /api/supervisor/approve/{id} → setujui rekonsiliasi
        Route::post('/approve/{id}', [\App\Http\Controllers\Supervisor\ReconciliationController::class, 'approve']);
    });

    Route::middleware('role:Nasabah')->prefix('nasabah')->group(function () {

        // GET /api/nasabah/balance → cek saldo rekening sendiri
        Route::get('/balance', [\App\Http\Controllers\Nasabah\AccountController::class, 'balance']);
        // GET /api/nasabah/mutations → riwayat mutasi transaksi
        Route::get('/mutations', [\App\Http\Controllers\Nasabah\AccountController::class, 'mutations']);
    });
});