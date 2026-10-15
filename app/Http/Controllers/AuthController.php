<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    private function profile(User $user): array
    {
        return $user->only(['id', 'username', 'name', 'role', 'must_change_password', 'email', 'email_verified_at']);
    }

    public function login(Request $request)
    {
        $data = $request->validate(['username' => 'required|string|max:50', 'password' => 'required|string|max:100', 'client' => 'required|in:web,mobile']);
        $user = User::where('username', $data['username'])->first();
        $allowed = $data['client'] === 'mobile' ? ['student'] : ['admin', 'teller'];
        if (!$user || !$user->is_active || !in_array($user->role, $allowed, true) || !Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['username' => 'Akun, password, atau jenis aplikasi tidak sesuai.']);
        }
        $token = $user->createToken('bank-'.$data['client'], ['*'], now()->addHours(12))->plainTextToken;
        return response()->json(['data' => ['token' => $token, 'user' => $this->profile($user)]]);
    }

    public function me(Request $request)
    {
        return response()->json(['data' => $this->profile($request->user())]);
    }

    public function password(Request $request)
    {
        $data = $request->validate(['current_password' => 'required|string', 'password' => 'required|string|min:12|max:100|confirmed|different:current_password']);
        $user = $request->user();
        if (!Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages(['current_password' => 'Password saat ini tidak benar.']);
        }
        DB::transaction(function () use ($user, $data) {
            $user->update(['password' => $data['password'], 'must_change_password' => false]);
            DB::table('access_codes')->where('user_id', $user->id)->where('purpose', 'password_reset')->delete();
            $user->tokens()->where('id', '!=', $user->currentAccessToken()->id)->delete();
        });
        return response()->json(['data' => $this->profile($user->fresh())]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->noContent();
    }
}