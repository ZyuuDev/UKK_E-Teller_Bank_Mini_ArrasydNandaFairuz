<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Administrator 
        User::create([
            'username' => 'admin',
            'password' => 'password123', // otomatis di-hash
            'name'     => 'Administrator Bank Mini',
            'role'     => 'Administrator',
        ]);

        // 2. Teller
        User::create([
            'username' => 'teller01',
            'password' => 'password123',
            'name'     => 'Teller Loket 1',
            'role'     => 'Teller',
        ]);

        // 3. Supervisor
        User::create([
            'username' => 'supervisor',
            'password' => 'password123',
            'name'     => 'Supervisor Kepala',
            'role'     => 'Supervisor',
        ]);
    }
}