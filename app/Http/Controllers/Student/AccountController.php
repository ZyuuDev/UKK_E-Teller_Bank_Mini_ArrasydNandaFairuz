<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    public function profile(Request $request)
    {
        $member = $request->user()->member()->with('saver')->firstOrFail();
        return response()->json(['data' => ['member' => $member->only(['user_id', 'student_number', 'full_name', 'graduation_year', 'account_status']), 'saver' => $member->account_status === 'active' ? $member->saver?->profile() : null]]);
    }

    public function mutations(Request $request)
    {
        $member = $request->user()->member()->with('saver')->firstOrFail();
        $rows = Transaction::where('saver_id', $member->saver?->id ?? 0)->orderByDesc('id')->paginate(25);
        $rows->getCollection()->transform(fn ($transaction) => $transaction->receipt());
        return response()->json(['data' => $rows]);
    }
}