<?php

namespace App\Http\Controllers\Nasabah;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    //cek saldo rekening nasabah
    //GET /api/nasabah/balance
    public function balance()
    {
        $customer = auth()->user()->customer;
        if (!$customer) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Rekening nasabah tidak ditemukan untuk akun ini.',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data'   => [
                'account_number' => $customer->account_number,
                'full_name'      => $customer->full_name,
                'class_name'     => $customer->class_name,
                'balance'        => $customer->balance,
            ],
        ], 200);
    }

    //MUTASI
    //GET /api/nasabah/mutations

    public function mutations()
    {
        $customer = auth()->user()->customer;
        if (!$customer) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Rekening nasabah tidak ditemukan untuk akun ini.',
            ], 404);
        }

        //ambil transaksi
        $transactions = $customer->transactions()->with('teller:id,name')->orderBy('created_at', 'desc')->get();

        $totalDeposits = $transactions->where('transaction_type', 'Deposit')->sum('amount');
        $totalWithdrawals = $transactions->where('transaction_type', 'Withdrawal')->sum('amount');

        return response()->json([
            'status' => 'success',
            'data'   => [
                'account_number'    => $customer->account_number,
                'full_name'         => $customer->full_name,
                'current_balance'   => $customer->balance,
                'summary'           => [
                    'total_transactions' => $transactions->count(),
                    'total_deposits'     => $totalDeposits,
                    'total_withdrawals'  => $totalWithdrawals,
                ],
                'mutations'         => $transactions,
            ],
        ], 200);
    }
}