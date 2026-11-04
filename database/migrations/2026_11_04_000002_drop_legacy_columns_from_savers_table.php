<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('savers')) {
            return;
        }

        Schema::table('savers', function (Blueprint $table) {
            foreach (['nis', 'full_name', 'class_name'] as $column) {
                if (Schema::hasColumn('savers', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }

    public function down(): void
    {
        // Kolom legacy sengaja dilepas karena identitas siswa tersimpan di tabel members.
    }
};
