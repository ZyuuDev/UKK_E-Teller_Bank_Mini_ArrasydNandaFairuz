<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CashRequest extends Model
{
    protected $table = 'cash_requests';
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
            'amount' => 'integer',
            'approved_at' => 'datetime',
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

