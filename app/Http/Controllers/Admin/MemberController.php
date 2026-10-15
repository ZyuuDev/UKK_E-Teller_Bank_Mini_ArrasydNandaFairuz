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

    public function index(Request $request)
    {
        $request->validate(['q' => 'nullable|string|max:100', 'graduation_year' => 'nullable|integer', 'account_status' => 'nullable|in:active,inactive']);
        $query = Member::with('user:id,username,is_active')->orderBy('full_name');
        if ($request->filled('q')) {
            $query->where(function ($query) use ($request) {
                $query->where('student_number', 'like', '%'.$request->q.'%')->orWhere('full_name', 'like', '%'.$request->q.'%');
            });
        }
        foreach (['graduation_year', 'account_status'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->input($field));
            }
        }
        return response()->json(['data' => $query->paginate(25)]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'student_number' => ['required', 'string', 'regex:/^[0-9]{1,20}$/', 'unique:members,student_number'],
            'full_name' => 'required|string|max:100',
            'graduation_year' => 'required|integer|between:2000,2200',
        ]);
        return response()->json(['data' => $this->members->create($data, $request->user()->id)], 201);
    }

    public function update(Request $request, Member $member)
    {
        $data = $request->validate([
            'student_number' => ['required', 'string', 'regex:/^[0-9]{1,20}$/', Rule::unique('members', 'student_number')->ignore($member->user_id, 'user_id')],
            'full_name' => 'required|string|max:100',
            'graduation_year' => 'required|integer|between:2000,2200',
        ]);
        return response()->json(['data' => $this->members->update($member, $data, $request->user()->id)]);
    }

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