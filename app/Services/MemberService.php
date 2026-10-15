<?php

namespace App\Services;

use App\Models\Member;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class MemberService
{
    public function __construct(private AuditService $audit)
    {
    }

    public function create(array $data, int $actorId): Member
    {
        return DB::transaction(function () use ($data, $actorId) {
            $username = 's'.$data['student_number'];
            if (User::where('username', $username)->exists()) {
                throw ValidationException::withMessages(['student_number' => 'Username siswa sudah digunakan. Periksa akun yang ada.']);
            }

            $user = User::create([
                'username' => $username,
                'password' => Str::password(24),
                'name' => $data['full_name'],
                'role' => 'student',
                'is_active' => true,
                'must_change_password' => true,
            ]);
            $member = Member::create([
                'user_id' => $user->id,
                'student_number' => $data['student_number'],
                'full_name' => $data['full_name'],
                'graduation_year' => $data['graduation_year'],
                'account_status' => 'inactive',
            ]);
            $this->audit->record($actorId, 'member.created', 'member', $member->user_id);
            return $member->load('user:id,username,is_active');
        });
    }

    public function update(Member $member, array $data, int $actorId): Member
    {
        return DB::transaction(function () use ($member, $data, $actorId) {
            $member = Member::whereKey($member->user_id)->lockForUpdate()->firstOrFail();
            $before = $member->only(['student_number', 'full_name', 'graduation_year']);
            $member->update($data);
            $member->user->update(['name' => $member->full_name]);
            $this->audit->record($actorId, 'member.updated', 'member', $member->user_id, ['before' => $before, 'after' => $member->only(array_keys($before))]);
            return $member->load('user:id,username,is_active');
        });
    }

    public function delete(Member $member, int $actorId): void
    {
        DB::transaction(function () use ($member, $actorId) {
            $member = Member::whereKey($member->user_id)->lockForUpdate()->firstOrFail();
            if ($member->saver()->exists() || DB::table('audit_logs')->where('actor_id', $member->user_id)->exists()) {
                throw ValidationException::withMessages(['member' => 'Anggota mempunyai catatan rekening atau aktivitas yang dilindungi. Nonaktifkan layanan jika diperlukan.']);
            }
            $user = $member->user;
            $this->audit->record($actorId, 'member.deleted', 'member', $member->user_id);
            DB::table('access_codes')->where('user_id', $user->id)->delete();
            $user->tokens()->delete();
            $member->delete();
            $user->delete();
        });
    }

    public function issueCredentials(Member $member, int $actorId): array
    {
        return DB::transaction(function () use ($member, $actorId) {
            $user = User::whereKey($member->user_id)->lockForUpdate()->firstOrFail();
            $password = Str::password(16);
            $user->update(['password' => $password, 'must_change_password' => true]);
            DB::table('access_codes')->where('user_id', $user->id)->delete();
            $user->tokens()->delete();
            $this->audit->record($actorId, 'member.credentials_issued', 'member', $member->user_id);
            return ['username' => $user->username, 'temporary_password' => $password];
        });
    }
}