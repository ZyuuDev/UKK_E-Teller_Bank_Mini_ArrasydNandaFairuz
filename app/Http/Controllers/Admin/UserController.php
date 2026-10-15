<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    public function index()
    {
        return response()->json(['data' => User::whereIn('role', ['admin', 'teller'])->orderBy('name')->get()]);
    }

    public function store(Request $request, AuditService $audit)
    {
        $data = $request->validate([
            'username' => 'required|string|max:50|unique:users,username',
            'name' => 'required|string|max:100',
            'password' => 'required|string|min:12|max:100',
            'role' => 'required|in:admin,teller',
        ]);
        $user = DB::transaction(function () use ($data, $request, $audit) {
            $user = User::create([...$data, 'is_active' => true, 'must_change_password' => true]);
            $audit->record($request->user()->id, 'staff.created', 'user', $user->id, ['role' => $user->role]);
            return $user;
        });
        return response()->json(['data' => $user], 201);
    }

    public function update(Request $request, User $user, AuditService $audit)
    {
        abort_unless(in_array($user->role, ['admin', 'teller'], true), 404);
        $data = $request->validate(['name' => 'required|string|max:100', 'is_active' => 'required|boolean']);
        abort_if($user->id === $request->user()->id && !$data['is_active'], 422, 'Akun sendiri tidak dapat dinonaktifkan.');
        DB::transaction(function () use ($request, $user, $data, $audit) {
            $user->update($data);
            if (!$user->is_active) {
                $user->tokens()->delete();
            }
            $audit->record($request->user()->id, 'staff.updated', 'user', $user->id, $data);
        });
        return response()->json(['data' => $user]);
    }

    public function studentAccess(Request $request, User $user, AuditService $audit)
    {
        abort_unless($user->role === 'student', 404);
        $data = $request->validate(['is_active' => 'required|boolean']);
        DB::transaction(function () use ($request, $user, $data, $audit) {
            $user->update($data);
            $user->tokens()->delete();
            $audit->record($request->user()->id, 'student.access_changed', 'user', $user->id, $data);
        });
        return response()->json(['data' => $user]);
    }
}