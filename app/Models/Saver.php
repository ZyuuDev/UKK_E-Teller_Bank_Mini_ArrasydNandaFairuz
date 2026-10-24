<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Saver extends Model
{
    protected $fillable = ['user_id', 'account_number', 'balance', 'security_pin', 'qr_code_token', 'activated_at', 'activated_by'];

    protected $hidden = ['security_pin'];

    protected function casts(): array
    {
        return ['user_id' => 'integer', 'balance' => 'integer', 'security_pin' => 'hashed', 'activated_at' => 'datetime'];
    }

    public function member()
    {
        return $this->belongsTo(Member::class, 'user_id', 'user_id');
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function profile(): array
    {
        $this->loadMissing('member.user');
        $minimum = (int) config('bank.minimum_balance');

        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'service_active' => (bool) $this->member->user->is_active,
            'student_number' => $this->member->student_number,
            'full_name' => $this->member->full_name,
            'graduation_year' => $this->member->graduation_year,
            'account_number' => $this->account_number,
            'account_status' => $this->member->account_status,
            'balance' => $this->balance,
            'minimum_balance' => $minimum,
            'reserved_balance' => min($this->balance, $minimum),
            'available_balance' => max($this->balance - $minimum, 0),
            'qr_code_token' => $this->qr_code_token,
        ];
    }
}