<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $fillable = ['saver_id', 'teller_id', 'cash_session_id', 'request_id', 'transaction_type', 'amount', 'date', 'notes', 'balance_after', 'snapshot_account_number', 'snapshot_member_name'];

    protected function casts(): array
    {
        return ['saver_id' => 'integer', 'teller_id' => 'integer', 'amount' => 'integer', 'balance_after' => 'integer', 'date' => 'date'];
    }

    public function saver()
    {
        return $this->belongsTo(Saver::class);
    }

    public function teller()
    {
        return $this->belongsTo(User::class, 'teller_id');
    }

    public function receipt(): array
    {
        return [
            'id' => $this->id,
            'request_id' => $this->request_id,
            'account_number' => $this->snapshot_account_number,
            'full_name' => $this->snapshot_member_name,
            'transaction_type' => $this->transaction_type,
            'amount' => $this->amount,
            'balance_after' => $this->balance_after,
            'notes' => $this->notes,
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}