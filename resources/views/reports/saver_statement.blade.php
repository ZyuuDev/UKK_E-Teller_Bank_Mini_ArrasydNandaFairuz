<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Rekening Koran - {{ $saver['account_number'] }} - {{ $period['label'] }}</title>
    <style>
        @page { margin: 28px 24px; }
        body { font-family: DejaVu Sans, sans-serif; color: #111b35; font-size: 8.5px; line-height: 1.35; margin: 0; padding: 0; }
        .header { width: 100%; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-bottom: 12px; }
        .logo { float: right; width: 48px; height: 48px; margin-top: -2px; }
        .brand-title { font-size: 16px; font-weight: bold; color: #1e3a8a; margin: 0 0 2px; }
        .brand-sub { font-size: 10px; font-weight: bold; color: #2563eb; letter-spacing: 0.5px; text-transform: uppercase; margin: 0 0 2px; }
        .brand-address { font-size: 8px; color: #59677c; margin: 0; }
        
        .info-grid { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        .info-grid td { vertical-align: top; padding: 3px 6px; }
        .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px 8px; }
        .info-table { width: 100%; border-collapse: collapse; }
        .info-table td { padding: 2px 0; font-size: 8px; border: none; }
        .info-label { width: 36%; color: #64748b; font-weight: normal; }
        .info-value { width: 64%; color: #0f172a; font-weight: bold; }
        
        .summary-box { width: 100%; border-collapse: collapse; margin-bottom: 14px; background: #eef5ff; border: 1px solid #bfdbfe; border-radius: 4px; }
        .summary-box td { text-align: center; padding: 7px 4px; vertical-align: middle; border-right: 1px solid #dbeafe; }
        .summary-box td:last-child { border-right: none; }
        .summary-label { font-size: 7.5px; color: #475569; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 2px; }
        .summary-amount { font-size: 11px; font-weight: bold; color: #1e3a8a; }
        .summary-credit { color: #059669; }
        .summary-debit { color: #dc2626; }
        
        .section-title { font-size: 10px; font-weight: bold; color: #1e3a8a; margin: 0 0 6px; text-transform: uppercase; }
        
        table.transactions { width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: 16px; }
        table.transactions th, table.transactions td { border-bottom: 1px solid #e2e8f0; padding: 5px 4px; text-align: left; vertical-align: top; word-wrap: break-word; font-size: 8px; }
        table.transactions th { background: #f1f5f9; color: #334155; font-weight: bold; border-top: 1px solid #cbd5e1; border-bottom: 1.5px solid #94a3b8; }
        thead { display: table-header-group; }
        tr { page-break-inside: avoid; }
        
        .number { text-align: right; }
        .credit { color: #059669; font-weight: bold; }
        .debit { color: #dc2626; font-weight: bold; }
        .badge { display: inline-block; padding: 1px 4px; border-radius: 3px; font-size: 7px; font-weight: bold; }
        .badge-deposit { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
        .badge-withdraw { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
        
        .signatures { width: 100%; border-collapse: collapse; margin-top: 20px; page-break-inside: avoid; }
        .signatures td { width: 50%; text-align: center; vertical-align: top; border: none; padding: 0 16px; font-size: 8px; }
        .sign-space { height: 50px; }
        .sign-name { font-weight: bold; border-top: 1px solid #94a3b8; padding-top: 4px; display: inline-block; min-width: 140px; }
        
        .disclaimer { margin-top: 16px; padding-top: 6px; border-top: 1px dashed #cbd5e1; font-size: 7px; color: #64748b; line-height: 1.3; }
    </style>
</head>
<body>
    <div class="header">
        @if($logo)<img class="logo" src="{{ $logo }}" alt="Bank Mini">@endif
        <div class="brand-title">BANK MINI SMKN 1 BANTUL</div>
        <div class="brand-sub">Rekening Koran / Rekap Mutasi Bulanan Nasabah</div>
        <div class="brand-address">Jl. Sabdodadi, Trirenggo, Bantul, D.I. Yogyakarta 55715 · Telp: (0274) 367156 · Email: bankmini@smkn1bantul.sch.id</div>
    </div>

    <table class="info-grid">
        <tr>
            <td style="width: 50%; padding-left: 0;">
                <div class="info-card">
                    <table class="info-table">
                        <tr>
                            <td class="info-label">Nama Nasabah</td>
                            <td class="info-value">: {{ $saver['full_name'] }}</td>
                        </tr>
                        <tr>
                            <td class="info-label">No. Rekening</td>
                            <td class="info-value">: {{ $saver['account_number'] }}</td>
                        </tr>
                        <tr>
                            <td class="info-label">NIS / Anggota</td>
                            <td class="info-value">: {{ $saver['student_number'] }}</td>
                        </tr>
                        <tr>
                            <td class="info-label">Jurusan / Kelas</td>
                            <td class="info-value">: {{ $saver['major'] }} (Lulus {{ $saver['graduation_year'] }})</td>
                        </tr>
                    </table>
                </div>
            </td>
            <td style="width: 50%; padding-right: 0;">
                <div class="info-card">
                    <table class="info-table">
                        <tr>
                            <td class="info-label">Periode Rekap</td>
                            <td class="info-value">: {{ $period['label'] }}</td>
                        </tr>
                        <tr>
                            <td class="info-label">Tanggal Cetak</td>
                            <td class="info-value">: {{ $printedAt }}</td>
                        </tr>
                        <tr>
                            <td class="info-label">Status Akun</td>
                            <td class="info-value">: {{ strtoupper($saver['account_status']) }}</td>
                        </tr>
                        <tr>
                            <td class="info-label">Mata Uang</td>
                            <td class="info-value">: IDR (Rupiah)</td>
                        </tr>
                    </table>
                </div>
            </td>
        </tr>
    </table>

    <table class="summary-box">
        <tr>
            <td style="width: 25%;">
                <div class="summary-label">Saldo Awal Bulan</div>
                <div class="summary-amount">Rp {{ number_format($summary['starting_balance'], 0, ',', '.') }}</div>
            </td>
            <td style="width: 25%;">
                <div class="summary-label">Total Setoran (Kredit)</div>
                <div class="summary-amount summary-credit">+ Rp {{ number_format($summary['total_deposits'], 0, ',', '.') }}</div>
            </td>
            <td style="width: 25%;">
                <div class="summary-label">Total Penarikan (Debet)</div>
                <div class="summary-amount summary-debit">- Rp {{ number_format($summary['total_withdrawals'], 0, ',', '.') }}</div>
            </td>
            <td style="width: 25%;">
                <div class="summary-label">Saldo Akhir Bulan</div>
                <div class="summary-amount">Rp {{ number_format($summary['ending_balance'], 0, ',', '.') }}</div>
            </td>
        </tr>
    </table>

    <div class="section-title">Rincian Riwayat Mutasi Transaksi ({{ $summary['transaction_count'] }} Transaksi)</div>
    <table class="transactions">
        <thead>
            <tr>
                <th style="width: 5%; text-align: center;">No</th>
                <th style="width: 17%;">Waktu WIB</th>
                <th style="width: 14%;">Referensi</th>
                <th style="width: 23%;">Keterangan / Catatan</th>
                <th style="width: 11%;">Teller</th>
                <th class="number" style="width: 15%;">Debet (Rp)</th>
                <th class="number" style="width: 15%;">Kredit (Rp)</th>
                <th class="number" style="width: 16%;">Saldo (Rp)</th>
            </tr>
        </thead>
        <tbody>
        @forelse($transactions as $index => $tx)
            <tr>
                <td style="text-align: center;">{{ $index + 1 }}</td>
                <td>{{ $tx['created_at'] }}</td>
                <td><strong>{{ $tx['ref'] }}</strong></td>
                <td>
                    <span class="badge {{ $tx['transaction_type'] === 'Deposit' ? 'badge-deposit' : 'badge-withdraw' }}">{{ $tx['type_label'] }}</span>
                    @if(!empty($tx['notes']))
                        <br><span style="color: #475569;">{{ $tx['notes'] }}</span>
                    @endif
                </td>
                <td>{{ $tx['teller_name'] }}</td>
                <td class="number {{ $tx['transaction_type'] === 'Withdrawal' ? 'debit' : '' }}">
                    {{ $tx['transaction_type'] === 'Withdrawal' ? number_format($tx['amount'], 0, ',', '.') : '-' }}
                </td>
                <td class="number {{ $tx['transaction_type'] === 'Deposit' ? 'credit' : '' }}">
                    {{ $tx['transaction_type'] === 'Deposit' ? number_format($tx['amount'], 0, ',', '.') : '-' }}
                </td>
                <td class="number" style="font-weight: bold;">{{ number_format($tx['balance_after'], 0, ',', '.') }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="8" style="text-align: center; padding: 18px; color: #64748b;">
                    Tidak ada mutasi transaksi pada periode {{ $period['label'] }}.
                </td>
            </tr>
        @endforelse
        </tbody>
        @if(count($transactions) > 0)
        <tfoot>
            <tr style="background: #f8fafc; font-weight: bold; border-top: 1.5px solid #cbd5e1;">
                <td colspan="5" style="text-align: right; padding-right: 8px;">TOTAL MUTASI:</td>
                <td class="number debit">Rp {{ number_format($summary['total_withdrawals'], 0, ',', '.') }}</td>
                <td class="number credit">Rp {{ number_format($summary['total_deposits'], 0, ',', '.') }}</td>
                <td class="number">Rp {{ number_format($summary['ending_balance'], 0, ',', '.') }}</td>
            </tr>
        </tfoot>
        @endif
    </table>

    <table class="signatures">
        <tr>
            <td>
                <div>Mengetahui,</div>
                <div>Nasabah Siswa</div>
                <div class="sign-space"></div>
                <div class="sign-name">{{ $saver['full_name'] }}</div>
                <div style="font-size: 7.5px; color: #64748b;">NIS: {{ $saver['student_number'] }}</div>
            </td>
            <td>
                <div>Bantul, {{ now('Asia/Jakarta')->translatedFormat('d F Y') }}</div>
                <div>Pengelola / Teller Bank Mini</div>
                <div class="sign-space"></div>
                <div class="sign-name">{{ $printedBy }}</div>
                <div style="font-size: 7.5px; color: #64748b;">Sistem E-Teller Bank Mini</div>
            </td>
        </tr>
    </table>

    <div class="disclaimer">
        * Dokumen rekening koran ini dicetak otomatis secara elektronik oleh Sistem Informasi E-Teller Bank Mini SMKN 1 Bantul dan dinyatakan sah.<br>
        * Apabila terdapat perbedaan catatan saldo atau transaksi, silakan menghubungi petugas Teller Bank Mini dengan membawa dokumen ini beserta kartu pelajar asli maksimal 7 hari kerja sejak diterbitkan.
    </div>
</body>
</html>

