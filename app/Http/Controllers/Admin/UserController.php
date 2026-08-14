<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /*
     * Method: GET
     * URL: /api/admin/users
     */
    public function index()
    {
        // Ambil semua user, urutkan dari terbaru
        $users = User::orderBy('created_at', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data'   => $users,
        ], 200);
    }

    /**
     * Method: POST
     * URL: /api/admin/users
     * Body: { "username": "...", "password": "...", "name": "...", "role": "..." }
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'username' => 'required|string|max:50|unique:users,username',
            'password' => 'required|string|min:6',
            'name'     => 'required|string|max:100',
            'role'     => 'required|in:Administrator,Teller,Supervisor,Nasabah',
        ]);

        $user = User::create($validated);

        return response()->json([
            'status'  => 'success',
            'message' => 'User berhasil dibuat.',
            'data'    => $user,
        ], 201);
    }

    /**
     * Method: GET
     * URL: /api/admin/users/{id}
     */
    public function show(string $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'status'  => 'error',
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data'   => $user,
        ], 200);
    }

    /**
     * Method: PUT/PATCH
     * URL: /api/admin/users/{id}
     * Body: { "name": "...", "role": "...", "password": "..." (opsional) }
     */
    public function update(Request $request, string $id)
    {
        // 1. Cari user
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'status'  => 'error',
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        // 2. Validasi input
        //    Username harus unik kec untuk user ini sendiri
        $validated = $request->validate([
            'username' => 'sometimes|string|max:50|unique:users,username,' . $id,
            'password' => 'sometimes|string|min:6',
            'name'     => 'sometimes|string|max:100',
            'role'     => 'sometimes|in:Administrator,Teller,Supervisor,Nasabah',
        ]);

        // 3. Update data user
        $user->update($validated);

        // 4. Response sukses
        return response()->json([
            'status'  => 'success',
            'message' => 'User berhasil diperbarui.',
            'data'    => $user,
        ], 200);
    }

    /**
     * Method: DELETE
     * URL: /api/admin/users/{id}
     */
    public function destroy(string $id)
    {
        // 1. Cari user
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'status'  => 'error',
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        // 2. Jangan izinkan admin menghapus dirinya sendiri
        if ($user->id === auth()->id()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Tidak bisa menghapus akun sendiri.',
            ], 403);
        }

        // 3. Coba hapus — jika gagal karena FK RESTRICT, tangkap error
        try {
            $user->delete();
        } catch (\Illuminate\Database\QueryException $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'User tidak bisa dihapus karena masih memiliki data terkait (nasabah/transaksi/rekonsiliasi).',
            ], 409);
        }

        // 4. Response sukses
        return response()->json([
            'status'  => 'success',
            'message' => 'User berhasil dihapus.',
        ], 200);
    }
}