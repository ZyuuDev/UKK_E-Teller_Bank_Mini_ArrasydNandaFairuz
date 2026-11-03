<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Saver;
use App\Services\AuditService;
use Illuminate\Http\Request;

class SaverController extends Controller
{
    public function index(Request $request)
    {
        $request->validate(['q' => 'nullable|string|max:100']);
        $query = Saver::with('member.user')->whereHas('member', fn ($member) => $member->where('account_status', 'active'))->orderByDesc('id');
        if ($request->filled('q')) {
            $query->where(function ($query) use ($request) {
                $term = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $request->q);
                $query->where('account_number', 'like', '%'.$term.'%')->orWhereHas('member', fn ($member) => $member->where('student_number', 'like', '%'.$term.'%')->orWhere('full_name', 'like', '%'.$term.'%'));
            });
        }
        $rows = $query->paginate(25);
        $rows->getCollection()->transform(fn ($saver) => $saver->profile());

        return response()->json(['data' => $rows]);
    }

    public function resetPin(Request $request, int $id, AuditService $audit)
    {
        $saver = Saver::with('member')->findOrFail($id);
        $saver->update(['security_pin' => '123456']);
        $audit->record($request->user()->id, 'saver.pin_reset', 'saver', $saver->id, [
            'account_number' => $saver->account_number,
            'by_role' => 'admin',
        ]);

        return response()->json([
            'data' => [
                'message' => 'PIN rekening ' . $saver->account_number . ' (' . $saver->member->full_name . ') berhasil direset ke PIN default 123456.',
            ],
        ]);
    }
}
