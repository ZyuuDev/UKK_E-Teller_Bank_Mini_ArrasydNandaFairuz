<?php

namespace App\Http\Controllers\Teller;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Services\TransactionService;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    protected $transactionService;

    public function __construct(TransactionService $transactionService)
    {
        $this->transactionService = $transactionService;
    }

    /**
     * Cari nasabah berdasarkan nomor rekening atau QR token
     * Method: GET
     * URL: /api/teller/search?account_number=BMS-2026-0001
     * URL: /api/teller/search?qr_token=550e8400-...
     */
    public function search(Request $request)
    {
        $customer = null;

        // Cari berdasarkan nomor rekening (input manual)
        if ($request->has('account_number')) {
            $customer = Customer::where('account_number', $request->account_number)->first();
        }

        // Cari berdasarkan QR token (hasil scan QR Code)
        if ($request->has('qr_token')) {
            $customer = Customer::where('qr_code_token', $request->qr_token)->first();
        }

        // Tidak ditemukan
        if (!$customer) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Nasabah tidak ditemukan. Periksa kembali nomor rekening atau QR Code.',
            ], 404);
        }

        // Ditemukan — kirim data profil nasabah
        return response()->json([
            'status' => 'success',
            'data'   => [
                'id'             => $customer->id,
                'account_number' => $customer->account_number,
                'full_name'      => $customer->full_name,
                'class_name'     => $customer->class_name,
                'balance'        => $customer->balance,
            ],
        ], 200);
    }

    /** input setoran tunai
     * Method: POST
     * URL: /api/teller/deposit
     * Body: {
     *   "account_number": "BMS-2026-0001",
     *   "amount": 100000,
     *   "notes": "Setoran bulanan"  (opsional)
     * }
     */
    public function deposit(Request $request)
    {
        // 1. Validasi input
        $request->validate([
            'account_number' => 'required|string',
            'amount'         => 'required|numeric|gt:0',
            'notes'          => 'nullable|string',
        ]);

        // 2. Panggil TransactionService
        $transaction = $this->transactionService->deposit(
            $request->account_number,
            $request->amount,
            auth()->id(),
            $request->notes
        );

        // 3. Response sukses
        return response()->json([
            'status'  => 'success',
            'message' => 'Setoran tunai berhasil dicatat.',
            'data'    => [
                'transaction_id'   => $transaction->id,
                'transaction_type' => $transaction->transaction_type,
                'amount'           => $transaction->amount,
                'date'             => $transaction->date->format('d/m/Y'),
                'customer'         => $transaction->customer,
                'notes'            => $transaction->notes,
            ],
        ], 201);
    }

    /**
     * Input penarikan tunai
     * Method: POST
     * URL: /api/teller/withdraw
     * Body: {
     *   "account_number": "BMS-2026-0001",
     *   "amount": 50000,
     *   "security_pin": "123456",
     *   "notes": "Penarikan dana"  (opsional)
     * }
     */
    public function withdraw(Request $request)
    {
        // 1. Validasi input
        $request->validate([
            'account_number' => 'required|string',
            'amount'         => 'required|numeric|gt:0',
            'security_pin'   => 'required|digits:6',
            'notes'          => 'nullable|string',
        ]);

        // 2. Panggil TransactionService
        $transaction = $this->transactionService->withdraw(
            $request->account_number,
            $request->amount,
            $request->security_pin,
            auth()->id(),
            $request->notes
        );

        // 3. Response sukses
        return response()->json([
            'status'  => 'success',
            'message' => 'Penarikan tunai berhasil dicatat.',
            'data'    => [
                'transaction_id'   => $transaction->id,
                'transaction_type' => $transaction->transaction_type,
                'amount'           => $transaction->amount,
                'date'             => $transaction->date->format('d/m/Y'),
                'customer'         => $transaction->customer,
                'notes'            => $transaction->notes,
            ],
        ], 201);
    }
}