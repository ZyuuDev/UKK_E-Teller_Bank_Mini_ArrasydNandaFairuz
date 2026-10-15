<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DailyReconciliation;
use App\Services\CashSessionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReconciliationController extends Controller
{
    public function index(Request $request)
    {
        $request->validate(['status' => 'nullable|in:pending,approved,disputed,rejected']);
        $query = DailyReconciliation::with('teller:id,name', 'approver:id,name')->orderByDesc('date')->orderByDesc('id');
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        return response()->json(['data' => $query->paginate(25)]);
    }

    public function approve(Request $request, int $report, CashSessionService $sessions)
    {
        return response()->json(['data' => $sessions->review($report, $request->user()->id, true, null)]);
    }

    public function reject(Request $request, int $report, CashSessionService $sessions)
    {
        $data = $request->validate(['reason' => 'required|string|min:5|max:1000']);
        return response()->json(['data' => $sessions->review($report, $request->user()->id, false, $data['reason'])]);
    }

    public function journals()
    {
        return response()->json(['data' => DB::table('journal_entries')->orderByDesc('id')->paginate(50)]);
    }

    public function audit()
    {
        return response()->json(['data' => DB::table('audit_logs')->orderByDesc('id')->paginate(50)]);
    }
}