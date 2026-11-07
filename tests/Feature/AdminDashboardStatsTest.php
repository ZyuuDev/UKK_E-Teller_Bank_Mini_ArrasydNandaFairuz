<?php

namespace Tests\Feature;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminDashboardStatsTest extends TestCase
{
    private User $admin;
    private User $teller;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow(Carbon::parse('2026-11-07 10:00:00', 'Asia/Jakarta'));
        if (DB::connection()->getDriverName() !== 'mysql' || DB::connection()->getDatabaseName() !== 'bank_mini_test') {
            throw new \RuntimeException('Tes hanya boleh berjalan pada MySQL bank_mini_test.');
        }
        DB::beginTransaction();
        $this->admin = User::create([
            'username' => 'admin_' . Str::random(8),
            'password' => 'TestingPassword123!',
            'name' => 'Admin Penguji',
            'role' => 'admin',
            'is_active' => true,
        ]);
        $this->teller = User::create([
            'username' => 'teller_' . Str::random(8),
            'password' => 'TestingPassword123!',
            'name' => 'Teller Penguji',
            'role' => 'teller',
            'is_active' => true,
        ]);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        while (DB::connection()->transactionLevel() > 0) {
            DB::rollBack();
        }
        parent::tearDown();
    }

    public function test_guest_cannot_access_admin_dashboard_stats(): void
    {
        $response = $this->getJson('/api/admin/dashboard-stats');
        $response->assertStatus(401);
    }

    public function test_teller_cannot_access_admin_dashboard_stats(): void
    {
        Sanctum::actingAs($this->teller);
        $response = $this->getJson('/api/admin/dashboard-stats');
        $response->assertStatus(403);
    }

    public function test_admin_can_access_dashboard_stats_with_complete_structure(): void
    {
        Sanctum::actingAs($this->admin);
        $response = $this->getJson('/api/admin/dashboard-stats');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'financials' => [
                        'total_deposit_pool',
                        'active_savers_count',
                        'total_members_count',
                        'activation_rate_pct',
                        'today_deposits',
                        'today_withdrawals',
                        'today_net_flow',
                        'today_transactions_count',
                    ],
                    'counter_status' => [
                        'status',
                        'manual_status',
                        'operating_hours',
                        'is_open',
                        'active_sessions',
                    ],
                    'urgent_alerts' => [
                        'pending_reconciliations',
                        'disputed_reconciliations',
                        'pending_cash_requests',
                        'total_attention_required',
                    ],
                    'trend_7_days',
                    'recent_transactions',
                    'recent_audit_logs',
                ],
            ]);
    }
}

