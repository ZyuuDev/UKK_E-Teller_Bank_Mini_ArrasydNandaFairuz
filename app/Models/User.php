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
    'is_active',
    'must_change_password',
    'email',
    'email_verified_at',
];
    protected $hidden = ['password'];

    protected function casts(): array
{
    return [
        'password' => 'hashed',
        'is_active' => 'boolean',
        'must_change_password' => 'boolean',
        'email_verified_at' => 'datetime',
    ];
}

    public function member()
    {
        return $this->hasOne(Member::class, 'user_id');
    }
}