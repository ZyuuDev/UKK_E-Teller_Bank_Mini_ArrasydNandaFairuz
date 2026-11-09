<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class WithdrawalAppointment extends Model
{
    protected $fillable = [
        'appointment_code',
        'saver_id',
        'amount',
        'scheduled_date',
        'notes',
        'status',
        'created_by',
        'creator_role',
        'approved_by',
        'approved_at',
        'rejection_reason',
    ];

    protected function casts(): array
    {
        return [
            'saver_id' => 'integer',
            'amount' => 'integer',
            'scheduled_date' => 'date:Y-m-d',
            'approved_at' => 'datetime',
        ];
    }

    public function saver(): BelongsTo
    {
        return $this->belongsTo(Saver::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function transaction(): HasOne
    {
        return $this->hasOne(Transaction::class, 'withdrawal_appointment_id');
    }
}

