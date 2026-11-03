<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class TransactionService
{
    protected $journalService;

    public function __construct(JournalService $journalService)
    {
        $this->journalService = $journalService;
    }
    /**
    * @param string $accountNumber  Nomor rekening nasabah
    * @param float  $amount         Nominal setoran (harus > 0)
    * @param int    $tellerId       ID teller yang melayani
    * @param string|null $notes     Catatan opsional
    * @return Transaction
    */

    public function deposit(string $accountNumber, float $amount, int $tellerId, ?string $notes = null):
    Transaction
    {
        return DB::transaction(function () use ($accountNumber, $amount, $tellerId, $notes) {
            $customer = Customer::where('account_number', $accountNumber)->lockForUpdate()->first();
            if (!$customer) {
                throw ValidationException::withMessages([
                    'account_number' => ['Nasabah dengan nomor rekening tersebut tidak ditemukan.'],
                ]);
            }
            if ($amount <= 0) {
                throw ValidationException::withMessages([
                    'amount' => ['Nominal setoran harus lebih dari 0.'],
                ]);
            }

            $transaction = Transaction::create([
                'customer_id'      => $customer->id,
                'teller_id'        => $tellerId,
                'transaction_type' => 'Deposit',
                'amount'           => $amount,
                'date'             => now()->toDateString(),
                'notes'            => $notes,
            ]);

            $customer->increment('balance', $amount);

            $this->journalService->recordDoubleEntry($transaction->id, $amount, 'Deposit');

            $transaction->load('customer:id,account_number,full_name,balance');

            return $transaction;
        });
    }

    /**
     * @param string $accountNumber  Nomor rekening nasabah
     * @param float  $amount         Nominal penarikan
     * @param string $securityPin    PIN 6-digit dari nasabah
     * @param int    $tellerId       ID teller yang melayani
     * @param string|null $notes     Catatan opsional
     * @return Transaction
     */
    public function withdraw(string $accountNumber, float $amount, string $securityPin, int $tellerId, ?string $notes = null):
    Transaction
    {
        return DB::transaction(function () use ($accountNumber, $amount, $securityPin, $tellerId, $notes) {

            $customer = Customer::where('account_number', $accountNumber)
                ->lockForUpdate()
                ->first();

            if (!$customer) {
                throw ValidationException::withMessages([
                    'account_number' => ['Nasabah dengan nomor rekening tersebut tidak ditemukan.'],
                ]);
            }

            if ($amount <= 0) {
                throw ValidationException::withMessages([
                    'amount' => ['Nominal penarikan harus lebih dari 0.'],
                ]);
            }

            $remainingBalance = $customer->balance - $amount;
            if ($remainingBalance < 10000) {
                throw ValidationException::withMessages([
                    'amount' => [
                        'Saldo tidak mencukupi. Sisa saldo setelah penarikan (Rp ' .
                        number_format($remainingBalance, 0, ',', '.') .
                        ') kurang dari batas minimum Rp 10.000. Saldo saat ini: Rp ' .
                        number_format($customer->balance, 0, ',', '.') . '.'
                    ],
                ]);
            }

            if (!Hash::check($securityPin, $customer->security_pin)) {
                throw ValidationException::withMessages([
                    'security_pin' => ['PIN yang dimasukkan salah.'],
                ]);
            }

            $transaction = Transaction::create([
                'customer_id'      => $customer->id,
                'teller_id'        => $tellerId,
                'transaction_type' => 'Withdrawal',
                'amount'           => $amount,
                'date'             => now()->toDateString(),
                'notes'            => $notes,
            ]);

            $customer->decrement('balance', $amount);

            $this->journalService->recordDoubleEntry($transaction->id, $amount, 'Withdrawal');

            $transaction->load('customer:id,account_number,full_name,balance');

            return $transaction;
        });
    }
}