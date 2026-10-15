<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class AuditService
{
    public function record(int $actorId, string $action, string $subjectType, ?int $subjectId, array $details = []): void
    {
        DB::table('audit_logs')->insert([
            'actor_id' => $actorId,
            'action' => $action,
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
            'details' => json_encode($details, JSON_THROW_ON_ERROR),
            'created_at' => now(),
        ]);
    }
}