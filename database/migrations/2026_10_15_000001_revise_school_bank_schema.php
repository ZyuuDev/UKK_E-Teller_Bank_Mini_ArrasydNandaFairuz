<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (PHP_INT_SIZE < 8 || !Schema::hasTable('customers') || Schema::hasTable('savers')) {
            throw new RuntimeException('Periksa runtime 64-bit dan schema awal sebelum migrasi.');
        }

        $invalidMembers = DB::table('customers')->whereNull('user_id')->exists();
        $duplicateMembers = DB::table('customers')->select('user_id')->groupBy('user_id')->havingRaw('COUNT(*) > 1')->exists();
        $invalidRoles = DB::table('customers')->join('users', 'users.id', '=', 'customers.user_id')->where('users.role', '!=', 'Nasabah')->exists();

        if ($invalidMembers || $duplicateMembers || $invalidRoles) {
            throw new RuntimeException('Pemilik rekening harus berupa satu akun Nasabah yang sah untuk setiap siswa.');
        }

        $money = [
            'customers' => ['balance'],
            'transactions' => ['amount'],
            'journal_entries' => ['amount'],
            'daily_reconciliations' => ['opening_balance', 'total_deposits', 'total_withdrawals', 'expected_closing_balance', 'actual_cash_on_hand', 'discrepancy'],
        ];

        foreach ($money as $table => $columns) {
            foreach ($columns as $column) {
                if (DB::table($table)->whereRaw("$column <> FLOOR($column)")->exists()) {
                    throw new RuntimeException("Ada pecahan rupiah pada $table.$column.");
                }
            }
        }

        DB::statement("ALTER TABLE users MODIFY role VARCHAR(20) NOT NULL");
        foreach (['Administrator' => 'admin', 'Supervisor' => 'admin', 'Teller' => 'teller', 'Nasabah' => 'student'] as $old => $new) {
            DB::table('users')->where('role', $old)->update(['role' => $new]);
        }
        DB::statement("ALTER TABLE users ADD CONSTRAINT chk_user_role CHECK (role IN ('admin', 'teller', 'student'))");

        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_active')->default(true);
            $table->boolean('must_change_password')->default(false);
        });

        Schema::create('members', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->primary();
            $table->foreign('user_id')->references('id')->on('users')->restrictOnDelete();
            $table->string('student_number', 20)->unique();
            $table->string('full_name', 100);
            $table->unsignedSmallInteger('graduation_year')->nullable();
            $table->enum('account_status', ['inactive', 'active'])->default('inactive');
            $table->timestamps();
        });

        DB::table('customers')->orderBy('id')->chunkById(500, function ($customers) {
            foreach ($customers as $customer) {
                DB::table('members')->insert([
                    'user_id' => $customer->user_id,
                    'student_number' => $customer->nis,
                    'full_name' => $customer->full_name,
                    'graduation_year' => null,
                    'account_status' => (int) $customer->balance > 0 || DB::table('transactions')->where('customer_id', $customer->id)->exists() ? 'active' : 'inactive',
                    'created_at' => $customer->created_at,
                    'updated_at' => $customer->updated_at,
                ]);
            }
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->dropForeign('transactions_customer_id_foreign');
        });
        Schema::table('customers', function (Blueprint $table) {
            $table->dropForeign('customers_user_id_foreign');
        });
        Schema::rename('customers', 'savers');
        DB::statement('ALTER TABLE savers MODIFY user_id BIGINT UNSIGNED NOT NULL');
        Schema::table('savers', function (Blueprint $table) {
            $table->unique('user_id');
            $table->foreign('user_id')->references('user_id')->on('members')->restrictOnDelete();
            $table->timestamp('activated_at')->nullable();
            $table->foreignId('activated_by')->nullable()->constrained('users')->restrictOnDelete();
        });
        Schema::table('transactions', function (Blueprint $table) {
            $table->renameColumn('customer_id', 'saver_id');
        });
        Schema::table('transactions', function (Blueprint $table) {
            $table->foreign('saver_id')->references('id')->on('savers')->restrictOnDelete();
        });

        Schema::create('cash_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teller_id')->constrained('users')->restrictOnDelete();
            $table->date('date');
            $table->bigInteger('opening_balance');
            $table->enum('status', ['open', 'submitted', 'approved'])->default('open');
            $table->timestamps();
            $table->unique(['teller_id', 'date']);
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->foreignId('cash_session_id')->nullable()->constrained('cash_sessions')->restrictOnDelete();
            $table->uuid('request_id')->nullable()->unique();
            $table->bigInteger('balance_after')->nullable();
            $table->string('snapshot_account_number', 20)->nullable();
            $table->string('snapshot_member_name', 100)->nullable();
            $table->index(['teller_id', 'date']);
        });

        Schema::table('daily_reconciliations', function (Blueprint $table) {
            $table->dropForeign('daily_reconciliations_supervisor_id_foreign');
        });
        Schema::table('daily_reconciliations', function (Blueprint $table) {
            $table->renameColumn('supervisor_id', 'approved_by');
        });
        Schema::table('daily_reconciliations', function (Blueprint $table) {
            $table->foreign('approved_by')->references('id')->on('users')->restrictOnDelete();
        });
        DB::statement('ALTER TABLE daily_reconciliations MODIFY status VARCHAR(20) NOT NULL');
        foreach (['Pending' => 'pending', 'Approved' => 'approved', 'Disputed' => 'disputed'] as $old => $new) {
            DB::table('daily_reconciliations')->where('status', $old)->update(['status' => $new]);
        }
        DB::statement("ALTER TABLE daily_reconciliations ADD CONSTRAINT chk_reconciliation_status CHECK (status IN ('pending', 'approved', 'disputed', 'rejected'))");
        Schema::table('daily_reconciliations', function (Blueprint $table) {
            $table->foreignId('cash_session_id')->nullable()->unique()->constrained('cash_sessions')->restrictOnDelete();
            $table->foreignId('rejected_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->text('rejection_reason')->nullable();
            $table->timestamp('rejected_at')->nullable();
        });

        Schema::create('cash_transfers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_reconciliation_id')->unique()->constrained('daily_reconciliations')->restrictOnDelete();
            $table->foreignId('approved_by')->constrained('users')->restrictOnDelete();
            $table->bigInteger('amount');
            $table->timestamps();
        });
        Schema::table('journal_entries', function (Blueprint $table) {
            $table->foreignId('cash_transfer_id')->nullable()->constrained('cash_transfers')->restrictOnDelete();
            $table->foreignId('cash_session_id')->nullable()->constrained('cash_sessions')->restrictOnDelete();
        });
        Schema::table('journal_entries', function (Blueprint $table) {
            $table->dropForeign('journal_entries_transaction_id_foreign');
        });
        DB::statement('ALTER TABLE journal_entries MODIFY transaction_id BIGINT UNSIGNED NULL');
        Schema::table('journal_entries', function (Blueprint $table) {
            $table->foreign('transaction_id')->references('id')->on('transactions')->restrictOnDelete();
        });
        DB::statement('ALTER TABLE journal_entries ADD CONSTRAINT chk_journal_source CHECK ((transaction_id IS NOT NULL AND cash_transfer_id IS NULL AND cash_session_id IS NULL) OR (transaction_id IS NULL AND cash_transfer_id IS NOT NULL AND cash_session_id IS NULL) OR (transaction_id IS NULL AND cash_transfer_id IS NULL AND cash_session_id IS NOT NULL))');

        Schema::create('account_sequences', function (Blueprint $table) {
            $table->unsignedSmallInteger('year')->primary();
            $table->unsignedBigInteger('next_number')->default(1);
        });
        $sequences = [];
        foreach (DB::table('savers')->select('account_number')->cursor() as $saver) {
            if (preg_match('/^BMS-(\d{4})-(\d+)$/', $saver->account_number, $matches)) {
                $year = (int) $matches[1];
                $sequences[$year] = max($sequences[$year] ?? 1, (int) $matches[2] + 1);
            }
        }
        foreach ($sequences as $year => $next) {
            DB::table('account_sequences')->insert(['year' => $year, 'next_number' => $next]);
        }

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actor_id')->constrained('users')->restrictOnDelete();
            $table->string('action', 80);
            $table->string('subject_type', 80);
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->json('details')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
        Schema::create('member_imports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->enum('status', ['preview', 'imported'])->default('preview');
            $table->json('rows');
            $table->json('result')->nullable();
            $table->unsignedInteger('processed_rows')->default(0);
            $table->timestamp('expires_at');
            $table->timestamps();
        });

        $money['savers'] = $money['customers'];
        unset($money['customers']);
        DB::statement('ALTER TABLE savers DROP CHECK chk_balance_positive');
        DB::statement('ALTER TABLE transactions DROP CHECK chk_amount_positive');
        DB::statement('ALTER TABLE journal_entries DROP CHECK chk_journal_amount');
        foreach ($money as $table => $columns) {
            foreach ($columns as $column) {
                $default = $column === 'balance' || in_array($column, ['total_deposits', 'total_withdrawals', 'discrepancy'], true) ? ' DEFAULT 0' : '';
                DB::statement("ALTER TABLE $table MODIFY $column BIGINT NOT NULL$default");
            }
        }
        DB::statement('ALTER TABLE savers ADD CONSTRAINT chk_balance_positive CHECK (balance >= 0)');
        DB::statement('ALTER TABLE transactions ADD CONSTRAINT chk_amount_positive CHECK (amount > 0)');
        DB::statement('ALTER TABLE journal_entries ADD CONSTRAINT chk_journal_amount CHECK (amount > 0)');
        DB::statement('ALTER TABLE cash_sessions ADD CONSTRAINT chk_opening_balance CHECK (opening_balance >= 0)');
        DB::statement('ALTER TABLE cash_transfers ADD CONSTRAINT chk_transfer_amount CHECK (amount >= 0)');

        Schema::table('savers', function (Blueprint $table) {
            $table->dropColumn(['nis', 'full_name', 'class_name']);
        });
        DB::table('personal_access_tokens')->delete();
    }

    public function down(): void
    {
        throw new RuntimeException('Pulihkan backup database yang sudah diuji; rollback otomatis dapat menghilangkan data revisi.');
    }
};