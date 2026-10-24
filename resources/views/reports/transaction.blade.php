<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Laporan Bank Mini</title>
    <style>
        @page { margin: 24px; }
        body { font-family: DejaVu Sans, sans-serif; color: #111b35; font-size: 9px; }
        h1 { font-size: 18px; margin: 0 0 6px; }
        h2 { font-size: 12px; margin: 18px 0 8px; }
        .logo { float: right; width: 50px; }
        .muted { color: #59677c; }
        .summary { padding: 10px; background: #eef5ff; margin: 14px 0; }
        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        th, td { border-bottom: 1px solid #e7ecf3; text-align: left; padding: 6px 4px; word-wrap: break-word; vertical-align: top; }
        th { background: #eef5ff; }
        thead { display: table-header-group; }
        tr { page-break-inside: avoid; }
        .number { text-align: right; }
        .difference { font-weight: bold; color: #b32235; }
    </style>
</head>
<body>
@if($logo)<img class="logo" src="{{ $logo }}" alt="Bank Mini">@endif
<h1>Bank Mini SMKN 1 Bantul</h1>
<div>Laporan transaksi {{ $filters['period'] === 'daily' ? 'harian' : 'bulanan' }} - {{ $filters['label'] }}</div>
<div class="muted">Lingkup: {{ $filters['teller_id'] ? 'Teller ID '.$filters['teller_id'] : 'Semua teller' }} | Dibuat {{ $printedAt }}</div>
<div class="summary">
    {{ $summary['entries'] }} transaksi |
    Setoran Rp{{ number_format($summary['deposits'], 0, ',', '.') }} |
    Penarikan Rp{{ number_format($summary['withdrawals'], 0, ',', '.') }} |
    Arus bersih Rp{{ number_format($summary['net_flow'], 0, ',', '.') }}
</div>
<p class="muted">Arus bersih = setoran - penarikan. Nilai ini bukan saldo kas penutupan dan tidak mencakup modal awal/pemindahan kas. Ekspor ini tidak menyatakan laporan telah disetujui.</p>
<h2>Transaksi tersimpan</h2>
<table>
    <thead><tr><th>Ref / waktu WIB</th><th>Rekening</th><th>Nama siswa</th><th>Teller</th><th>Jenis</th><th class="number">Nominal</th><th class="number">Saldo sesudah</th><th>Catatan</th></tr></thead>
    <tbody>
    @forelse($rows as $row)
        <tr>
            <td>TRX-{{ $row['id'] }}<br>{{ $row['created_at'] }}</td>
            <td>{{ $row['account_number'] }}</td><td>{{ $row['full_name'] }}</td><td>{{ $row['teller_name'] }}</td>
            <td>{{ $row['type_label'] }}</td>
            <td class="number">{{ number_format($row['amount'], 0, ',', '.') }}</td>
            <td class="number">{{ $row['balance_after'] === null ? 'Tidak tersedia' : number_format($row['balance_after'], 0, ',', '.') }}</td>
            <td>{{ $row['notes'] }}</td>
        </tr>
    @empty
        <tr><td colspan="8">Tidak ada transaksi pada periode ini.</td></tr>
    @endforelse
    </tbody>
</table>
<h2>Rekonsiliasi kas yang sudah diajukan pada periode ini</h2>
<table>
    <thead><tr><th>Tanggal / teller</th><th class="number">Modal awal</th><th class="number">Setoran</th><th class="number">Penarikan</th><th class="number">Kas sistem</th><th class="number">Uang fisik</th><th class="number">Selisih</th><th>Status server</th></tr></thead>
    <tbody>
    @forelse($reconciliations as $report)
        <tr>
            <td>{{ $report->date->format('d/m/Y') }}<br>{{ $report->teller?->name ?? 'ID '.$report->teller_id }}</td>
            <td class="number">{{ number_format($report->opening_balance, 0, ',', '.') }}</td>
            <td class="number">{{ number_format($report->total_deposits, 0, ',', '.') }}</td>
            <td class="number">{{ number_format($report->total_withdrawals, 0, ',', '.') }}</td>
            <td class="number">{{ number_format($report->expected_closing_balance, 0, ',', '.') }}</td>
            <td class="number">{{ number_format($report->actual_cash_on_hand, 0, ',', '.') }}</td>
            <td class="number {{ $report->discrepancy != 0 ? 'difference' : '' }}">{{ number_format($report->discrepancy, 0, ',', '.') }}</td>
            <td>{{ $report->status }}</td>
        </tr>
    @empty
        <tr><td colspan="8">Belum ada rekonsiliasi yang diajukan untuk periode/lingkup ini. Ini bukan bukti bahwa kas telah diperiksa.</td></tr>
    @endforelse
    </tbody>
</table>
<p class="muted">Status ditampilkan sesuai database. Jika sesi belum ditutup, transaksi tetap dapat muncul sementara rekonsiliasinya belum ada. Saldo penutupan setiap hari tidak dijumlahkan sebagai saldo bulanan.</p>
</body>
</html>