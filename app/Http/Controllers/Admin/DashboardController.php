<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CashRequest;
use App\Models\DailyReconciliation;
use App\Models\Member;
use App\Models\Pengaturan;
use App\Models\Saver;
use App\Models\Transaction;
use App\Services\CashSessionService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats(Request $request, CashSessionService $sessions)
    {
        $sessions->autoCloseForgottenSessions();

        $tz = config('bank.operating_hours.timezone', 'Asia/Jakarta');
        $now = now($tz);
        $today = $now->toDateString();
        $timeStr = $now->format('H:i');
        $openTime = config('bank.operating_hours.open_time', '07:30');
        $closeTime = config('bank.operating_hours.close_time', '17:00');

        $isWithinHours = $timeStr >= $openTime && $timeStr < $closeTime;
        $dbStatus = Pengaturan::getStatusLayanan();
        $effectiveStatus = $dbStatus;
        if (! $isWithinHours && $dbStatus === 'buka') {
            $effectiveStatus = 'tutup';
        }

        // Financial & membership metrics
        $totalDepositPool = (int) Saver::sum('balance');
        $activeSaversCount = (int) Saver::whereHas('member', fn ($m) => $m->where('account_status', 'active'))->count();
        $totalMembersCount = (int) Member::count();
        $activationRate = $totalMembersCount > 0 ? round(($activeSaversCount / $totalMembersCount) * 100, 1) : 0.0;

        // Today's cash movement
        $todayTotals = DB::table('transactions')
            ->where('date', $today)
            ->selectRaw("
                COUNT(*) as entries,
                COALESCE(SUM(CASE WHEN transaction_type = 'Deposit' THEN amount ELSE 0 END), 0) as deposits,
                COALESCE(SUM(CASE WHEN transaction_type = 'Withdrawal' THEN amount ELSE 0 END), 0) as withdrawals
            ")
            ->first();

        $todayDeposits = (int) ($todayTotals->deposits ?? 0);
        $todayWithdrawals = (int) ($todayTotals->withdrawals ?? 0);
        $todayNetFlow = $todayDeposits - $todayWithdrawals;
        $todayEntries = (int) ($todayTotals->entries ?? 0);

        // Active teller sessions today
        $activeSessions = DB::table('cash_sessions')
            ->join('users', 'cash_sessions.teller_id', '=', 'users.id')
            ->where('cash_sessions.date', $today)
            ->select([
                'cash_sessions.id',
                'cash_sessions.teller_id',
                'users.name as teller_name',
                'users.username as teller_username',
                'cash_sessions.opening_balance',
                'cash_sessions.status',
                'cash_sessions.created_at',
            ])
            ->orderBy('cash_sessions.id')
            ->get();

        // Urgent alerts
        $pendingReconciliations = DailyReconciliation::where('status', 'pending')->count();
        $disputedReconciliations = DailyReconciliation::where('status', 'disputed')->count();
        $pendingCashRequests = CashRequest::where('status', 'pending')->count();

        // 7-day trend
        $sevenDaysAgo = $now->copy()->subDays(6)->toDateString();
        $groupedTrend = DB::table('transactions')
            ->where('date', '>=', $sevenDaysAgo)
            ->where('date', '<=', $today)
            ->groupBy('date')
            ->selectRaw("
                date,
                COALESCE(SUM(CASE WHEN transaction_type = 'Deposit' THEN amount ELSE 0 END), 0) as deposits,
                COALESCE(SUM(CASE WHEN transaction_type = 'Withdrawal' THEN amount ELSE 0 END), 0) as withdrawals,
                COUNT(*) as total_count
            ")
            ->get()
            ->keyBy('date');

        $trendDays = [];
        $dayNames = [
            0 => 'Min',
            1 => 'Sen',
            2 => 'Sel',
            3 => 'Rab',
            4 => 'Kam',
            5 => 'Jum',
            6 => 'Sab',
        ];

        for ($i = 6; $i >= 0; $i--) {
            $dayDate = $now->copy()->subDays($i);
            $dStr = $dayDate->toDateString();
            $dOfWeek = (int) $dayDate->dayOfWeek;
            $label = ($dayNames[$dOfWeek] ?? $dayDate->format('D')) . ', ' . $dayDate->format('d/m');
            $rec = $groupedTrend->get($dStr);

            $trendDays[] = [
                'date' => $dStr,
                'label' => $label,
                'deposits' => (int) ($rec->deposits ?? 0),
                'withdrawals' => (int) ($rec->withdrawals ?? 0),
                'count' => (int) ($rec->total_count ?? 0),
            ];
        }

        // Recent 5 transactions
        $recentTransactions = Transaction::with('teller:id,name,username')
            ->orderByDesc('id')
            ->limit(5)
            ->get()
            ->map(function ($tx) {
                return [
                    'id' => $tx->id,
                    'transaction_type' => $tx->transaction_type,
                    'amount' => (int) $tx->amount,
                    'balance_after' => (int) $tx->balance_after,
                    'account_number' => $tx->snapshot_account_number,
                    'member_name' => $tx->snapshot_member_name,
                    'date' => $tx->date ? $tx->date->format('Y-m-d') : null,
                    'created_at' => $tx->created_at ? $tx->created_at->toIso8601String() : null,
                    'teller_name' => $tx->teller?->name ?? 'Teller Loket',
                ];
            });

        // Recent 5 audit logs
        $recentAuditLogs = DB::table('audit_logs')
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
            ->orderByDesc('audit_logs.id')
            ->limit(5)
            ->get();

        return response()->json([
            'data' => [
                'financials' => [
                    'total_deposit_pool' => $totalDepositPool,
                    'active_savers_count' => $activeSaversCount,
                    'total_members_count' => $totalMembersCount,
                    'activation_rate_pct' => $activationRate,
                    'today_deposits' => $todayDeposits,
                    'today_withdrawals' => $todayWithdrawals,
                    'today_net_flow' => $todayNetFlow,
                    'today_transactions_count' => $todayEntries,
                ],
                'counter_status' => [
                    'status' => $effectiveStatus,
                    'manual_status' => $dbStatus,
                    'operating_hours' => "{$openTime} - {$closeTime} WIB",
                    'is_open' => $effectiveStatus === 'buka',
                    'active_sessions' => $activeSessions,
                ],
                'urgent_alerts' => [
                    'pending_reconciliations' => $pendingReconciliations,
                    'disputed_reconciliations' => $disputedReconciliations,
                    'pending_cash_requests' => $pendingCashRequests,
                    'total_attention_required' => $pendingReconciliations + $disputedReconciliations + $pendingCashRequests,
                ],
                'trend_7_days' => $trendDays,
                'recent_transactions' => $recentTransactions,
                'recent_audit_logs' => $recentAuditLogs,
            ],
        ]);
    }
}

