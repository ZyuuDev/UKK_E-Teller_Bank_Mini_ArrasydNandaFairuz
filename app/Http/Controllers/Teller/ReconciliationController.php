<?php

namespace App\Http\Controllers\Teller;

use App\Http\Controllers\Controller;
use App\Models\DailyReconciliation;
use App\Services\ReconciliationService;
use Illuminate\Http\Request;

class ReconciliationController extends Controller
{
    protected $reconciliationService;

    public function __construct(ReconciliationService $reconciliationService)
    {
        $this->reconciliationService = $reconciliationService;
    }

    /**
     * Teller submit rekonsiliasi kas harian
     * Method: POST
     * URL: /api/teller/reconciliation
     * Body: {
     *   "opening_balance": 500000,
     *   "actual_cash_on_hand": 750000
     * }
     */
    public function submit(Request $request)
    {
        // 1. Validasi input
        $request->validate([
            'opening_balance'      => 'required|numeric|min:0',
            'actual_cash_on_hand'  => 'required|numeric|min:0',
        ]);

        // 2. Panggil ReconciliationService
        $reconciliation = $this->reconciliationService->calculateAndStore(
            auth()->id(),
            $request->opening_balance,
            $request->actual_cash_on_hand
        );

        // 3. Buat pesan sesuai status
        if ($reconciliation->status === 'Disputed') {
            $message = 'Rekonsiliasi tercatat dengan STATUS DISPUTED — terdapat selisih Rp ' .
                number_format(abs($reconciliation->discrepancy), 0, ',', '.') .
                '. Modul cetak laporan DIKUNCI sampai selisih diselesaikan.';
        } else {
            $message = 'Rekonsiliasi berhasil dicatat. Status: Pending — menunggu approval Supervisor.';
        }

        // 4. Response
        return response()->json([
            'status'  => 'success',
            'message' => $message,
            'data'    => $reconciliation,
        ], 201);
    }

    /**
     * lihat detail laporan rekonsiliasi
     * Method: GET
     * URL: /api/teller/report/{id}
     */
    public function show(string $id)
    {
        // Hanya tampilkan laporan milik teller yang sedang login
        $reconciliation = DailyReconciliation::with('teller:id,name,username')
            ->with('supervisor:id,name,username')
            ->where('id', $id)
            ->where('teller_id', auth()->id())
            ->first();

        if (!$reconciliation) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Laporan rekonsiliasi tidak ditemukan atau bukan milik Anda.',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data'   => $reconciliation,
        ], 200);
    }
}