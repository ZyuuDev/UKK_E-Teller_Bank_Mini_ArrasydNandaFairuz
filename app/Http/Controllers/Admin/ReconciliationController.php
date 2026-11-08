<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CashRequest;
use App\Models\DailyReconciliation;
use App\Services\CashSessionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReconciliationController extends Controller
{
    public function index(Request $request, CashSessionService $sessions)
    {
        $sessions->autoCloseForgottenSessions();
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

    public function cashRequests(Request $request)
    {
        $request->validate(['status' => 'nullable|in:pending,approved,rejected']);
        $query = CashRequest::with('teller:id,name', 'approver:id,name')->orderByDesc('date')->orderByDesc('id');
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        return response()->json(['data' => $query->paginate(25)]);
    }

    public function approveCashRequest(Request $request, int $id, CashSessionService $sessions)
    {
        return response()->json(['data' => $sessions->approveCashRequest($id, $request->user()->id)]);
    }

    public function rejectCashRequest(Request $request, int $id, CashSessionService $sessions)
    {
        $data = $request->validate(['reason' => 'required|string|min:3|max:255']);
        return response()->json(['data' => $sessions->rejectCashRequest($id, $request->user()->id, $data['reason'])]);
    }

    public function journals(Request $request)
    {
        $request->validate([
            'q' => 'nullable|string|max:100',
            'account_code' => 'nullable|string|max:20',
            'entry_type' => 'nullable|in:Debit,Credit',
            'date' => 'nullable|date_format:Y-m-d',
        ]);

        $query = DB::table('journal_entries')->orderByDesc('id');

        if ($request->filled('q')) {
            $raw = trim((string) $request->q);
            $num = preg_replace('/[^0-9]/', '', $raw);
            $query->where(function ($q) use ($raw, $num) {
                $q->where('account_code', 'like', '%' . $raw . '%');
                if ($num !== '') {
                    $q->orWhere('id', (int) $num)
                        ->orWhere('transaction_id', (int) $num)
                        ->orWhere('cash_transfer_id', (int) $num)
                        ->orWhere('cash_session_id', (int) $num);
                }
            });
        }

        if ($request->filled('account_code')) {
            $query->where('account_code', $request->account_code);
        }

        if ($request->filled('entry_type')) {
            $query->where('entry_type', $request->entry_type);
        }

        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }

        return response()->json(['data' => $query->paginate(50)]);
    }

    public function audit(Request $request)
    {
        $request->validate([
            'q' => 'nullable|string|max:100',
            'search' => 'nullable|string|max:100',
            'action' => 'nullable|string|max:100',
            'role' => 'nullable|in:admin,teller,student',
            'date' => 'nullable|date_format:Y-m-d',
        ]);

        $query = DB::table('audit_logs')
            ->leftJoin('users', 'audit_logs.actor_id', '=', 'users.id')
            ->select([
                'audit_logs.id',
                'audit_logs.actor_id',
                'users.name as actor_name',
                'users.username as actor_username',
                'users.role as actor_role',
                'audit_logs.action',
                'audit_logs.subject_type',
                'audit_logs.subject_id',
                'audit_logs.details',
                'audit_logs.created_at',
            ])
            ->orderByDesc('audit_logs.id');

        $keyword = trim((string) ($request->q ?: $request->search ?: ''));
        if ($keyword !== '') {
            $search = '%' . $keyword . '%';
            $query->where(function ($q) use ($search, $keyword) {
                $q->where('users.name', 'like', $search)
                    ->orWhere('users.username', 'like', $search)
                    ->orWhere('audit_logs.action', 'like', $search)
                    ->orWhere('audit_logs.subject_type', 'like', $search);
                if (ctype_digit($keyword)) {
                    $q->orWhere('audit_logs.id', (int) $keyword)
                        ->orWhere('audit_logs.subject_id', (int) $keyword);
                }
            });
        }

        if ($request->filled('action')) {
            $query->where('audit_logs.action', 'like', $request->action . '%');
        }

        if ($request->filled('role')) {
            $query->where('users.role', $request->role);
        }

        if ($request->filled('date')) {
            $query->whereDate('audit_logs.created_at', $request->date);
        }

        return response()->json(['data' => $query->paginate(50)]);
    }
}
