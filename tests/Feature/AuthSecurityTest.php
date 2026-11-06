<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

class AuthSecurityTest extends TestCase
{
    private User $teller;
    private User $student;
    private const PASSWORD = 'TestingPassword123!';

    protected function setUp(): void
    {
        parent::setUp();
        if (DB::connection()->getDriverName() !== 'mysql' || DB::connection()->getDatabaseName() !== 'bank_mini_test') {
            throw new \RuntimeException('Tes hanya boleh berjalan pada MySQL bank_mini_test.');
        }
        \Illuminate\Support\Facades\Cache::flush();
        DB::beginTransaction();
        $this->teller = User::create(['username' => 'teller_'.Str::random(8), 'password' => self::PASSWORD, 'name' => 'Teller uji', 'role' => 'teller', 'is_active' => true]);
        $this->student = User::create(['username' => 's'.random_int(100000000, 999999999), 'password' => self::PASSWORD, 'name' => 'Siswa uji', 'role' => 'student', 'is_active' => true]);
    }

    protected function tearDown(): void
    {
        while (DB::connection()->transactionLevel() > 0) {
            DB::rollBack();
        }
        parent::tearDown();
    }

    private function login(User $user, string $password, string $client = 'web')
    {
        return $this->postJson('/api/auth/login', ['username' => $user->username, 'password' => $password, 'client' => $client]);
    }

    public function test_login_locks_after_repeated_failures_even_with_correct_password(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->login($this->teller, 'salah-'.$i)->assertStatus(422);
        }
        $locked = $this->login($this->teller, self::PASSWORD);
        $locked->assertStatus(429)->assertJsonPath('code', 'too_many_attempts');
        $this->assertStringContainsString('Terlalu banyak percobaan login', $locked->json('message'));
        $this->assertNotEmpty($locked->headers->get('Retry-After'));
    }

    public function test_successful_login_resets_failure_counter(): void
    {
        for ($i = 0; $i < 4; $i++) {
            $this->login($this->teller, 'salah-'.$i)->assertStatus(422);
        }
        $this->login($this->teller, self::PASSWORD)->assertOk();
        for ($i = 0; $i < 4; $i++) {
            $this->login($this->teller, 'salah-lagi-'.$i)->assertStatus(422);
        }
        $this->login($this->teller, self::PASSWORD)->assertOk();
    }

    public function test_unknown_account_gets_same_error_and_is_also_limited(): void
    {
        $payload = ['username' => 'tidak_ada_'.Str::random(6), 'password' => 'apa-saja', 'client' => 'web'];
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/login', $payload)->assertStatus(422)->assertJsonPath('errors.username.0', 'Akun, password, atau jenis aplikasi tidak sesuai.');
        }
        $this->postJson('/api/auth/login', $payload)->assertStatus(429);
    }

    public function test_wrong_client_type_counts_as_failure(): void
    {
        $this->login($this->student, self::PASSWORD, 'web')->assertStatus(422);
        $this->login($this->teller, self::PASSWORD, 'mobile')->assertStatus(422);
    }

    public function test_active_sessions_per_account_are_capped(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->login($this->teller, self::PASSWORD)->assertOk();
        }
        $this->assertSame((int) config('bank.login.max_active_tokens'), $this->teller->tokens()->count());
    }

    public function test_idle_staff_token_is_revoked_by_server(): void
    {
        $plain = $this->login($this->teller, self::PASSWORD)->json('data.token');
        $this->withToken($plain)->getJson('/api/auth/me')->assertOk();
        app('auth')->forgetGuards();

        $this->teller->tokens()->update(['last_used_at' => now()->subMinutes(11)]);
        $this->withToken($plain)->getJson('/api/auth/me')->assertStatus(401)->assertJsonPath('code', 'idle_timeout');
        $this->assertSame(0, $this->teller->tokens()->count());
        $this->withToken($plain)->getJson('/api/auth/me')->assertStatus(401);
    }

    public function test_activity_within_window_keeps_session_alive(): void
    {
        $plain = $this->login($this->teller, self::PASSWORD)->json('data.token');
        $this->teller->tokens()->update(['last_used_at' => now()->subMinutes(6)]);
        $this->withToken($plain)->getJson('/api/auth/me')->assertOk();
        $this->assertTrue(PersonalAccessToken::findToken($plain)->last_used_at->gt(now()->subMinute()));
    }

    public function test_student_idle_limit_is_shorter_than_staff(): void
    {
        $plain = $this->login($this->student, self::PASSWORD, 'mobile')->json('data.token');
        $this->student->tokens()->update(['last_used_at' => now()->subMinutes(6)]);
        $this->withToken($plain)->getJson('/api/auth/me')->assertStatus(401)->assertJsonPath('code', 'idle_timeout');
    }

    public function test_profile_exposes_idle_timeout_seconds(): void
    {
        $this->login($this->student, self::PASSWORD, 'mobile')->assertJsonPath('data.user.idle_timeout_seconds', 300);
        $this->login($this->teller, self::PASSWORD)->assertJsonPath('data.user.idle_timeout_seconds', 600);
    }
}

