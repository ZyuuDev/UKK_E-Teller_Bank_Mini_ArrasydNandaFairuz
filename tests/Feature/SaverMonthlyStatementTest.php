<?php

namespace Tests\Feature;

use App\Models\Member;
use App\Models\Saver;
use App\Models\Transaction;
use App\Models\User;
use App\Services\BankingService;
use App\Services\CashSessionService;
use App\Services\MemberService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SaverMonthlyStatementTest extends TestCase
{
    private User $admin;
    private User $teller;
    private Member $member;
    private Saver $saver;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow(Carbon::parse('2026-11-10 10:00:00', 'Asia/Jakarta'));
        if (DB::connection()->getDriverName() !== 'mysql' || DB::connection()->getDatabaseName() !== 'bank_mini_test') {
            throw new \RuntimeException('Tes hanya boleh berjalan pada MySQL bank_mini_test.');
        }
        DB::beginTransaction();
        $this->admin = User::create([
            'username' => 'admin_'.Str::random(8),
            'password' => 'TestingPassword123!',
            'name' => 'Admin Uji Rekap',
            'role' => 'admin',
            'is_active' => true,
        ]);
        $this->teller = User::create([
            'username' => 'teller_'.Str::random(8),
            'password' => 'TestingPassword123!',
            'name' => 'Teller Uji Rekap',
            'role' => 'teller',
            'is_active' => true,
        ]);
        $this->member = app(MemberService::class)->create([
            'student_number' => (string) random_int(100000000, 999999999),
            'full_name' => 'Nasabah Uji Rekap',
            'graduation_year' => 2027,
            'major' => 'AKL',
        ], $this->admin->id);
        $this->member->user->update(['must_change_password' => false]);
        $this->member->update(['account_status' => 'active']);

        $this->saver = Saver::create([
            'user_id' => $this->member->user_id,
            'account_number' => '10010001',
            'balance' => 200000,
            'security_pin' => '123456',
            'qr_code_token' => Str::random(32),
            'activated_at' => Carbon::parse('2026-10-15 09:00:00'),
            'activated_by' => $this->teller->id,
        ]);

        $sessionId = DB::table('cash_sessions')->insertGetId([
            'teller_id' => $this->teller->id,
            'date' => '2026-10-15',
            'opening_balance' => 500000,
            'status' => 'approved',
            'created_at' => Carbon::parse('2026-10-15 08:00:00'),
            'updated_at' => Carbon::parse('2026-10-15 17:00:00'),
        ]);

        // 1. Transaction in October 2026: Deposit 100.000
        Transaction::create([
            'saver_id' => $this->saver->id,
            'teller_id' => $this->teller->id,
            'cash_session_id' => $sessionId,
            'request_id' => (string) Str::uuid(),
            'transaction_type' => 'Deposit',
            'amount' => 100000,
            'date' => '2026-10-15',
            'balance_after' => 100000,
            'notes' => 'Setoran awal aktivasi',
            'created_at' => Carbon::parse('2026-10-15 09:00:00', 'Asia/Jakarta'),
        ]);

        // 2. Transaction in November 2026: Deposit 150.000 (balance: 250.000)
        Transaction::create([
            'saver_id' => $this->saver->id,
            'teller_id' => $this->teller->id,
            'cash_session_id' => $sessionId,
            'request_id' => (string) Str::uuid(),
            'transaction_type' => 'Deposit',
            'amount' => 150000,
            'date' => '2026-11-02',
            'balance_after' => 250000,
            'notes' => 'Setoran tabungan SPP',
            'created_at' => Carbon::parse('2026-11-02 10:30:00', 'Asia/Jakarta'),
        ]);

        // 3. Transaction in November 2026: Withdrawal 50.000 (balance: 200.000)
        Transaction::create([
            'saver_id' => $this->saver->id,
            'teller_id' => $this->teller->id,
            'cash_session_id' => $sessionId,
            'request_id' => (string) Str::uuid(),
            'transaction_type' => 'Withdrawal',
            'amount' => 50000,
            'date' => '2026-11-05',
            'balance_after' => 200000,
            'notes' => 'Tarik uang saku',
            'created_at' => Carbon::parse('2026-11-05 14:15:00', 'Asia/Jakarta'),
        ]);

        Carbon::setTestNow(Carbon::parse('2026-11-10 10:00:00', 'Asia/Jakarta'));
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        while (DB::connection()->transactionLevel() > 0) {
            DB::rollBack();
        }
        parent::tearDown();
    }

    public function test_guest_cannot_access_saver_monthly_statement(): void
    {
        $this->getJson("/api/admin/savers/{$this->saver->id}/statement")->assertUnauthorized();
    }

    public function test_teller_cannot_access_admin_saver_monthly_statement(): void
    {
        Sanctum::actingAs($this->teller);
        $this->getJson("/api/admin/savers/{$this->saver->id}/statement")->assertForbidden();
    }

    public function test_admin_can_retrieve_saver_monthly_statement_with_exact_balances(): void
    {
        Sanctum::actingAs($this->admin);

        // Fetch statement for November 2026
        $response = $this->getJson("/api/admin/savers/{$this->saver->id}/statement?month=2026-11");
        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'saver' => ['id', 'account_number', 'full_name', 'student_number', 'major', 'graduation_year', 'current_balance', 'account_status'],
                    'period' => ['month', 'label', 'start_date', 'end_date'],
                    'summary' => ['starting_balance', 'total_deposits', 'total_withdrawals', 'net_flow', 'ending_balance', 'transaction_count'],
                    'transactions',
                ],
            ]);

        $data = $response->json('data');
        $this->assertSame($this->saver->account_number, $data['saver']['account_number']);
        $this->assertSame('Nasabah Uji Rekap', $data['saver']['full_name']);

        // Starting balance before November should be 100.000 (the October activation deposit)
        $this->assertSame(100000, $data['summary']['starting_balance']);
        // Deposits in November = 150.000
        $this->assertSame(150000, $data['summary']['total_deposits']);
        // Withdrawals in November = 50.000
        $this->assertSame(50000, $data['summary']['total_withdrawals']);
        // Net flow = 100.000
        $this->assertSame(100000, $data['summary']['net_flow']);
        // Ending balance at end of November = 200.000
        $this->assertSame(200000, $data['summary']['ending_balance']);
        $this->assertSame(2, $data['summary']['transaction_count']);

        // Transactions list check
        $this->assertCount(2, $data['transactions']);
        $this->assertSame('Setoran', $data['transactions'][0]['type_label']);
        $this->assertSame(150000, $data['transactions'][0]['amount']);
        $this->assertSame(250000, $data['transactions'][0]['balance_after']);

        $this->assertSame('Penarikan', $data['transactions'][1]['type_label']);
        $this->assertSame(50000, $data['transactions'][1]['amount']);
        $this->assertSame(200000, $data['transactions'][1]['balance_after']);
    }

    public function test_admin_can_export_saver_monthly_statement_as_csv(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->get("/api/admin/savers/{$this->saver->id}/statement/export?month=2026-11&format=csv");
        $response->assertOk();
        $this->assertTrue(str_contains($response->headers->get('Content-Type'), 'text/csv'));
        $content = $response->streamedContent();

        $this->assertStringContainsString('REKENING KORAN', $content);
        $this->assertStringContainsString($this->saver->account_number, $content);
        $this->assertStringContainsString('Nasabah Uji Rekap', $content);
        $this->assertStringContainsString('150000', $content);
        $this->assertStringContainsString('50000', $content);
        $this->assertStringContainsString('200000', $content);
    }

    public function test_admin_can_export_saver_monthly_statement_as_pdf(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->get("/api/admin/savers/{$this->saver->id}/statement/export?month=2026-11&format=pdf");
        $response->assertOk();
        $this->assertSame('application/pdf', $response->headers->get('Content-Type'));
        $this->assertNotEmpty($response->getContent());
    }

    public function test_transaction_reports_can_filter_by_account_number(): void
    {
        Sanctum::actingAs($this->admin);

        // Filter by the specific account number
        $response = $this->getJson("/api/reports/transactions?period=monthly&month=2026-11&account_number={$this->saver->account_number}");
        $response->assertOk();

        $rows = $response->json('data.transactions.data');
        $this->assertNotEmpty($rows);
        foreach ($rows as $row) {
            $this->assertSame($this->saver->account_number, $row['account_number']);
        }
    }
}
