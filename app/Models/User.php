<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens;

    protected $fillable = [
        'username',
        'password',
        'name',
        'role',
    ];

    protected $hidden = [
        'password'
    ];

    protected function casts(): array
    {
        return [
            'password'=> 'hashed',
        ];
    }

    public function customer()
    {
        return $this->hasOne(Customer::class, 'user_id');
    }
}
