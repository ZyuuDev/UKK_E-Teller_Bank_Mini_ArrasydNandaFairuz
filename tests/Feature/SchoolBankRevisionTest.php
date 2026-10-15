<?php

namespace Tests\Feature;

use App\Jobs\SendAccessCode;
use App\Models\Member;
use App\Models\Saver;
use App\Models\Transaction;
use App\Models\User;
use App\Services\AccessCodeService;
use App\Services\AuditService;
use App\Services\BankingService;
use App\Services\CashSessionService;
use App\Services\MemberService;
use App\Services\StudentImportService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SchoolBankRevisionTest extends TestCase
{
    private User $admin;
    private User $teller;
    private Member $member;

    protected function setUp(): void
    {
        parent::setUp();
        if (DB::connection()->getDriverName() !== 'mysql' || DB::connection()->getDatabaseName() !== 'bank_mini_test') {
            throw new \RuntimeException('Tes hanya boleh berjalan pada MySQL bank_mini_test.');
        }
        DB::beginTransaction();
        $this->admin = User::create(['username' => 'admin_'.Str::random(8), 'password' => 'TestingPassword123!', 'name' => 'Admin uji', 'role' => 'admin', 'is_active' => true]);
        $this->teller = User::create(['username' => 'teller_'.Str::random(8), 'password' => 'TestingPassword123!', 'name' => 'Teller uji', 'role' => 'teller', 'is_active' => true]);
        $this->member = app(MemberService::class)->create(['student_number' => (string) random_int(100000000, 999999999), 'full_name' => 'Siswa uji', 'graduation_year' => 2029], $this->admin->id);
        $this->member->user->update(['must_change_password' => false]);
        app(CashSessionService::class)->open($this->teller->id, 100000);
    }

    protected function tearDown(): void
    {
        while (DB::connection()->transactionLevel() > 0) {
            DB::rollBack();
        }
        parent::tearDown();
    }

    private function activation(): array
    {
        return ['member_id' => $this->member->user_id, 'amount' => 50000, 'security_pin' => '123456', 'request_id' => (string) Str::uuid()];
    }

    public function test_activation_and_fixed_minimum_balance(): void
    {
        Sanctum::actingAs($this->teller);
        $this->postJson('/api/teller/activate', $this->activation())->assertCreated();
        $saver = Saver::where('user_id', $this->member->user_id)->firstOrFail();
        $this->assertSame(40000, $saver->profile()['available_balance']);
        $this->postJson('/api/teller/withdraw', ['account_number' => $saver->account_number, 'amount' => 40000, 'security_pin' => '123456', 'request_id' => (string) Str::uuid()])->assertCreated();
        $this->assertSame(10000, $saver->fresh()->balance);
        $this->postJson('/api/teller/withdraw', ['account_number' => $saver->account_number, 'amount' => 1, 'security_pin' => '123456', 'request_id' => (string) Str::uuid()])->assertUnprocessable();
        $this->assertSame(2, Transaction::where('saver_id', $saver->id)->count());
    }

    public function test_activation_retry_is_not_a_second_deposit(): void
    {
        Sanctum::actingAs($this->teller);
        $payload = $this->activation();
        $first = $this->postJson('/api/teller/activate', $payload)->assertCreated()->json('data.id');
        $second = $this->postJson('/api/teller/activate', $payload)->assertCreated()->json('data.id');
        $this->assertSame($first, $second);
        $this->assertSame(2, DB::table('journal_entries')->where('transaction_id', $first)->count());
        $this->assertSame(50000, Saver::where('user_id', $this->member->user_id)->firstOrFail()->balance);
    }

    public function test_admin_cannot_execute_teller_transaction(): void
    {
        Sanctum::actingAs($this->admin);
        $this->postJson('/api/teller/activate', $this->activation())->assertForbidden();
        $this->assertFalse(Saver::where('user_id', $this->member->user_id)->exists());
    }

    public function test_first_deposit_below_minimum_is_rejected(): void
    {
        Sanctum::actingAs($this->teller);
        $payload = $this->activation();
        $payload['amount'] = 9999;
        $this->postJson('/api/teller/activate', $payload)->assertUnprocessable();
        $this->assertSame('inactive', $this->member->fresh()->account_status);
        $this->assertFalse(Saver::where('user_id', $this->member->user_id)->exists());
    }

    public function test_closing_locks_transactions_and_approval_is_once(): void
    {
        $payload = $this->activation();
        app(BankingService::class)->activate($this->member->user_id, 50000, '123456', $this->teller->id, $payload['request_id']);
        $session = DB::table('cash_sessions')->where('teller_id', $this->teller->id)->first();
        $report = app(CashSessionService::class)->submit($session->id, $this->teller->id, 150000);
        Sanctum::actingAs($this->teller);
        $saver = Saver::where('user_id', $this->member->user_id)->firstOrFail();
        $this->postJson('/api/teller/deposit', ['account_number' => $saver->account_number, 'amount' => 1000, 'request_id' => (string) Str::uuid()])->assertUnprocessable();
        Sanctum::actingAs($this->admin);
        $this->postJson('/api/admin/reconciliations/'.$report->id.'/approve')->assertOk();
        $this->postJson('/api/admin/reconciliations/'.$report->id.'/approve')->assertConflict();
        $this->assertSame(1, DB::table('cash_transfers')->where('daily_reconciliation_id', $report->id)->count());
        $this->assertSame(50000, $saver->fresh()->balance);
    }

    public function test_duplicate_import_does_not_create_savers(): void
    {
        $file = UploadedFile::fake()->createWithContent('students.csv', "student_number,full_name,graduation_year\n001234,Contoh Siswa,2029\n001234,Contoh Siswa,2029\n");
        $preview = app(StudentImportService::class)->preview($file, $this->admin->id);
        $this->assertSame('001234', $preview['rows'][0]['data']['student_number']);
        $this->assertSame('duplicate', $preview['rows'][1]['status']);
        $result = app(StudentImportService::class)->commit($preview['id'], $this->admin->id);
        $again = app(StudentImportService::class)->commit($preview['id'], $this->admin->id);
        $this->assertSame($result, $again);
        $this->assertSame(1, Member::where('student_number', '001234')->count());
        $imported = Member::where('student_number', '001234')->firstOrFail();
        $this->assertFalse($imported->saver()->exists());
    }

    public function test_failed_final_write_rolls_back_activation(): void
    {
        $audit = \Mockery::mock(AuditService::class);
        $audit->shouldReceive('record')->andReturnUsing(function ($actor, $action) {
            if ($action === 'transaction.created') throw new \RuntimeException('Simulasi kegagalan tulis pada database uji.');
        });
        $this->app->instance(AuditService::class, $audit);
        Sanctum::actingAs($this->teller);
        $this->withoutExceptionHandling();
        try {
            $this->postJson('/api/teller/activate', $this->activation());
            $this->fail('Kegagalan seharusnya terjadi.');
        } catch (\RuntimeException $failure) {
            $this->assertStringContainsString('Simulasi', $failure->getMessage());
        }
        $this->assertFalse(Saver::where('user_id', $this->member->user_id)->exists());
        $this->assertSame('inactive', $this->member->fresh()->account_status);
    }

    public function test_password_reset_code_is_single_use(): void
    {
        Queue::fake();
        $user = $this->member->user;
        $user->update(['email' => Str::lower(Str::random(10)).'@example.test', 'email_verified_at' => now()]);
        $user->createToken('test');
        $service = app(AccessCodeService::class);
        $service->issue($user, 'password_reset');
        $code = null;
        Queue::assertPushed(SendAccessCode::class, function ($job) use (&$code) { $code = $job->code; return true; });
        $this->assertNotNull($code);
        $this->assertTrue($service->consume($user->email, 'password_reset', $code, 'NewTestingPassword123!'));
        $this->assertFalse($service->consume($user->email, 'password_reset', $code, 'OtherTestingPassword123!'));
        $this->assertTrue(Hash::check('NewTestingPassword123!', $user->fresh()->password));
        $this->assertSame(0, $user->tokens()->count());
    }
}