<?php

namespace App\Services;

use  App\Models\JournalEntry;

class JournalService
{

    public function recordDoubleEntry(int $transactionId, float $amount, string $type): void
    {
        if ($type === 'Deposit') {
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