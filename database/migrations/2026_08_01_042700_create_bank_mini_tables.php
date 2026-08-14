<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void 
    {
        Schema::create("users", function (Blueprint $table) {
            $table->id();
            $table->string('username', 50)->unique();
            $table->string('password');
            $table->string('name', 100);
            $table->enum('role', ['Administrator', 'Teller', 'Supervisor', 'Nasabah']);
            $table->timestamps();
        });

        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                    ->nullable()
                    ->constrained('users')
                    ->onDelete('restrict');                  
            $table->string('account_number', 20)->unique();
            $table->string('nis', 20)->unique();
            $table->string('full_name', 100);
            $table->string('class_name', 20);
            $table->decimal('balance', 15, 2)->default(0);
            $table->string('security_pin');
            $table->string('qr_code_token')->unique();
            $table->timestamps();
        });
        DB::statement('ALTER TABLE customers ADD CONSTRAINT chk_balance_positive CHECK (balance >= 0)');

        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')
                    ->constrained('customers')
                    ->onDelete('restrict');
            $table->foreignId('teller_id')
                    ->constrained('users')
                    ->onDelete('restrict');
            $table->enum('transaction_type', ['Deposit', 'Withdrawal']);
            $table->decimal('amount', 15, 2);
            $table->date('date');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
        DB::statement('ALTER TABLE transactions ADD CONSTRAINT chk_amount_positive CHECK (amount > 0)');

        Schema::create('journal_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaction_id')
                    ->constrained('transactions')
                    ->onDelete('restrict');
            $table->string('account_code', 10);
            $table->enum('entry_type', ['Debit', 'Credit']);
            $table->decimal('amount', 15, 2);
            $table->timestamps();
        });
        DB::statement('ALTER TABLE journal_entries ADD CONSTRAINT chk_journal_amount CHECK (amount > 0)');

        Schema::create('daily_reconciliations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teller_id')
                    ->constrained('users')
                    ->onDelete('restrict');
            $table->foreignId('supervisor_id')
                    ->nullable()
                    ->constrained('users')
                    ->onDelete('restrict');
            $table->date('date');
            $table->decimal('opening_balance', 15, 2);
            $table->decimal('total_deposits', 15, 2)->default(0);
            $table->decimal('total_withdrawals', 15, 2)->default(0);
            $table->decimal('expected_closing_balance', 15, 2);
            $table->decimal('actual_cash_on_hand', 15, 2);
            $table->decimal('discrepancy', 15, 2)->default(0);
            $table->enum('status', ['Pending', 'Approved', 'Disputed'])->default('Pending');
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_reconciliations');
        Schema::dropIfExists('journal_entries');
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('customers');
        Schema::dropIfExists('users');
    }
};