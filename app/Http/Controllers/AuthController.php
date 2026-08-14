<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('username', $request->username)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'username' => ['Username atau password yang kamu masukkan salah.'],
            ]);
        }

        $user->tokens()->delete();
        $token = $user->createToken('auth_token_' . $user->role)->plainTextToken;
        return response()->json([
            'status'  => 'success',
            'message' => 'Login berhasil! Selamat datang, ' . $user->name,
            'data'    => [
                'token'      => $token,
                'token_type' => 'Bearer',
                'user'       => [
                    'id'       => $user->id,
                    'username' => $user->username,
                    'name'     => $user->name,
                    'role'     => $user->role,
                ],
            ],
        ], 200);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Logout berhasil. Sampai jumpa!',
        ], 200);
    }

    public function me(Request $request)
    {
        return response()->json([
            'status' => 'success',
            'data'   => $request->user(),
        ], 200);
    }
}