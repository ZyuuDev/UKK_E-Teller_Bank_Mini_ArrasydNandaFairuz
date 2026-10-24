<?php

namespace App\Http\Controllers;

use App\Jobs\RequestPinReset;
use App\Services\PinRecoveryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class PinRecoveryController extends Controller
{
    public function requestReset(Request $request)
    {
        $data = $request->validate(['email' => 'required|email:rfc|max:254']);
        $email = strtolower(trim($data['email']));
        $key = 'pin-request:'.hash_hmac('sha256', $email, config('app.key'));
        if (! RateLimiter::tooManyAttempts($key, 1)) {
            RateLimiter::hit($key, 60);
            RequestPinReset::dispatch($email);
        }

        return response()->json(['message' => 'Jika email siswa terverifikasi, akses aktif, dan rekening telah terbentuk, kode pemulihan PIN akan diproses. Periksa inbox dan spam.']);
    }

    public function reset(Request $request, PinRecoveryService $codes)
    {
        $data = $request->validate([
            'email' => 'required|email:rfc|max:254',
            'code' => 'required|string|digits:6',
            'login_password' => 'required|string|max:100',
            'pin' => 'required|string|digits:6|confirmed',
        ]);
        if (! $codes->reset(strtolower(trim($data['email'])), $data['code'], $data['login_password'], $data['pin'])) {
            throw ValidationException::withMessages([
                'code' => 'Pemulihan tidak dapat diverifikasi. Periksa kode, password login, masa berlaku, dan status akses rekening.',
            ]);
        }

        return response()->json(['message' => 'PIN diperbarui. Password login tetap sama. Sesi lama diakhiri; silakan masuk kembali.']);
    }
}