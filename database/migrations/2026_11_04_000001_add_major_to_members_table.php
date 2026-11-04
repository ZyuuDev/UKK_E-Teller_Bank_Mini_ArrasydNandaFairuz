<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('members')) {
            return;
        }

        if (!Schema::hasColumn('members', 'major')) {
            Schema::table('members', function (Blueprint $table) {
                $table->string('major', 20)->nullable()->after('graduation_year');
                $table->index('major');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('members') && Schema::hasColumn('members', 'major')) {
            Schema::table('members', function (Blueprint $table) {
                $table->dropIndex(['major']);
                $table->dropColumn('major');
            });
        }
    }
};
