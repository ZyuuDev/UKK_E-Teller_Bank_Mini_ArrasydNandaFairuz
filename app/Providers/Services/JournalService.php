<?php

namespace App\Services;

use  App\Models\JournalEntry;

class JournalService
{
    // setiap transaksi selalu menghasilkan 2 baris jurnal.
    // 101 uang fisik, 201 tabungan nasabah.

    public function recordDoubleEntry(int $transactionId, float $amount, string $type): void
    {
        if ($type === 'Deposit') {
            // 101 uang masuk ke kas fisik, 201 tabungan nasabah bertambah.
            JournalEntry::create([
                'transaction_id' => $transactionId,
                'account_code'   => '101',
                'entry_type'     => 'Debit',
                'amount'         => $amount,
            ]);

            JournalEntry::create([
                'transaction_id' => $transactionId,
                'account_code'   => '201',
                'entry_type'     => 'Credit',
                'amount'         => $amount,
            ]);
        } elseif ($type === 'Withdrawal') {
            //tabungan nasabah berkurang, uang keluar dari kas fisik.
            JournalEntry::create([
                'transaction_id' => $transactionId,
                'account_code'   => '201',
                'entry_type'     => 'Debit',
                'amount'         => $amount,
            ]);

            JournalEntry::create([
                'transaction_id' => $transactionId,
                'account_code'   => '101',
                'entry_type'     => 'Credit',
                'amount'         => $amount,
            ]);
        }
    }
}