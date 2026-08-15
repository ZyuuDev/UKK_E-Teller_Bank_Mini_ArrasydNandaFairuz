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
    //Setor tunai
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
            // 1. cari nasabah + kunci baris agar antri
            $customer = Customer::where('account_number', $accountNumber)->lockForUpdate()->first();
            if (!$customer) {
                throw ValidationException::withMessages([
                    'account_number' => ['Nasabah dengan nomor rekening tersebut tidak ditemukan.'],
                ]);
            }
            //2. nominal > 0
            if ($amount <= 0) {
                throw ValidationException::withMessages([
                    'amount' => ['Nominal setoran harus lebih dari 0.'],
                ]);
            }

            //3. buat rekaman transaksi
            $transaction = Transaction::create([
                'customer_id'      => $customer->id,
                'teller_id'        => $tellerId,
                'transaction_type' => 'Deposit',
                'amount'           => $amount,
                'date'             => now()->toDateString(), // tanggal hari ini
                'notes'            => $notes,
            ]);

            //4. tambah saldo nasabah
            $customer->increment('balance', $amount);

            //5. catat 2 jurnal akuntansi
            $this->journalService->recordDoubleEntry($transaction->id, $amount, 'Deposit');

            //6. muat relasi cust untuk response
            $transaction->load('customer:id,account_number,full_name,balance');

            return $transaction;
        });
    }

    //Tarik Tunai
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

            // 1. Cari nasabah + kunci baris
            $customer = Customer::where('account_number', $accountNumber)
                ->lockForUpdate()
                ->first();

            if (!$customer) {
                throw ValidationException::withMessages([
                    'account_number' => ['Nasabah dengan nomor rekening tersebut tidak ditemukan.'],
                ]);
            }

            //2. nominal >= 0
            if ($amount <= 0) {
                throw ValidationException::withMessages([
                    'amount' => ['Nominal penarikan harus lebih dari 0.'],
                ]);
            }

            //3. validasi saldo mengendap. min 10k.
            //(saldo_sekarang - nominal_tarik) >= 10.000
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

            //4. verifikasi pin nasabah saat input didepan layar
            if (!Hash::check($securityPin, $customer->security_pin)) {
                throw ValidationException::withMessages([
                    'security_pin' => ['PIN yang dimasukkan salah.'],
                ]);
            }

            //5. membuat rekaman transaksi
            $transaction = Transaction::create([
                'customer_id'      => $customer->id,
                'teller_id'        => $tellerId,
                'transaction_type' => 'Withdrawal',
                'amount'           => $amount,
                'date'             => now()->toDateString(),
                'notes'            => $notes,
            ]);

            //6. - saldo nasabah
            $customer->decrement('balance', $amount);

            //7. catat dua jurnal akuntansi
            $this->journalService->recordDoubleEntry($transaction->id, $amount, 'Withdrawal');

            // 8. Muat relasi customer untuk response
            $transaction->load('customer:id,account_number,full_name,balance');

            return $transaction;
        });
    }
}