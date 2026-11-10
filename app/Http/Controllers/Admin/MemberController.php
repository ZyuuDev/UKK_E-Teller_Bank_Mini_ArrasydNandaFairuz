<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Services\MemberService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MemberController extends Controller
{
    public function __construct(private MemberService $members)
    {
    }

    // 1. [Data Anggota] Menampilkan daftar seluruh data siswa dengan filter NIS, nama, jurusan, status
    public function index(Request $request)
    {
        $request->validate(['q' => 'nullable|string|max:100', 'graduation_year' => 'nullable|integer', 'major' => 'nullable|string|max:20', 'account_status' => 'nullable|in:active,inactive']);
        $query = Member::with('user:id,username,is_active')->orderBy('full_name');
        if ($request->filled('q')) {
            $query->where(function ($query) use ($request) {
                $term = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $request->q);
                $query->where('student_number', 'like', '%'.$term.'%')->orWhere('full_name', 'like', '%'.$term.'%');
            });
        }
        foreach (['graduation_year', 'major', 'account_status'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->input($field));
            }
        }
        return response()->json(['data' => $query->paginate(25)]);
    }

    // 2. [Data Anggota] Mendaftarkan akun siswa baru ke sistem bank mini
    public function store(Request $request)
    {
        $data = $request->validate([
            'student_number' => ['required', 'string', 'regex:/^[0-9]{1,20}$/', 'unique:members,student_number'],
            'full_name' => 'required|string|max:100',
            'graduation_year' => 'required|integer|between:2000,2200',
            'major' => 'nullable|string|max:20',
        ]);
        return response()->json(['data' => $this->members->create($data, $request->user()->id)], 201);
    }

    // 3. [Data Anggota] Memperbarui informasi data siswa
    public function update(Request $request, Member $member)
    {
        $data = $request->validate([
            'student_number' => ['required', 'string', 'regex:/^[0-9]{1,20}$/', Rule::unique('members', 'student_number')->ignore($member->user_id, 'user_id')],
            'full_name' => 'required|string|max:100',
            'graduation_year' => 'required|integer|between:2000,2200',
            'major' => 'nullable|string|max:20',
        ]);
        return response()->json(['data' => $this->members->update($member, $data, $request->user()->id)]);
    }

    // 4. [Data Anggota] Menghapus data siswa (hanya jika belum memiliki rekening aktif)
    public function destroy(Request $request, Member $member)
    {
        $this->members->delete($member, $request->user()->id);
        return response()->noContent();
    }

    public function credentials(Request $request, Member $member)
    {
        return response()->json(['data' => $this->members->issueCredentials($member, $request->user()->id)])->header('Cache-Control', 'no-store');
    }
}