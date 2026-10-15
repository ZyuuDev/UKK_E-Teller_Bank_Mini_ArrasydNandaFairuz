<?php

namespace App\Services;

use App\Models\DailyReconciliation;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CashSessionService
{
    public function __construct(private AuditService $audit)
    {
    }

    public function summary(object $session): array
    {
        $deposits = (int) Transaction::where('cash_session_id', $session->id)->where('transaction_type', 'Deposit')->sum('amount');
        $withdrawals = (int) Transaction::where('cash_session_id', $session->id)->where('transaction_type', 'Withdrawal')->sum('amount');
        return [
            'id' => $session->id,
            'date' => $session->date,
            'status' => $session->status,
            'opening_balance' => (int) $session->opening_balance,
            'total_deposits' => $deposits,
            'total_withdrawals' => $withdrawals,
            'expected_closing_balance' => (int) $session->opening_balance + $deposits - $withdrawals,
        ];
    }

    public function open(int $tellerId, int $openingBalance): array
    {
        return DB::transaction(function () use ($tellerId, $openingBalance) {
            User::whereKey($tellerId)->lockForUpdate()->firstOrFail();
            $today = today()->toDateString();
            $previous = DB::table('cash_sessions')->where('teller_id', $tellerId)->where('date', '<', $today)->where('status', '!=', 'approved')->exists();
            abort_if($previous, 422, 'Selesaikan laporan hari sebelumnya dengan admin.');
            $session = DB::table('cash_sessions')->where('teller_id', $tellerId)->where('date', $today)->first();
            if ($session) {
                abort_if((int) $session->opening_balance !== $openingBalance, 409, 'Saldo awal sesi sudah ditetapkan.');
                return $this->summary($session);
            }
            $id = DB::table('cash_sessions')->insertGetId(['teller_id' => $tellerId, 'date' => $today, 'opening_balance' => $openingBalance, 'status' => 'open', 'created_at' => now(), 'updated_at' => now()]);
            if ($openingBalance > 0) {
                foreach ([['account_code' => '101', 'entry_type' => 'Debit'], ['account_code' => '102', 'entry_type' => 'Credit']] as $entry) {
                    DB::table('journal_entries')->insert([...$entry, 'transaction_id' => null, 'cash_transfer_id' => null, 'cash_session_id' => $id, 'amount' => $openingBalance, 'created_at' => now(), 'updated_at' => now()]);
                }
            }
            $this->audit->record($tellerId, 'cash_session.opened', 'cash_session', $id, ['opening_balance' => $openingBalance]);
            return $this->summary(DB::table('cash_sessions')->find($id));
        }, 5);
    }

    public function submit(int $sessionId, int $tellerId, int $actualCash): DailyReconciliation
    {
        return DB::transaction(function () use ($sessionId, $tellerId, $actualCash) {
            $session = DB::table('cash_sessions')->where('id', $sessionId)->where('teller_id', $tellerId)->lockForUpdate()->first();
            abort_unless($session, 404);
            abort_unless($session->status === 'open', 409, 'Sesi sudah diajukan atau disetujui.');
            $summary = $this->summary($session);
            $difference = $actualCash - $summary['expected_closing_balance'];
            $report = DailyReconciliation::where('cash_session_id', $sessionId)->lockForUpdate()->first();
            abort_if($report && $report->status !== 'rejected', 409, 'Laporan sebelumnya belum dikembalikan admin.');
            $data = [
                'cash_session_id' => $sessionId,
                'teller_id' => $tellerId,
                'date' => $session->date,
                'opening_balance' => $summary['opening_balance'],
                'total_deposits' => $summary['total_deposits'],
                'total_withdrawals' => $summary['total_withdrawals'],
                'expected_closing_balance' => $summary['expected_closing_balance'],
                'actual_cash_on_hand' => $actualCash,
                'discrepancy' => $difference,
                'status' => $difference === 0 ? 'pending' : 'disputed',
                'approved_by' => null,
                'approved_at' => null,
                'rejected_by' => null,
                'rejected_at' => null,
                'rejection_reason' => null,
            ];
            if ($report) {
                $report->update($data);
            } else {
                $report = DailyReconciliation::create($data);
            }
            DB::table('cash_sessions')->where('id', $sessionId)->update(['status' => 'submitted', 'updated_at' => now()]);
            $this->audit->record($tellerId, 'reconciliation.submitted', 'daily_reconciliation', $report->id, $data);
            return $report;
        }, 5);
    }

    public function review(int $reportId, int $adminId, bool $approve, ?string $reason): DailyReconciliation
    {
        return DB::transaction(function () use ($reportId, $adminId, $approve, $reason) {
            $initial = DailyReconciliation::findOrFail($reportId);
            abort_unless($initial->cash_session_id, 422, 'Laporan sebelum revisi hanya dapat dibaca sebagai arsip.');
            $session = DB::table('cash_sessions')->where('id', $initial->cash_session_id)->lockForUpdate()->first();
            $report = DailyReconciliation::whereKey($reportId)->lockForUpdate()->firstOrFail();
            abort_unless($session->status === 'submitted' && in_array($report->status, ['pending', 'disputed'], true), 409, 'Status laporan tidak dapat diproses ulang.');
            if (!$approve) {
                $report->update(['status' => 'rejected', 'rejected_by' => $adminId, 'rejected_at' => now(), 'rejection_reason' => $reason]);
                DB::table('cash_sessions')->where('id', $session->id)->update(['status' => 'open', 'updated_at' => now()]);
                $this->audit->record($adminId, 'reconciliation.rejected', 'daily_reconciliation', $report->id, ['reason' => $reason]);
                return $report;
            }
            abort_unless($report->status === 'pending' && $report->discrepancy === 0, 422, 'Selesaikan selisih sebelum persetujuan.');
            $amount = $report->expected_closing_balance;
            abort_if($amount < 0, 422, 'Kas akhir tidak boleh negatif.');
            $transferId = DB::table('cash_transfers')->insertGetId(['daily_reconciliation_id' => $report->id, 'approved_by' => $adminId, 'amount' => $amount, 'created_at' => now(), 'updated_at' => now()]);
            if ($amount > 0) {
                foreach ([['account_code' => '102', 'entry_type' => 'Debit'], ['account_code' => '101', 'entry_type' => 'Credit']] as $entry) {
                    DB::table('journal_entries')->insert([...$entry, 'transaction_id' => null, 'cash_transfer_id' => $transferId, 'amount' => $amount, 'created_at' => now(), 'updated_at' => now()]);
                }
            }
            $report->update(['status' => 'approved', 'approved_by' => $adminId, 'approved_at' => now()]);
            DB::table('cash_sessions')->where('id', $session->id)->update(['status' => 'approved', 'updated_at' => now()]);
            $this->audit->record($adminId, 'reconciliation.approved', 'daily_reconciliation', $report->id, ['cash_transfer_id' => $transferId, 'amount' => $amount]);
            return $report;
        }, 5);
    }
}