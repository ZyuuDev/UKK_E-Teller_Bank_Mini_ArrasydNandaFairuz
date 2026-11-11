<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Saver;
use App\Models\Transaction;
use App\Services\AuditService;
use Carbon\Carbon;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SaverController extends Controller
{
    // 1. [Data Penabung] Menampilkan daftar seluruh rekening nasabah aktif dan saldonya
    public function index(Request $request)
    {
        $request->validate(['q' => 'nullable|string|max:100']);
        $query = Saver::with('member.user')->whereHas('member', fn ($member) => $member->where('account_status', 'active'))->orderByDesc('id');
        if ($request->filled('q')) {
            $query->where(function ($query) use ($request) {
                $term = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $request->q);
                $query->where('account_number', 'like', '%'.$term.'%')->orWhereHas('member', fn ($member) => $member->where('student_number', 'like', '%'.$term.'%')->orWhere('full_name', 'like', '%'.$term.'%'));
            });
        }
        $rows = $query->paginate(25);
        $rows->getCollection()->transform(fn ($saver) => $saver->profile());

        return response()->json(['data' => $rows]);
    }

    // 2. [Data Penabung] Reset PIN rekening siswa ke PIN default 123456 oleh Admin
    public function resetPin(Request $request, int $id, AuditService $audit)
    {
        $saver = Saver::with('member')->findOrFail($id);
        $saver->update(['security_pin' => '123456']);
        $audit->record($request->user()->id, 'saver.pin_reset', 'saver', $saver->id, [
            'account_number' => $saver->account_number,
            'by_role' => 'admin',
        ]);

        return response()->json([
            'data' => [
                'message' => 'PIN rekening ' . $saver->account_number . ' (' . $saver->member->full_name . ') berhasil direset ke PIN default 123456.',
            ],
        ]);
    }

    private function csvText(?string $value): string
    {
        $value = $value ?? '';

        return preg_match('/^[\s\x00-\x1F]*[=+\-@]/u', $value) ? "'".$value : $value;
    }

    private function calculateStatement(Saver $saver, string $monthStr): array
    {
        $start = Carbon::createFromFormat('!Y-m', $monthStr, 'Asia/Jakarta')->startOfMonth();
        $end = $start->copy()->endOfMonth();
        $startDate = $start->format('Y-m-d');
        $untilDate = $end->copy()->addDay()->format('Y-m-d');

        // Saldo awal bulan: ambil balance_after dari transaksi terakhir sebelum bulan ini dimulai
        $prevTx = Transaction::where('saver_id', $saver->id)
            ->where('date', '<', $startDate)
            ->orderByDesc('id')
            ->first();
        $startingBalance = $prevTx ? (int) $prevTx->balance_after : 0;

        // Daftar transaksi yang terjadi di bulan ini
        $transactions = Transaction::where('saver_id', $saver->id)
            ->where('date', '>=', $startDate)
            ->where('date', '<', $untilDate)
            ->with('teller:id,name,username')
            ->orderBy('id', 'asc')
            ->get();

        $totalDeposits = (int) $transactions->where('transaction_type', 'Deposit')->sum('amount');
        $totalWithdrawals = (int) $transactions->where('transaction_type', 'Withdrawal')->sum('amount');
        $netFlow = $totalDeposits - $totalWithdrawals;

        $lastTx = $transactions->last();
        $endingBalance = $lastTx ? (int) $lastTx->balance_after : $startingBalance;

        $monthNames = [
            '01' => 'Januari', '02' => 'Februari', '03' => 'Maret', '04' => 'April',
            '05' => 'Mei', '06' => 'Juni', '07' => 'Juli', '08' => 'Agustus',
            '09' => 'September', '10' => 'Oktober', '11' => 'November', '12' => 'Desember',
        ];
        $mNum = $start->format('m');
        $monthLabel = ($monthNames[$mNum] ?? $start->format('F')).' '.$start->format('Y');

        $saver->loadMissing('member.user');

        return [
            'saver' => [
                'id' => $saver->id,
                'account_number' => $saver->account_number,
                'full_name' => $saver->member?->full_name ?? $saver->full_name,
                'student_number' => $saver->member?->student_number ?? $saver->nis,
                'major' => $saver->member?->major ?? '-',
                'graduation_year' => $saver->member?->graduation_year ?? '-',
                'current_balance' => (int) $saver->balance,
                'account_status' => $saver->member?->account_status ?? 'active',
            ],
            'period' => [
                'month' => $monthStr,
                'label' => $monthLabel,
                'start_date' => $startDate,
                'end_date' => $end->format('Y-m-d'),
            ],
            'summary' => [
                'starting_balance' => $startingBalance,
                'total_deposits' => $totalDeposits,
                'total_withdrawals' => $totalWithdrawals,
                'net_flow' => $netFlow,
                'ending_balance' => $endingBalance,
                'transaction_count' => $transactions->count(),
            ],
            'transactions' => $transactions->map(function ($tx) {
                return [
                    'id' => $tx->id,
                    'ref' => 'TRX-'.$tx->id,
                    'date' => $tx->date->format('Y-m-d'),
                    'created_at' => $tx->created_at->copy()->timezone('Asia/Jakarta')->format('d/m/Y H:i:s'),
                    'transaction_type' => $tx->transaction_type,
                    'type_label' => $tx->transaction_type === 'Deposit' ? 'Setoran' : 'Penarikan',
                    'amount' => (int) $tx->amount,
                    'balance_after' => (int) $tx->balance_after,
                    'teller_name' => $tx->teller?->name ?? 'Petugas loket',
                    'notes' => $tx->notes,
                    'request_id' => $tx->request_id,
                ];
            })->values()->all(),
        ];
    }

    // 3. [Rekap Bulanan Nasabah] Menampilkan ringkasan mutasi dan data transaksi bulanan nasabah
    public function statement(Request $request, Saver $saver)
    {
        $data = $request->validate([
            'month' => 'nullable|date_format:Y-m',
        ]);
        $monthStr = $data['month'] ?? now('Asia/Jakarta')->format('Y-m');
        $statement = $this->calculateStatement($saver, $monthStr);

        return response()->json(['data' => $statement])->header('Cache-Control', 'private, no-store');
    }

    // 4. [Ekspor Rekap Bulanan] Unduh laporan rekening koran bulanan nasabah dalam format CSV / PDF cetak resmi
    public function exportStatement(Request $request, Saver $saver)
    {
        $data = $request->validate([
            'month' => 'nullable|date_format:Y-m',
            'format' => 'nullable|in:pdf,csv',
        ]);
        $monthStr = $data['month'] ?? now('Asia/Jakarta')->format('Y-m');
        $format = $data['format'] ?? 'pdf';
        $statement = $this->calculateStatement($saver, $monthStr);

        $filename = 'rekening-koran-'.$saver->account_number.'-'.$monthStr;

        if ($format === 'csv') {
            return response()->streamDownload(function () use ($statement) {
                $output = fopen('php://output', 'w');
                fwrite($output, "\xEF\xBB\xBF");
                fputcsv($output, ['REKENING KORAN / REKAP BULANAN NASABAH - BANK MINI SMKN 1 BANTUL']);
                fputcsv($output, ['Nomor Rekening', "'".$statement['saver']['account_number']]);
                fputcsv($output, ['Nama Siswa', $this->csvText($statement['saver']['full_name'])]);
                fputcsv($output, ['NIS Siswa', "'".$statement['saver']['student_number']]);
                fputcsv($output, ['Program Keahlian', $this->csvText($statement['saver']['major'])]);
                fputcsv($output, ['Periode', $statement['period']['label']]);
                fputcsv($output, []);
                fputcsv($output, ['Saldo Awal Bulan', $statement['summary']['starting_balance']]);
                fputcsv($output, ['Total Setoran (Kredit)', $statement['summary']['total_deposits']]);
                fputcsv($output, ['Total Penarikan (Debet)', $statement['summary']['total_withdrawals']]);
                fputcsv($output, ['Arus Kas Bersih', $statement['summary']['net_flow']]);
                fputcsv($output, ['Saldo Akhir Bulan', $statement['summary']['ending_balance']]);
                fputcsv($output, ['Jumlah Transaksi', $statement['summary']['transaction_count']]);
                fputcsv($output, []);
                fputcsv($output, ['No', 'Referensi', 'Tanggal Buku', 'Waktu WIB', 'Jenis', 'Nominal Debet', 'Nominal Kredit', 'Saldo Sesudah', 'Teller', 'Catatan']);
                $no = 1;
                foreach ($statement['transactions'] as $tx) {
                    fputcsv($output, [
                        $no++,
                        $tx['ref'],
                        $tx['date'],
                        $tx['created_at'],
                        $tx['type_label'],
                        $tx['transaction_type'] === 'Withdrawal' ? $tx['amount'] : 0,
                        $tx['transaction_type'] === 'Deposit' ? $tx['amount'] : 0,
                        $tx['balance_after'],
                        $this->csvText($tx['teller_name']),
                        $this->csvText($tx['notes']),
                    ], ',', '"', '');
                }
                fclose($output);
            }, $filename.'.csv', [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Cache-Control' => 'private, no-store',
                'X-Content-Type-Options' => 'nosniff',
            ]);
        }

        $logoPath = public_path('brand/bank-mini-symbol.png');
        if (!is_file($logoPath)) {
            $logoPath = base_path('frontend/public/brand/bank-mini-symbol.png');
        }
        $logo = is_file($logoPath) ? 'data:image/png;base64,'.base64_encode(file_get_contents($logoPath)) : null;
        $printedAt = now('Asia/Jakarta')->format('d/m/Y H:i:s').' WIB';

        $pdfData = array_merge($statement, [
            'logo' => $logo,
            'printedAt' => $printedAt,
            'printedBy' => $request->user()->name ?? 'Administrator Bank Mini',
        ]);

        $options = new Options;
        $options->set('isRemoteEnabled', false);
        $options->set('isPhpEnabled', false);
        $options->set('isJavascriptEnabled', false);
        $options->set('defaultFont', 'DejaVu Sans');
        $pdf = new Dompdf($options);
        $pdf->loadHtml(view('reports.saver_statement', $pdfData)->render(), 'UTF-8');
        $pdf->setPaper('A4', 'portrait');
        $pdf->render();

        $canvas = $pdf->getCanvas();
        $font = $pdf->getFontMetrics()->getFont('DejaVu Sans', 'normal');
        $canvas->page_text(24, $canvas->get_height() - 15, 'Bank Mini SMKN 1 Bantul - Rekening Koran - Halaman {PAGE_NUM} dari {PAGE_COUNT}', $font, 7, [0.35, 0.40, 0.48]);

        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$filename.'.pdf"',
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
