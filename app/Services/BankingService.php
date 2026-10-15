<?php

namespace App\Services;

use App\Models\Member;
use App\Models\Saver;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class BankingService
{
    public function __construct(private AuditService $audit)
    {
    }

    private function reject(string $field, string $message): never
    {
        throw ValidationException::withMessages([$field => $message]);
    }

    private function session(int $tellerId): object
    {
        $session = DB::table('cash_sessions')->where('teller_id', $tellerId)->where('date', today()->toDateString())->lockForUpdate()->first();
        if (!$session) {
            $this->reject('session', 'Buka sesi kas hari ini terlebih dahulu.');
        }
        return $session;
    }

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

    private function accountNumber(): string
    {
        $year = (int) now()->format('Y');
        DB::table('account_sequences')->insertOrIgnore(['year' => $year, 'next_number' => 1]);
        $sequence = DB::table('account_sequences')->where('year', $year)->lockForUpdate()->first();
        DB::table('account_sequences')->where('year', $year)->increment('next_number');
        return 'BMS-'.$year.'-'.str_pad((string) $sequence->next_number, 4, '0', STR_PAD_LEFT);
    }

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
            if (!$member->user->is_active || $member->account_status !== 'inactive' || ($reserved && ($reserved->balance !== 0 || $reserved->transactions()->exists()))) {
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

    public function transact(string $accountNumber, int $amount, string $type, ?string $pin, int $tellerId, string $requestId, ?string $notes): Transaction
    {
        $this->ensureAmount($amount);
        if (!in_array($type, ['Deposit', 'Withdrawal'], true)) {
            $this->reject('type', 'Jenis transaksi tidak sah.');
        }
        return DB::transaction(function () use ($accountNumber, $amount, $type, $pin, $tellerId, $requestId, $notes) {
            $session = $this->session($tellerId);
            $saver = Saver::with('member.user')->where('account_number', $accountNumber)->lockForUpdate()->firstOrFail();
            if ($previous = $this->replay($requestId, $tellerId, $saver->user_id, $amount, $type)) {
                return $previous;
            }
            $this->ensureOpen($session);
            if (!$saver->member->user->is_active || $saver->member->account_status !== 'active') {
                $this->reject('account_number', 'Layanan rekening sedang tidak aktif.');
            }
            if ($type === 'Withdrawal') {
                if (!Hash::check((string) $pin, $saver->security_pin)) {
                    $this->reject('security_pin', 'PIN tidak benar.');
                }
                if ($saver->balance - $amount < config('bank.minimum_balance')) {
                    $this->reject('amount', 'Penarikan harus menyisakan saldo minimal Rp10.000.');
                }
                $cash = $session->opening_balance + (int) Transaction::where('cash_session_id', $session->id)->where('transaction_type', 'Deposit')->sum('amount') - (int) Transaction::where('cash_session_id', $session->id)->where('transaction_type', 'Withdrawal')->sum('amount');
                if ($amount > $cash) {
                    $this->reject('amount', 'Kas loket tidak mencukupi untuk penarikan ini.');
                }
            }
            return $this->record($session, $saver, $amount, $type, $tellerId, $requestId, $notes);
        }, 5);
    }

    private function record(object $session, Saver $saver, int $amount, string $type, int $tellerId, string $requestId, ?string $notes): Transaction
    {
        $balance = $saver->balance + ($type === 'Deposit' ? $amount : -$amount);
        if ($balance < 0 || $balance > config('bank.maximum_balance')) {
            $this->reject('amount', 'Saldo hasil transaksi di luar batas sistem.');
        }
        $cash = (int) $session->opening_balance + (int) Transaction::where('cash_session_id', $session->id)->where('transaction_type', 'Deposit')->sum('amount') - (int) Transaction::where('cash_session_id', $session->id)->where('transaction_type', 'Withdrawal')->sum('amount');
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
            'balance_after' => $balance,
            'snapshot_account_number' => $saver->account_number,
            'snapshot_member_name' => $saver->member->full_name,
        ]);
        $debit = $type === 'Deposit' ? '101' : '201';
        $credit = $type === 'Deposit' ? '201' : '101';
        foreach ([['account_code' => $debit, 'entry_type' => 'Debit'], ['account_code' => $credit, 'entry_type' => 'Credit']] as $entry) {
            DB::table('journal_entries')->insert([...$entry, 'transaction_id' => $transaction->id, 'cash_transfer_id' => null, 'amount' => $amount, 'created_at' => now(), 'updated_at' => now()]);
        }
        $this->audit->record($tellerId, 'transaction.created', 'transaction', $transaction->id, ['request_id' => $requestId, 'amount' => $amount, 'type' => $type]);
        return $transaction;
    }
}