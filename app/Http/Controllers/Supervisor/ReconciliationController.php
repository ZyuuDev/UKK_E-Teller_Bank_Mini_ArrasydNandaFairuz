<?php

namespace App\Http\Controllers\Supervisor;

use App\Http\Controllers\Controller;
use App\Models\DailyReconciliation;
use Illuminate\Http\Request;

class ReconciliationController extends Controller
{
    /**
     * tampilkan semua rekonsiliasi (semua Teller, semua tanggal)
     * GET /api/supervisor/reconciliations
     *
     * Supervisor bisa filter berdasarkan status:
     *   GET /api/supervisor/reconciliations?status=Pending
     *   GET /api/supervisor/reconciliations?status=Disputed
     *   GET /api/supervisor/reconciliations?status=Approved
     *   GET /api/supervisor/reconciliations (tanpa filter → tampil semua)
     */
    public function index(Request $request)
    {
        // ambil semua rekonsiliasi + data teller & supervisor
        $query = DailyReconciliation::with('teller:id,name,username')
            ->with('supervisor:id,name,username');

        // filter berdasarkan status jika parameter dikirim
        if ($request->has('status')) {
            $request->validate([
                'status' => 'in:Pending,Approved,Disputed',
            ]);
            $query->where('status', $request->status);
        }

        // urutkan dari terbaru
        $reconciliations = $query->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data'   => $reconciliations,
        ], 200);
    }

    /**
     * Setujui rekonsiliasi harian
     * POST /api/supervisor/approve/{id}
     */
    public function approve(string $id)
    {
        // 1. Cari rekonsiliasi
        $reconciliation = DailyReconciliation::with('teller:id,name,username')->find($id);

        if (!$reconciliation) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Laporan rekonsiliasi tidak ditemukan.',
            ], 404);
        }

        // 2. Cek apakah sudah Approved (terkunci permanen)
        if ($reconciliation->status === 'Approved') {
            return response()->json([
                'status'  => 'error',
                'message' => 'Laporan ini sudah disetujui sebelumnya dan terkunci permanen.',
            ], 409);
        }

        // 3. tidak bisa approve jika ada selisih
        if ($reconciliation->status === 'Disputed') {
            return response()->json([
                'status'  => 'error',
                'message' => 'Laporan ini memiliki selisih kas (Disputed). ' .
                    'Selisih: Rp ' . number_format(abs($reconciliation->discrepancy), 0, ',', '.') .
                    '. Tidak bisa disetujui sebelum selisih diselesaikan.',
            ], 422); 
        }

        // 4. ubah status + catat siapa & kapan
        $reconciliation->update([
            'status'        => 'Approved',
            'supervisor_id' => auth()->id(),
            'approved_at'   => now(),
        ]);

        // 5. muat supervisor untuk response
        $reconciliation->load('supervisor:id,name,username');

        // 6. response sukses
        return response()->json([
            'status'  => 'success',
            'message' => 'Laporan rekonsiliasi berhasil disetujui. Kas telah resmi dipindahkan ke brankas.',
            'data'    => $reconciliation,
        ], 200);
    }
}