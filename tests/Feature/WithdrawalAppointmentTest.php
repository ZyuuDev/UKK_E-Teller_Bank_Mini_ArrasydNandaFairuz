<?php

namespace Tests\Feature;

use App\Models\Member;
use App\Models\Saver;
use App\Models\Transaction;
use App\Models\User;
use App\Models\WithdrawalAppointment;
use App\Services\BankingService;
use App\Services\CashSessionService;
use App\Services\MemberService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WithdrawalAppointmentTest extends TestCase
{
    private User $admin;
    private User $teller;
    private Member $member;
    private Saver $saver;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow(Carbon::parse('2026-11-10 09:00:00', 'Asia/Jakarta'));

        if (DB::connection()->getDriverName() !== 'mysql' || DB::connection()->getDatabaseName() !== 'bank_mini_test') {
            throw new \RuntimeException('Tes hanya boleh berjalan pada MySQL bank_mini_test.');
        }

        DB::beginTransaction();

        $this->admin = User::create([
            'username' => 'admin_' . Str::random(8),
            'password' => 'TestingPassword123!',
            'name' => 'Admin Test',
            'role' => 'admin',
            'is_active' => true,
            'must_change_password' => false,
        ]);

        $this->teller = User::create([
            'username' => 'teller_' . Str::random(8),
            'password' => 'TestingPassword123!',
            'name' => 'Teller Test',
            'role' => 'teller',
            'is_active' => true,
            'must_change_password' => false,
        ]);

        $this->member = app(MemberService::class)->create([
            'student_number' => (string) random_int(100000000, 999999999),
            'full_name' => 'Siswa Test Penarikan',
            'graduation_year' => 2028,
        ], $this->admin->id);
        $this->member->user->update(['must_change_password' => false]);

        app(CashSessionService::class)->open($this->teller->id, 5000000);

        Sanctum::actingAs($this->teller);
        $this->postJson('/api/teller/activate', [
            'member_id' => $this->member->user_id,
            'amount' => 2000000,
            'security_pin' => '123456',
            'request_id' => (string) Str::uuid(),
        ])->assertCreated();

        $this->saver = Saver::where('user_id', $this->member->user_id)->firstOrFail();
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        while (DB::connection()->transactionLevel() > 0) {
            DB::rollBack();
        }
        parent::tearDown();
    }

    public function test_exact_one_million_balance_can_only_withdraw_up_to_990_thousand(): void
    {
        $this->saver->update(['balance' => 1000000]);

        Sanctum::actingAs($this->teller);

        $this->postJson('/api/teller/withdraw', [
            'account_number' => $this->saver->account_number,
            'amount' => 990001,
            'security_pin' => '123456',
            'request_id' => (string) Str::uuid(),
        ])->assertUnprocessable();

        $this->postJson('/api/teller/withdraw', [
            'account_number' => $this->saver->account_number,
            'amount' => 990000,
            'security_pin' => '123456',
            'request_id' => (string) Str::uuid(),
        ])->assertCreated();

        $this->assertSame(10000, $this->saver->fresh()->balance);
    }

    public function test_withdrawal_up_to_one_million_succeeds_without_appointment(): void
    {
        Sanctum::actingAs($this->teller);

        $this->postJson('/api/teller/withdraw', [
            'account_number' => $this->saver->account_number,
            'amount' => 600000,
            'security_pin' => '123456',
            'request_id' => (string) Str::uuid(),
        ])->assertCreated();

        $this->postJson('/api/teller/withdraw', [
            'account_number' => $this->saver->account_number,
            'amount' => 400000,
            'security_pin' => '123456',
            'request_id' => (string) Str::uuid(),
        ])->assertCreated();

        $this->assertSame(1000000, $this->saver->fresh()->balance);

        $this->postJson('/api/teller/withdraw', [
            'account_number' => $this->saver->account_number,
            'amount' => 50000,
            'security_pin' => '123456',
            'request_id' => (string) Str::uuid(),
        ])->assertUnprocessable();
    }

    public function test_withdrawal_above_one_million_rejected_without_approved_appointment(): void
    {
        Sanctum::actingAs($this->teller);

        $response = $this->postJson('/api/teller/withdraw', [
            'account_number' => $this->saver->account_number,
            'amount' => 1200000,
            'security_pin' => '123456',
            'request_id' => (string) Str::uuid(),
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['amount']);
    }

    public function test_student_and_teller_can_create_appointment_and_admin_approves(): void
    {
        $studentUser = User::find($this->member->user_id);
        $studentUser->update(['must_change_password' => false]);

        Sanctum::actingAs($studentUser);
        $studentRes = $this->postJson('/api/student/appointments', [
            'amount' => 1500000,
            'scheduled_date' => '2026-11-11',
            'notes' => 'Keperluan biaya ujian',
        ]);
        $studentRes->assertCreated();
        $studentApptId = $studentRes->json('data.id');

        Sanctum::actingAs($this->teller);
        $this->postJson('/api/admin/appointments/' . $studentApptId . '/approve')->assertForbidden();

        Sanctum::actingAs($this->admin);
        $this->postJson('/api/admin/appointments/' . $studentApptId . '/approve')->assertOk();

        $appt = WithdrawalAppointment::find($studentApptId);
        $this->assertSame('approved', $appt->status);
        $this->assertSame($this->admin->id, $appt->approved_by);

        $session = DB::table('cash_sessions')->where('teller_id', $this->teller->id)->first();
        $report = app(CashSessionService::class)->submit($session->id, $this->teller->id, 7000000);
        Sanctum::actingAs($this->admin);
        $this->postJson('/api/admin/reconciliations/' . $report->id . '/approve')->assertOk();

        Carbon::setTestNow(Carbon::parse('2026-11-11 10:00:00', 'Asia/Jakarta'));
        app(CashSessionService::class)->open($this->teller->id, 5000000);

        Sanctum::actingAs($this->teller);
        $res = $this->postJson('/api/teller/withdraw', [
            'account_number' => $this->saver->account_number,
            'amount' => 1500000,
            'security_pin' => '123456',
            'appointment_id' => $appt->id,
            'request_id' => (string) Str::uuid(),
        ]);
        $res->assertCreated();

        $this->assertSame('completed', $appt->fresh()->status);
        $this->assertSame(500000, $this->saver->fresh()->balance);
    }
}
