<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Member extends Model
{
    protected $primaryKey = 'user_id';
    public $incrementing = false;
    protected $fillable = ['user_id', 'student_number', 'full_name', 'graduation_year', 'account_status'];

    protected function casts(): array
    {
        return ['graduation_year' => 'integer'];
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function saver()
    {
        return $this->hasOne(Saver::class, 'user_id', 'user_id');
    }
}