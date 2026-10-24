<?php

namespace App\Http\Controllers;

use App\Models\DailyReconciliation;
use App\Models\Transaction;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class TransactionReportController extends Controller
{
    private function filters(Request $request): array
    {
        $data = $request->validate([
            'period' => 'required|in:daily,monthly',
            'date' => 'nullable|required_if:period,daily|date_format:Y-m-d',
            'month' => 'nullable|required_if:period,monthly|date_format:Y-m',
            'teller_id' => 'nullable|integer|min:1',
            'page' => 'nullable|integer|min:1',
            'format' => 'nullable|in:pdf,csv',
        ]);
        $ownId = (int) $request->user()->id;
        $isAdmin = $request->user()->role === 'admin';
        abort_unless(in_array($request->user()->role, ['admin', 'teller'], true), 403);
        $requestedId = isset($data['teller_id']) ? (int) $data['teller_id'] : null;
        abort_if(! $isAdmin && $requestedId !== null && $requestedId !== $ownId, 403);
        $start = $data['period'] === 'daily'
            ? Carbon::createFromFormat('!Y-m-d', $data['date'], 'Asia/Jakarta')
            : Carbon::createFromFormat('!Y-m', $data['month'], 'Asia/Jakarta')->startOfMonth();
        $end = $data['period'] === 'daily' ? $start->copy() : $start->copy()->endOfMonth();

        return [
            'period' => $data['period'],
            'start' => $start->format('Y-m-d'),
            'end' => $end->format('Y-m-d'),
            'until' => $end->copy()->addDay()->format('Y-m-d'),
            'label' => $data['period'] === 'daily' ? $start->format('d/m/Y') : $start->format('m/Y'),
            'teller_id' => $isAdmin ? $requestedId : $ownId,
        ];
    }

    private function query(array $filters): Builder
    {
        return Transaction::query()->where('date', '>=', $filters['start'])->where('date', '<', $filters['until'])
            ->when($filters['teller_id'] !== null, fn ($q) => $q->where('teller_id', $filters['teller_id']));
    }

    private function summary(Builder $query): array
    {
        $totals = (clone $query)->selectRaw("COUNT(*) AS entries, COALESCE(SUM(CASE WHEN transaction_type = 'Deposit' THEN amount ELSE 0 END), 0) AS deposits, COALESCE(SUM(CASE WHEN transaction_type = 'Withdrawal' THEN amount ELSE 0 END), 0) AS withdrawals")->first();

        return [
            'entries' => (int) $totals->entries,
            'deposits' => (int) $totals->deposits,
            'withdrawals' => (int) $totals->withdrawals,
            'net_flow' => (int) $totals->deposits - (int) $totals->withdrawals,
        ];
    }

    private function row(Transaction $transaction): array
    {
        return [
            'id' => $transaction->id,
            'date' => $transaction->date->format('Y-m-d'),
            'created_at' => $transaction->created_at->copy()->timezone('Asia/Jakarta')->format('d/m/Y H:i:s'),
            'account_number' => $transaction->snapshot_account_number ?? $transaction->saver?->account_number,
            'full_name' => $transaction->snapshot_member_name ?? $transaction->saver?->member?->full_name,
            'teller_name' => $transaction->teller?->name ?? 'Petugas tidak tersedia',
            'transaction_type' => $transaction->transaction_type,
            'type_label' => $transaction->transaction_type === 'Deposit' ? 'Setoran' : 'Penarikan',
            'amount' => $transaction->amount,
            'balance_after' => $transaction->balance_after,
            'notes' => $transaction->notes,
            'request_id' => $transaction->request_id,
        ];
    }

    public function index(Request $request)
    {
        $filters = $this->filters($request);
        $data = DB::transaction(function () use ($filters) {
            $query = $this->query($filters);
            $summary = $this->summary($query);
            $rows = $query->with(['teller', 'saver.member'])->orderByDesc('id')->paginate(25);
            $rows->getCollection()->transform(fn ($transaction) => $this->row($transaction));

            return ['filters' => $filters, 'summary' => $summary, 'transactions' => $rows];
        });

        return response()->json(['data' => $data])->header('Cache-Control', 'private, no-store');
    }

    private function csvText(?string $value): string
    {
        $value = $value ?? '';

        // Hindari formula spreadsheet dari nama/catatan yang berasal dari input user.
        return preg_match('/^[\s\x00-\x1F]*[=+\-@]/u', $value) ? "'".$value : $value;
    }

    public function export(Request $request)
    {
        $filters = $this->filters($request);
        $format = $request->input('format', 'pdf');
        $filename = 'bank-mini-'.$filters['period'].'-'.$filters['start'].'-'.($filters['teller_id'] ?? 'semua');
        if ($format === 'csv') {
            // CSV mengalir per batch; tidak memuat seluruh halaman data di browser.
            return response()->streamDownload(function () use ($filters) {
                $output = fopen('php://output', 'wb');
                fwrite($output, "\xEF\xBB\xBF");
                fputcsv($output, ['Referensi', 'Tanggal buku', 'Waktu WIB', 'Rekening', 'Nama siswa', 'Teller', 'Jenis', 'Nominal rupiah', 'Saldo sesudah', 'Catatan', 'Request ID'], ',', '"', '');
                foreach ($this->query($filters)->with(['teller', 'saver.member'])->lazyById(500) as $transaction) {
                    $row = $this->row($transaction);
                    fputcsv($output, [
                        'TRX-'.$row['id'], $row['date'], $row['created_at'],
                        // Awalan apostrof menjaga nomor rekening sebagai teks di spreadsheet.
                        "'".($row['account_number'] ?? ''), $this->csvText($row['full_name']),
                        $this->csvText($row['teller_name']), $row['type_label'],
                        $row['amount'], $row['balance_after'], $this->csvText($row['notes']), $row['request_id'],
                    ], ',', '"', '');
                }
                fclose($output);
            }, $filename.'.csv', ['Content-Type' => 'text/csv; charset=UTF-8', 'Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff']);
        }
        $data = DB::transaction(function () use ($filters) {
            $query = $this->query($filters);
            $summary = $this->summary($query);
            abort_if($summary['entries'] > 5000, 422, 'PDF dibatasi 5.000 transaksi. Pilih periode lebih kecil atau gunakan CSV.');
            $rows = $query->with(['teller', 'saver.member'])->orderBy('id')->get()->map(fn ($transaction) => $this->row($transaction));
            $reconciliations = DailyReconciliation::with('teller')->where('date', '>=', $filters['start'])->where('date', '<', $filters['until'])
                ->when($filters['teller_id'] !== null, fn ($q) => $q->where('teller_id', $filters['teller_id']))
                ->orderBy('date')->orderBy('teller_id')->get();

            return compact('filters', 'summary', 'rows', 'reconciliations');
        });
        $logoPath = base_path('frontend/public/brand/bank-mini-symbol.png');
        $data['logo'] = is_file($logoPath) ? 'data:image/png;base64,'.base64_encode(file_get_contents($logoPath)) : null;
        $data['printedAt'] = now('Asia/Jakarta')->format('d/m/Y H:i:s').' WIB';
        $options = new Options;
        $options->set('isRemoteEnabled', false);
        $options->set('isPhpEnabled', false);
        $options->set('isJavascriptEnabled', false);
        $options->set('defaultFont', 'DejaVu Sans');
        $pdf = new Dompdf($options);
        $pdf->loadHtml(view('reports.transactions', $data)->render(), 'UTF-8');
        $pdf->setPaper('A4', 'landscape');
        $pdf->render();
        $canvas = $pdf->getCanvas();
        $font = $pdf->getFontMetrics()->getFont('DejaVu Sans', 'normal');
        $canvas->page_text(24, $canvas->get_height() - 15, 'Bank Mini - Halaman {PAGE_NUM} dari {PAGE_COUNT}', $font, 7, [0.35, 0.40, 0.48]);

        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$filename.'.pdf"',
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}