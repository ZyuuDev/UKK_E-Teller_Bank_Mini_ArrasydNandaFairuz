<?php

namespace App\Services;

use App\Models\CashRequest;
use App\Models\DailyReconciliation;
use App\Models\Transaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
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
        $additional = 0;
        if (Schema::hasTable('cash_requests')) {
            $additional = (int) DB::table('cash_requests')
                ->where('cash_session_id', $session->id)
                ->where('status', 'approved')
                ->sum('amount');
        }
        $latestReport = DailyReconciliation::where('cash_session_id', $session->id)->first();

        return [
            'id' => $session->id,
            'date' => $session->date,
            'status' => $session->status,
            'opening_balance' => (int) $session->opening_balance,
            'total_deposits' => $deposits,
            'total_withdrawals' => $withdrawals,
            'total_additional_cash' => $additional,
            'expected_closing_balance' => (int) $session->opening_balance + $additional + $deposits - $withdrawals,
            'reconciliation_status' => $latestReport?->status,
            'rejection_reason' => $latestReport?->rejection_reason,
        ];
    }

    public function getOperatingHours(): array
    {
        return [
            'open_time' => (string) config('bank.operating_hours.open_time', '07:30'),
            'close_time' => (string) config('bank.operating_hours.close_time', '17:00'),
            'timezone' => (string) config('bank.operating_hours.timezone', 'Asia/Jakarta'),
        ];
    }

    public function isOperatingHoursEnforced(): bool
    {
        if (app()->environment('testing') && !config('bank.operating_hours.enforce_in_testing', false)) {
            return false;
        }
        return (bool) config('bank.operating_hours.enforce', true);
    }

    public function isPastClosingTime(?\DateTimeInterface $referenceTime = null): bool
    {
        if (!$this->isOperatingHoursEnforced()) {
            return false;
        }

        $tz = config('bank.operating_hours.timezone', 'Asia/Jakarta');
        $now = $referenceTime ? Carbon::parse($referenceTime)->setTimezone($tz) : now($tz);
        $closeTime = config('bank.operating_hours.close_time', '17:00');

        return $now->format('H:i') >= $closeTime;
    }

    public function autoCloseForgottenSessions(?\DateTimeInterface $referenceTime = null): int
    {
        $tz = config('bank.operating_hours.timezone', 'Asia/Jakarta');
        $now = $referenceTime ? Carbon::parse($referenceTime)->setTimezone($tz) : now($tz);
        $today = $now->toDateString();
        $currentTimeStr = $now->format('H:i');
        $closeTimeStr = config('bank.operating_hours.close_time', '17:00');
        $isPastClosing = $currentTimeStr >= $closeTimeStr;

        $query = DB::table('cash_sessions')
            ->where('status', 'open')
            ->whereNotExists(function ($sub) {
                $sub->select(DB::raw(1))
                    ->from('daily_reconciliations')
                    ->whereColumn('daily_reconciliations.cash_session_id', 'cash_sessions.id')
                    ->where('daily_reconciliations.status', 'rejected');
            })
            ->where(function ($q) use ($today, $isPastClosing) {
                // Sesi hari sebelumnya yang belum ditutup
                $q->where('date', '<', $today);
                // Sesi hari ini jika jam sudah mencapai atau melewati jam tutup (17:00 WIB)
                if ($isPastClosing) {
                    $q->orWhere('date', $today);
                }
            });

        $sessionsToClose = $query->get();
        $closedCount = 0;

        foreach ($sessionsToClose as $session) {
            DB::transaction(function () use ($session, &$closedCount) {
                $locked = DB::table('cash_sessions')
                    ->where('id', $session->id)
                    ->lockForUpdate()
                    ->first();

                if (!$locked || $locked->status !== 'open') {
                    return;
                }

                $summary = $this->summary($locked);
                $actualCash = 0; // Uang fisik dicatat Rp 0 sesuai ketentuan auto-close
                $discrepancy = 0 - $summary['expected_closing_balance'];

                $report = DailyReconciliation::where('cash_session_id', $locked->id)
                    ->lockForUpdate()
                    ->first();

                $autoCloseNote = 'Sesi kas ditutup otomatis oleh sistem pada pukul 17:00 WIB karena teller belum melakukan tutup kas loket. Uang fisik tercatat Rp 0 dan memerlukan verifikasi fisik kas oleh Supervisor.';

                $data = [
                    'cash_session_id' => $locked->id,
                    'teller_id' => $locked->teller_id,
                    'date' => $locked->date,
                    'opening_balance' => $summary['opening_balance'],
                    'total_deposits' => $summary['total_deposits'],
                    'total_withdrawals' => $summary['total_withdrawals'],
                    'expected_closing_balance' => $summary['expected_closing_balance'],
                    'actual_cash_on_hand' => $actualCash,
                    'discrepancy' => $discrepancy,
                    'status' => 'disputed',
                    'approved_by' => null,
                    'approved_at' => null,
                    'rejected_by' => null,
                    'rejected_at' => null,
                    'rejection_reason' => $autoCloseNote,
                ];

                if ($report) {
                    $report->update($data);
                } else {
                    $report = DailyReconciliation::create($data);
                }

                DB::table('cash_sessions')->where('id', $locked->id)->update([
                    'status' => 'submitted',
                    'updated_at' => now(),
                ]);

                $this->audit->record($locked->teller_id, 'cash_session.auto_closed', 'daily_reconciliation', $report->id, [
                    'reason' => 'Auto-closed at 17:00 WIB',
                    'expected_closing_balance' => $summary['expected_closing_balance'],
                    'actual_cash_on_hand' => 0,
                    'discrepancy' => $discrepancy,
                ]);

                $closedCount++;
            }, 5);
        }

        return $closedCount;
    }

    public function open(int $tellerId, int $openingBalance): array
    {
        $this->autoCloseForgottenSessions();

        abort_if(
            $this->isPastClosingTime(),
            422,
            'Loket pelayanan kas telah ditutup untuk hari ini (Batas operasional 17:00 WIB).'
        );

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
        $this->autoCloseForgottenSessions();
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

    public function approveCashRequest(int $requestId, int $adminId): array
    {
        return DB::transaction(function () use ($requestId, $adminId) {
            $request = CashRequest::whereKey($requestId)->lockForUpdate()->firstOrFail();
            abort_if($request->status !== 'pending', 409, 'Pengajuan kas sudah diproses sebelumnya.');

            $request->update([
                'status' => 'approved',
                'approved_by' => $adminId,
                'approved_at' => now(),
            ]);

            if ($request->cash_session_id && (int) $request->amount > 0) {
                foreach ([['account_code' => '101', 'entry_type' => 'Debit'], ['account_code' => '102', 'entry_type' => 'Credit']] as $entry) {
                    DB::table('journal_entries')->insert([
                        ...$entry,
                        'transaction_id' => null,
                        'cash_transfer_id' => null,
                        'cash_session_id' => $request->cash_session_id,
                        'amount' => $request->amount,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            $this->audit->record($adminId, 'cash_request.approved', 'cash_request', $request->id, [
                'amount' => $request->amount,
                'teller_id' => $request->teller_id,
            ]);

            return $request->toArray();
        }, 5);
    }

    public function rejectCashRequest(int $requestId, int $adminId, string $notes): array
    {
        return DB::transaction(function () use ($requestId, $adminId, $notes) {
            $request = CashRequest::whereKey($requestId)->lockForUpdate()->firstOrFail();
            abort_if($request->status !== 'pending', 409, 'Pengajuan kas sudah diproses sebelumnya.');

            $request->update([
                'status' => 'rejected',
                'rejection_notes' => $notes,
                'approved_by' => $adminId,
                'approved_at' => now(),
            ]);

            $this->audit->record($adminId, 'cash_request.rejected', 'cash_request', $request->id, [
                'rejection_notes' => $notes,
            ]);

            return $request->toArray();
        }, 5);
    }
}
