<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class Pengaturan extends Model
{
    protected $table = 'pengaturan';
    protected $fillable = ['key', 'value', 'keterangan'];

    public static function getStatusLayanan(): string
    {
        try {
            if (!Schema::hasTable('pengaturan')) {
                return 'buka';
            }
            return Cache::remember('status_layanan_teller', 60, function () {
                return DB::table('pengaturan')->where('key', 'status_layanan_teller')->value('value') ?? 'buka';
            });
        } catch (\Throwable $e) {
            return 'buka';
        }
    }

    public static function setStatusLayanan(string $status): void
    {
        $status = in_array($status, ['buka', 'istirahat', 'tutup'], true) ? $status : 'buka';

        try {
            DB::table('pengaturan')->updateOrInsert(
                ['key' => 'status_layanan_teller'],
                [
                    'value' => $status,
                    'keterangan' => 'Status operasional layanan loket teller (buka, istirahat, tutup)',
                    'updated_at' => now(),
                ]
            );
        } catch (\Throwable $e) {
        }

        Cache::forget('status_layanan_teller');
        Cache::put('status_layanan_teller', $status, 60);
    }
}
