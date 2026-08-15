<?php

namespace App\Services;

use App\Models\DailyReconciliation;
use App\Models\Transaction;
use Carbon\Carbon;

class ReconciliationService
{
    /**
     * Hitung ringkasan kas harian Teller dan simpan ke database
     *
     * Rumus:
     *   Total Setoran    = SUM(amount) WHERE teller_id=X AND date=today AND type=Deposit
     *   Total Penarikan  = SUM(amount) WHERE teller_id=X AND date=today AND type=Withdrawal
     *   Expected Balance = Saldo Awal + Total Setoran - Total Penarikan
     *   Discrepancy      = Uang Fisik - Expected Balance
     *   Status           = Discrepancy == 0 ? 'Pending' : 'Disputed'
     *
     * @param int   $tellerId        ID teller yang submit
     * @param float $openingBalance  Saldo kas awal hari (input teller)
     * @param float $actualCash      Uang fisik di laci (hitungan teller)
     * @return DailyReconciliation
     */
    public function calculateAndStore(int $tellerId, float $openingBalance, float $actualCash): DailyReconciliation
    {
        $today = Carbon::today()->toDateString();

        // Hitung total setoran hari ini oleh teller ini
        $totalDeposits = Transaction::where('teller_id', $tellerId)
            ->where('date', $today)
            ->where('transaction_type', 'Deposit')
            ->sum('amount');

        // Hitung total penarikan hari ini oleh teller ini
        $totalWithdrawals = Transaction::where('teller_id', $tellerId)
            ->where('date', $today)
            ->where('transaction_type', 'Withdrawal')
            ->sum('amount');

        // Kalkulasi saldo akhir yang diharapkan
        $expectedClosing = $openingBalance + $totalDeposits - $totalWithdrawals;

        // Hitung selisih (bisa negatif, nol, atau positif)
        $discrepancy = $actualCash - $expectedClosing;

        // Tentukan status berdasarkan selisih
        // Discrepancy = 0 → Pending (menunggu approval Supervisor)
        // Discrepancy ≠ 0 → Disputed (ada selisih, perlu investigasi)
        $status = ($discrepancy == 0) ? 'Pending' : 'Disputed';

        // Simpan ke database
        $reconciliation = DailyReconciliation::create([
            'teller_id'                => $tellerId,
            'date'                     => $today,
            'opening_balance'          => $openingBalance,
            'total_deposits'           => $totalDeposits,
            'total_withdrawals'        => $totalWithdrawals,
            'expected_closing_balance' => $expectedClosing,
            'actual_cash_on_hand'      => $actualCash,
            'discrepancy'              => $discrepancy,
            'status'                   => $status,
        ]);

        return $reconciliation;
    }
}