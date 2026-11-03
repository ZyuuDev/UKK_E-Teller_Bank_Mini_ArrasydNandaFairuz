<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('pengaturan')) {
            Schema::create('pengaturan', function (Blueprint $table) {
                $table->id();
                $table->string('key', 100)->unique();
                $table->text('value')->nullable();
                $table->string('keterangan', 255)->nullable();
                $table->timestamps();
            });

            DB::table('pengaturan')->insert([
                'key' => 'status_layanan_teller',
                'value' => 'buka',
                'keterangan' => 'Status operasional layanan loket teller (buka, istirahat, tutup)',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        if (!Schema::hasTable('cash_requests')) {
            Schema::create('cash_requests', function (Blueprint $table) {
                $table->id();
                $table->foreignId('teller_id')->constrained('users')->restrictOnDelete();
                $table->foreignId('cash_session_id')->nullable()->constrained('cash_sessions')->nullOnDelete();
                $table->date('date');
                $table->unsignedBigInteger('amount');
                $table->string('notes', 255)->nullable();
                $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
                $table->string('rejection_notes', 255)->nullable();
                $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('approved_at')->nullable();
                $table->timestamps();

                $table->index(['teller_id', 'date']);
                $table->index(['status', 'date']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_requests');
        Schema::dropIfExists('pengaturan');
    }
};
