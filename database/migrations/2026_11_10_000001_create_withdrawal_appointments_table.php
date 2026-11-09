<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('withdrawal_appointments', function (Blueprint $table) {
            $table->id();
            $table->string('appointment_code', 50)->unique();
            $table->foreignId('saver_id')->constrained('savers')->cascadeOnDelete();
            $table->unsignedBigInteger('amount');
            $table->date('scheduled_date')->index();
            $table->text('notes')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected', 'completed', 'cancelled'])->default('pending')->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('creator_role', 20)->default('student');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->string('rejection_reason', 255)->nullable();
            $table->timestamps();
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->foreignId('withdrawal_appointment_id')
                ->nullable()
                ->after('notes')
                ->constrained('withdrawal_appointments')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropForeign(['withdrawal_appointment_id']);
            $table->dropColumn('withdrawal_appointment_id');
        });

        Schema::dropIfExists('withdrawal_appointments');
    }
};

