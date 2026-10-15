<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailyReconciliation extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
            'opening_balance' => 'integer',
            'total_deposits' => 'integer',
            'total_withdrawals' => 'integer',
            'expected_closing_balance' => 'integer',
            'actual_cash_on_hand' => 'integer',
            'discrepancy' => 'integer',
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
        ];
    }

    public function teller()
    {
        return $this->belongsTo(User::class, 'teller_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}