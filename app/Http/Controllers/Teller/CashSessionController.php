<?php

namespace App\Http\Controllers\Teller;

use App\Http\Controllers\Controller;
use App\Models\CashRequest;
use App\Models\DailyReconciliation;
use App\Models\Pengaturan;
use App\Services\AuditService;
use App\Services\CashSessionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CashSessionController extends Controller
{
    // 1. Riwayat 30 sesi kas terakhir milik teller
    public function index(Request $request, CashSessionService $sessions)
    {
        $sessions->autoCloseForgottenSessions();
        $rows = DB::table('cash_sessions')->where('teller_id', $request->user()->id)->orderByDesc('date')->limit(30)->get();
        return response()->json(['data' => $rows->map(fn ($session) => $sessions->summary($session))]);
    }

    // 2. Buka sesi kas loket di awal hari (input modal kas awal)
    public function store(Request $request, CashSessionService $sessions)
    {
        $data = $request->validate(['opening_balance' => 'required|integer|min:0|max:1000000000000']);
        return response()->json(['data' => $sessions->open($request->user()->id, (int) $data['opening_balance'])], 201);
    }

    // 3. Tutup sesi kas di akhir hari (input kas fisik aktual untuk serah terima & rekonsiliasi ke Admin)
    public function submit(Request $request, int $session, CashSessionService $sessions)
    {
        $data = $request->validate(['actual_cash_on_hand' => 'required|integer|min:0|max:9000000000000']);
        return response()->json(['data' => $sessions->submit($session, $request->user()->id, (int) $data['actual_cash_on_hand'])], 201);
    }

    // 4. Laporan rekonsiliasi harian kas teller
    public function reports(Request $request)
    {
        return response()->json(['data' => DailyReconciliation::where('teller_id', $request->user()->id)->orderByDesc('date')->paginate(25)]);
    }

    // 5. Cek jam operasional & status layanan loket teller (buka / istirahat / tutup)
    public function serviceStatus(CashSessionService $sessions)
    {
        $sessions->autoCloseForgottenSessions();
        $tz = config('bank.operating_hours.timezone', 'Asia/Jakarta');
        $now = now($tz);
        $timeStr = $now->format('H:i');
        $openTime = config('bank.operating_hours.open_time', '07:30');
        $closeTime = config('bank.operating_hours.close_time', '17:00');

        $isWithinHours = $timeStr >= $openTime && $timeStr < $closeTime;
        $dbStatus = Pengaturan::getStatusLayanan();

        $effectiveStatus = $dbStatus;
        if (!$isWithinHours && $dbStatus === 'buka') {
            $effectiveStatus = 'tutup';
        }

        return response()->json([
            'data' => [
                'status' => $effectiveStatus,
                'manual_status' => $dbStatus,
                'is_open' => $effectiveStatus === 'buka',
                'operating_hours' => "{$openTime} - {$closeTime} WIB",
                'close_time' => "{$closeTime} WIB",
                'server_time' => $now->format('H:i:s'),
            ],
        ]);
    }

    // 6. Update manual status layanan teller (buka / istirahat / tutup)
    public function updateServiceStatus(Request $request, AuditService $audit)
    {
        $data = $request->validate([
            'status' => 'required|string|in:buka,istirahat,tutup',
        ]);
        Pengaturan::setStatusLayanan($data['status']);
        $audit->record($request->user()->id, 'service_status.updated', 'pengaturan', null, ['status' => $data['status']]);

        return response()->json([
            'data' => [
                'status' => $data['status'],
                'message' => 'Status layanan teller berhasil diperbarui.',
            ],
        ]);
    }

    // 7. Riwayat pengajuan penambahan modal kas fisik loket
    public function cashRequests(Request $request)
    {
        $rows = CashRequest::where('teller_id', $request->user()->id)
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->limit(30)
            ->get();

        return response()->json(['data' => $rows]);
    }

    // 8. Pengajuan penambahan modal kas fisik loket ke Admin (ketika uang di laci menipis)
    public function requestCash(Request $request, AuditService $audit)
    {
        $data = $request->validate([
            'amount' => 'required|integer|min:10000|max:1000000000000',
            'notes' => 'required|string|max:255',
        ]);

        $today = today()->toDateString();
        $session = DB::table('cash_sessions')
            ->where('teller_id', $request->user()->id)
            ->where('date', $today)
            ->first();

        abort_unless($session && $session->status === 'open', 422, 'Buka sesi kas hari ini terlebih dahulu untuk mengajukan tambahan kas.');

        $cashRequest = CashRequest::create([
            'teller_id' => $request->user()->id,
            'cash_session_id' => $session->id,
            'date' => $today,
            'amount' => (int) $data['amount'],
            'notes' => $data['notes'],
            'status' => 'pending',
        ]);

        $audit->record($request->user()->id, 'cash_request.created', 'cash_request', $cashRequest->id, [
            'amount' => (int) $data['amount'],
            'notes' => $data['notes'],
        ]);

        return response()->json(['data' => $cashRequest], 201);
    }
}
