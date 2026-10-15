<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Saver;
use Illuminate\Http\Request;

class SaverController extends Controller
{
    public function index(Request $request)
    {
        $request->validate(['q' => 'nullable|string|max:100']);
        $query = Saver::with('member')->whereHas('member', fn ($member) => $member->where('account_status', 'active'))->orderByDesc('id');
        if ($request->filled('q')) {
            $query->where(function ($query) use ($request) {
                $query->where('account_number', 'like', '%'.$request->q.'%')->orWhereHas('member', fn ($member) => $member->where('student_number', 'like', '%'.$request->q.'%')->orWhere('full_name', 'like', '%'.$request->q.'%'));
            });
        }
        $rows = $query->paginate(25);
        $rows->getCollection()->transform(fn ($saver) => $saver->profile());
        return response()->json(['data' => $rows]);
    }
}