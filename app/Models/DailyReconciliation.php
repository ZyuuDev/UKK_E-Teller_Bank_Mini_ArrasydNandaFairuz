<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailyReconciliation extends Model
{
    protected $fillable = [
        'teller_id',
        'supervisor_id',
        'date',
        'opening_balance',
        'total_deposits',
        'total_withdrawals',
        'expected_closing_balance',
        'actual_cash_on_hand',
        'discrepancy',
        'status',
        'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'date'                     => 'date',
            'opening_balance'          => 'decimal:2',
            'total_deposits'           => 'decimal:2',
            'total_withdrawals'        => 'decimal:2',
            'expected_closing_balance' => 'decimal:2',
            'actual_cash_on_hand'      => 'decimal:2',
            'discrepancy'              => 'decimal:2',
            'approved_at'              => 'datetime', // waktu approval supervisor
        ];
    }

    public function teller()
    {
        return $this->belongsTo(User::class, 'teller_id');
    }
    public function supervisor()
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }
}