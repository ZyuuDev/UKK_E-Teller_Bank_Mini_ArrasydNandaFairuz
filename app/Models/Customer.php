<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model 
{
    protected $fillable = [
        'user_id',
        'account_number',
        'nis',          // Nomor Induk Siswa — ada di tabel, wajib masuk fillable!
        'full_name',
        'class_name',
        'balance',
        'security_pin',
        'qr_code_token',
    ];

    protected $hidden = [
        'security_pin',
    ];

    protected function casts(): array
    {
        return [
            'balance'=> 'decimal:2',
            'security_pin'=> 'hashed',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class, 'customer_id');
    }
}