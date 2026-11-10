<?php

namespace App\Services;

use App\Models\Member;
use App\Models\Saver;
use App\Models\Transaction;
use App\Models\WithdrawalAppointment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class BankingService
{
    public function __construct(private AuditService $audit)
    {
    }

    // Validasi pesan error dan lempar ValidationException
    private function reject(string $field, string $message): never
    {
        throw ValidationException::withMessages([$field => $message]);
    }

    // Validasi sesi kas loket teller (wajib open dan belum ditutup)
    private function session(int $tellerId): object
    {
        app(CashSessionService::class)->autoCloseForgottenSessions();
        $session = DB::table('cash_sessions')->where('teller_id', $tellerId)->where('date', today()->toDateString())->lockForUpdate()->first();
        if (!$session) {
            $this->reject('session', 'Buka sesi kas hari ini terlebih dahulu.');
        }
        if ($session->status !== 'open') {
            $this->reject('session', 'Sesi kas telah ditutup untuk hari ini (Auto-Close 17:00 WIB). Tidak dapat memproses transaksi.');
        }
        return $session;
    }

    // Idempotency check: cegah double submit dengan request_id yang sama
    private function replay(string $requestId, int $tellerId, int $memberId, int $amount, string $type): ?Transaction
    {
        $transaction = Transaction::with('saver')->where('request_id', $requestId)->first();
        if (!$transaction) {
            return null;
        }
        if ($transaction->teller_id !== $tellerId || $transaction->saver->user_id !== $memberId || $transaction->amount !== $amount || $transaction->transaction_type !== $type) {
            $this->reject('request_id', 'Identitas permintaan sudah digunakan untuk transaksi berbeda.');
        }
        return $transaction;
    }

    private function ensureOpen(object $session): void
    {
        if ($session->status !== 'open') {
            $this->reject('session', 'Sesi sudah diajukan atau ditutup. Transaksi baru tidak diizinkan.');
        }
    }

    private function ensureAmount(int $amount): void
    {
        if ($amount < 1 || $amount > config('bank.maximum_transaction')) {
            $this->reject('amount', 'Nominal di luar batas transaksi.');
        }
    }

    // Generator nomor rekening unik tahunan (format: BMS-YYYY-XXXX)
    private function accountNumber(): string
    {
        $year = (int) now()->format('Y');
        DB::table('account_sequences')->insertOrIgnore(['year' => $year, 'next_number' => 1]);
        $sequence = DB::table('account_sequences')->where('year', $year)->lockForUpdate()->first();
        DB::table('account_sequences')->where('year', $year)->increment('next_number');
        return 'BMS-'.$year.'-'.str_pad((string) $sequence->next_number, 4, '0', STR_PAD_LEFT);
    }

    // Hitung sisa fisik uang kas di laci loket teller secara real-time
    private function availableCash(object $session): int
    {
        $additional = 0;
        if (Schema::hasTable('cash_requests')) {
            $additional = (int) DB::table('cash_requests')
                ->where('cash_session_id', $session->id)
                ->where('status', 'approved')
                ->sum('amount');
        }
        $deposits = (int) Transaction::where('cash_session_id', $session->id)->where('transaction_type', 'Deposit')->sum('amount');
        $withdrawals = (int) Transaction::where('cash_session_id', $session->id)->where('transaction_type', 'Withdrawal')->sum('amount');
        return (int) $session->opening_balance + $additional + $deposits - $withdrawals;
    }

    // 1. Aktivasi rekening nasabah (setoran awal min Rp 10.000 + tetapkan PIN + nomor rekening)
    public function activate(int $memberId, int $amount, string $pin, int $tellerId, string $requestId): Transaction
    {
        $this->ensureAmount($amount);
        if ($amount < config('bank.minimum_balance')) {
            $this->reject('amount', 'Setoran pertama minimal Rp10.000.');
        }
        return DB::transaction(function () use ($memberId, $amount, $pin, $tellerId, $requestId) {
            $session = $this->session($tellerId);
            $member = Member::with('user')->whereKey($memberId)->lockForUpdate()->firstOrFail();
            if ($previous = $this->replay($requestId, $tellerId, $memberId, $amount, 'Deposit')) {
                return $previous;
            }
            $this->ensureOpen($session);
            $reserved = $member->saver()->lockForUpdate()->first();
            if (!$member->graduation_year) {
                $this->reject('member', 'Minta admin melengkapi tahun kelulusan terlebih dahulu.');
            }
            if (!$member->user || !$member->user->is_active || $member->account_status !== 'inactive' || ($reserved && ($reserved->balance !== 0 || $reserved->transactions()->exists()))) {
                $this->reject('member', 'Anggota tidak dapat diaktifkan atau sudah memiliki rekening.');
            }
            $data = [
                'user_id' => $member->user_id,
                'account_number' => $reserved?->account_number ?? $this->accountNumber(),
                'balance' => 0,
                'security_pin' => $pin,
                'qr_code_token' => $reserved?->qr_code_token ?? (string) Str::uuid(),
                'activated_at' => now(),
                'activated_by' => $tellerId,
            ];
            if (Schema::hasColumn('savers', 'nis')) {
                $data['nis'] = $member->student_number;
            }
            if (Schema::hasColumn('savers', 'full_name')) {
                $data['full_name'] = $member->full_name;
            }
            if (Schema::hasColumn('savers', 'class_name')) {
                $data['class_name'] = $member->major ?? '-';
            }
            if ($reserved) {
                $reserved->update($data);
                $saver = $reserved;
            } else {
                $saver = Saver::create($data);
            }
            $member->update(['account_status' => 'active']);
            $this->audit->record($tellerId, 'saver.activated', 'saver', $saver->id);
            return $this->record($session, $saver, $amount, 'Deposit', $tellerId, $requestId, 'Setoran pertama aktivasi rekening');
        }, 5);
    }

    // 2. Kalkulasi batas limit penarikan (saldo dapat ditarik, limit harian Rp 1 jt, threshold janji H-1)
    public function getWithdrawalLimits(Saver $saver): array
    {
        $todayDate = today()->toDateString();
        $todayWithdrawn = (int) Transaction::where('saver_id', $saver->id)
            ->where('transaction_type', 'Withdrawal')
            ->whereDate('date', $todayDate)
            ->sum('amount');

        $dailyLimit = (int) config('bank.daily_withdrawal_limit', 1000000);
        $minimumBalance = (int) config('bank.minimum_balance', 10000);

        return [
            'balance' => $saver->balance,
            'minimum_balance' => $minimumBalance,
            'max_withdrawable' => max(0, $saver->balance - $minimumBalance),
            'daily_withdrawal_limit' => $dailyLimit,
            'appointment_threshold' => (int) config('bank.appointment_threshold', 1000000),
            'today_withdrawn' => $todayWithdrawn,
            'remaining_daily_limit' => max(0, $dailyLimit - $todayWithdrawn),
        ];
    }

    // 3. Proses transaksi setor dan tarik tunai (validasi PIN, saldo mengendap, aturan janji H-1)
    public function transact(string $accountNumber, int $amount, string $type, ?string $pin, int $tellerId, string $requestId, ?string $notes, ?int $appointmentId = null): Transaction
    {
        $this->ensureAmount($amount);
        if (!in_array($type, ['Deposit', 'Withdrawal'], true)) {
            $this->reject('type', 'Jenis transaksi tidak sah.');
        }
        return DB::transaction(function () use ($accountNumber, $amount, $type, $pin, $tellerId, $requestId, $notes, $appointmentId) {
            $session = $this->session($tellerId);
            $saver = Saver::with('member.user')->where('account_number', $accountNumber)->lockForUpdate()->firstOrFail();
            if ($previous = $this->replay($requestId, $tellerId, $saver->user_id, $amount, $type)) {
                return $previous;
            }
            $this->ensureOpen($session);
            if (!$saver->member || !$saver->member->user || !$saver->member->user->is_active || $saver->member->account_status !== 'active') {
                $this->reject('account_number', 'Layanan rekening sedang tidak aktif.');
            }

            $usedAppointmentId = null;

            if ($type === 'Withdrawal') {
                if (!Hash::check((string) $pin, $saver->security_pin)) {
                    $this->reject('security_pin', 'PIN tidak benar.');
                }
                // Validasi saldo mengendap minimal Rp 10.000 (contoh: saldo Rp 1.000.000 max tarik Rp 990.000)
                if ($saver->balance - $amount < config('bank.minimum_balance')) {
                    $this->reject('amount', 'Penarikan harus menyisakan saldo minimal Rp10.000.');
                }
                $cash = $this->availableCash($session);
                if ($amount > $cash) {
                    $this->reject('amount', 'Kas loket tidak mencukupi untuk penarikan ini.');
                }

                $todayDate = today()->toDateString();
                $todayWithdrawn = (int) Transaction::where('saver_id', $saver->id)
                    ->where('transaction_type', 'Withdrawal')
                    ->whereDate('date', $todayDate)
                    ->sum('amount');

                $threshold = (int) config('bank.appointment_threshold', 1000000);
                $dailyLimit = (int) config('bank.daily_withdrawal_limit', 1000000);
                $requiresAppointment = $amount > $threshold || ($todayWithdrawn + $amount) > $dailyLimit;

                // Verifikasi perjanjian H-1 jika penarikan > Rp 1.000.000 atau akumulasi harian melebihi limit
                if ($requiresAppointment) {
                    $appointmentQuery = WithdrawalAppointment::where('saver_id', $saver->id)
                        ->where('status', 'approved')
                        ->whereDate('scheduled_date', $todayDate)
                        ->lockForUpdate();

                    if ($appointmentId) {
                        $appointment = $appointmentQuery->where('id', $appointmentId)->first();
                    } else {
                        $appointment = $appointmentQuery->where('amount', '>=', $amount)->orderByDesc('amount')->first();
                    }

                    if (!$appointment) {
                        if ($amount > $threshold) {
                            $this->reject('amount', 'Penarikan di atas Rp1.000.000 wajib memiliki perjanjian H-1 yang telah disetujui Admin.');
                        } else {
                            $formattedWithdrawn = number_format($todayWithdrawn, 0, ',', '.');
                            $this->reject('amount', "Total penarikan hari ini melebihi limit harian Rp1.000.000 (sudah ditarik: Rp{$formattedWithdrawn}). Penarikan tambahan wajib memiliki perjanjian H-1 yang telah disetujui Admin.");
                        }
                    }

                    if ($amount > $appointment->amount) {
                        $formattedApptAmount = number_format($appointment->amount, 0, ',', '.');
                        $this->reject('amount', "Nominal penarikan melebihi plafon perjanjian yang disetujui Admin (Maks Rp{$formattedApptAmount}).");
                    }

                    $appointment->update(['status' => 'completed']);
                    $usedAppointmentId = $appointment->id;
                }
            }
            return $this->record($session, $saver, $amount, $type, $tellerId, $requestId, $notes, $usedAppointmentId);
        }, 5);
    }

    // 4. Pembukuan transaksi: update saldo, simpan histori transaksi, dan jurnal akuntansi double-entry (101 Kas vs 201 Simpanan)
    private function record(object $session, Saver $saver, int $amount, string $type, int $tellerId, string $requestId, ?string $notes, ?int $appointmentId = null): Transaction
    {
        $balance = $saver->balance + ($type === 'Deposit' ? $amount : -$amount);
        if ($balance < 0 || $balance > config('bank.maximum_balance')) {
            $this->reject('amount', 'Saldo hasil transaksi di luar batas sistem.');
        }
        $cash = $this->availableCash($session);
        $cashAfter = $cash + ($type === 'Deposit' ? $amount : -$amount);
        if ($cashAfter < 0 || $cashAfter > config('bank.maximum_balance')) {
            $this->reject('amount', 'Kas hasil transaksi di luar batas sistem.');
        }
        $saver->update(['balance' => $balance]);
        $transaction = Transaction::create([
            'saver_id' => $saver->id,
            'teller_id' => $tellerId,
            'cash_session_id' => $session->id,
            'request_id' => $requestId,
            'transaction_type' => $type,
            'amount' => $amount,
            'date' => today()->toDateString(),
            'notes' => $notes,
            'withdrawal_appointment_id' => $appointmentId,
            'balance_after' => $balance,
            'snapshot_account_number' => $saver->account_number,
            'snapshot_member_name' => $saver->member?->full_name ?? ($saver->full_name ?? 'Nasabah'),
        ]);
        $debit = $type === 'Deposit' ? '101' : '201';
        $credit = $type === 'Deposit' ? '201' : '101';
        foreach ([['account_code' => $debit, 'entry_type' => 'Debit'], ['account_code' => $credit, 'entry_type' => 'Credit']] as $entry) {
            DB::table('journal_entries')->insert([...$entry, 'transaction_id' => $transaction->id, 'cash_transfer_id' => null, 'cash_session_id' => null, 'amount' => $amount, 'created_at' => now(), 'updated_at' => now()]);
        }
        $this->audit->record($tellerId, 'transaction.created', 'transaction', $transaction->id, ['request_id' => $requestId, 'amount' => $amount, 'type' => $type]);
        return $transaction;
    }
}
