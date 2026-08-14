<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $fillable = [
        'customer_id',
        'teller_id',
        'transaction_type',
        'amount',
        'date',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'date' => 'date',
        ];
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }
    public function teller()
    {
        return $this->belongsTo(User::class, 'teller_id');
    }
    public function journalEntries()
    {
        return $this->hasMany(JournalEntry::class, 'transaction_id');
    }
}