<?php

namespace Tests\Feature;

use App\Models\DailyReconciliation;
use App\Models\User;
use App\Services\CashSessionService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CashSessionAutoCloseTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $teller;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'username' => 'admin_test',
            'password' => 'Testing123!',
            'name' => 'Admin Utama',
            'role' => 'admin',
            'is_active' => true,
        ]);

        $this->teller = User::create([
            'username' => 'teller_test',
            'password' => 'Testing123!',
            'name' => 'Budi Teller',
            'role' => 'teller',
            'is_active' => true,
        ]);
    }

    public function test_forgotten_sessions_from_past_days_are_auto_closed_with_zero_actual_cash(): void
    {
        $pastDate = now('Asia/Jakarta')->subDays(2)->toDateString();

        $sessionId = DB::table('cash_sessions')->insertGetId([
            'teller_id' => $this->teller->id,
            'date' => $pastDate,
            'opening_balance' => 500000,
            'status' => 'open',
            'created_at' => now()->subDays(2),
            'updated_at' => now()->subDays(2),
        ]);

        $service = app(CashSessionService::class);
        $closed = $service->autoCloseForgottenSessions();

        $this->assertSame(1, $closed);

        $session = DB::table('cash_sessions')->where('id', $sessionId)->first();
        $this->assertSame('submitted', $session->status);

        $report = DailyReconciliation::where('cash_session_id', $sessionId)->first();
        $this->assertNotNull($report);
        $this->assertSame('disputed', $report->status);
        $this->assertSame(0, (int) $report->actual_cash_on_hand);
        $this->assertSame(500000, (int) $report->expected_closing_balance);
        $this->assertSame(-500000, (int) $report->discrepancy);
        $this->assertStringContainsString('17:00 WIB', $report->rejection_reason);

        $audit = DB::table('audit_logs')
            ->where('action', 'cash_session.auto_closed')
            ->where('subject_id', $report->id)
            ->first();

        $this->assertNotNull($audit);
    }

    public function test_todays_session_is_auto_closed_when_time_reaches_17_00(): void
    {
        $today = now('Asia/Jakarta')->toDateString();

        $sessionId = DB::table('cash_sessions')->insertGetId([
            'teller_id' => $this->teller->id,
            'date' => $today,
            'opening_balance' => 250000,
            'status' => 'open',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $service = app(CashSessionService::class);

        // Simulasi sebelum jam 17:00 (14:30 WIB) -> tidak ditutup
        $time1430 = Carbon::parse("{$today} 14:30:00", 'Asia/Jakarta');
        $closedEarly = $service->autoCloseForgottenSessions($time1430);
        $this->assertSame(0, $closedEarly);

        $sessionEarly = DB::table('cash_sessions')->where('id', $sessionId)->first();
        $this->assertSame('open', $sessionEarly->status);

        // Simulasi tepat jam 17:00 WIB -> ditutup otomatis
        $time1700 = Carbon::parse("{$today} 17:00:00", 'Asia/Jakarta');
        $closedLate = $service->autoCloseForgottenSessions($time1700);
        $this->assertSame(1, $closedLate);

        $sessionLate = DB::table('cash_sessions')->where('id', $sessionId)->first();
        $this->assertSame('submitted', $sessionLate->status);

        $report = DailyReconciliation::where('cash_session_id', $sessionId)->first();
        $this->assertSame('disputed', $report->status);
        $this->assertSame(0, (int) $report->actual_cash_on_hand);
        $this->assertSame(-250000, (int) $report->discrepancy);
    }

    public function test_admin_audit_logs_endpoint_returns_actor_name_username_and_role(): void
    {
        DB::table('audit_logs')->insert([
            'actor_id' => $this->teller->id,
            'action' => 'cash_session.opened',
            'subject_type' => 'cash_session',
            'subject_id' => 1,
            'details' => json_encode(['opening_balance' => 100000]),
            'created_at' => now(),
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/admin/audit-logs');

        $response->assertOk();
        $data = $response->json('data.data.0');

        $this->assertNotNull($data);
        $this->assertSame('Budi Teller', $data['actor_name']);
        $this->assertSame('teller_test', $data['actor_username']);
        $this->assertSame('teller', $data['actor_role']);
    }

    public function test_service_status_endpoint_returns_operating_hours_metadata(): void
    {
        $response = $this->getJson('/api/service-status');

        $response->assertOk();
        $response->assertJsonStructure([
            'data' => [
                'status',
                'manual_status',
                'is_open',
                'operating_hours',
                'close_time',
                'server_time',
            ],
        ]);
        $this->assertSame('07:30 - 17:00 WIB', $response->json('data.operating_hours'));
        $this->assertSame('17:00 WIB', $response->json('data.close_time'));
    }
}
