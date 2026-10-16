<?php

namespace App\Http\Controllers;

use App\Jobs\RequestPasswordReset;
use App\Models\User;
use App\Services\AccessCodeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class RecoveryController extends Controller
{
    public function requestReset(Request $request)
    {
        $data = $request->validate(['email' => 'required|email:rfc|max:254']);
        $email = strtolower(trim($data['email']));
        $key = 'reset-request:'.hash_hmac('sha256', $email, config('app.key'));
        if (!RateLimiter::tooManyAttempts($key, 1)) {
            RateLimiter::hit($key, 60);
            RequestPasswordReset::dispatch($email);
        }
        return response()->json(['message' => 'Jika email terdaftar dan telah diverifikasi, permintaan kode akan diproses. Periksa inbox dan spam.']);
    }

    public function reset(Request $request, AccessCodeService $codes)
    {
        $data = $request->validate(['email' => 'required|email:rfc|max:254', 'code' => 'required|string|digits:6', 'password' => 'required|string|min:12|max:100|confirmed']);
        if (!$codes->consume(strtolower(trim($data['email'])), 'password_reset', $data['code'], $data['password'])) {
            throw ValidationException::withMessages(['code' => 'Kode tidak valid, sudah digunakan, atau kedaluwarsa.']);
        }
        return response()->json(['message' => 'Password diperbarui. Silakan login kembali.']);
    }

    public function requestVerification(Request $request, AccessCodeService $codes)
    {
        $user = $request->user();
        $request->merge(['email' => strtolower(trim((string) $request->input('email')))]);
        $data = $request->validate(['email' => ['required', 'email:rfc', 'max:254', Rule::unique('users', 'email')->ignore($user->id)], 'current_password' => 'required|string']);
        if (!Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages(['current_password' => 'Password saat ini tidak benar.']);
        }
        DB::transaction(function () use ($user, $data) {
            $current = User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            if ($current->email !== $data['email']) {
                $current->update(['email' => $data['email'], 'email_verified_at' => null]);
                DB::table('access_codes')->where('user_id', $current->id)->delete();
            }
        });
        $codes->issue($user->fresh(), 'email_verification');
        return response()->json(['message' => 'Permintaan kode verifikasi email diproses.']);
    }

    public function verifyEmail(Request $request, AccessCodeService $codes)
    {
        $data = $request->validate(['code' => 'required|string|digits:6']);
        $user = $request->user();
        if (!$user->email || !$codes->consume($user->email, 'email_verification', $data['code'], expectedUserId: $user->id)) {
            throw ValidationException::withMessages(['code' => 'Kode tidak valid, sudah digunakan, atau kedaluwarsa.']);
        }
        return response()->json(['message' => 'Email sudah diverifikasi.']);
    }
}