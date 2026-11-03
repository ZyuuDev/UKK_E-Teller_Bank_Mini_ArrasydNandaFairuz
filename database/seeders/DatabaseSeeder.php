<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Administrator (role: admin)
        User::updateOrCreate(
            ['username' => 'admin'],
            [
                'name'                 => 'Administrator Bank Mini',
                'password'             => 'password123',
                'role'                 => 'admin',
                'is_active'            => true,
                'must_change_password' => false,
            ]
        );

        // 2. Teller (role: teller)
        User::updateOrCreate(
            ['username' => 'teller01'],
            [
                'name'                 => 'Teller Loket 1',
                'password'             => 'password123',
                'role'                 => 'teller',
                'is_active'            => true,
                'must_change_password' => false,
            ]
        );

        // 3. Supervisor (sebagai admin)
        User::updateOrCreate(
            ['username' => 'supervisor'],
            [
                'name'                 => 'Supervisor Kepala',
                'password'             => 'password123',
                'role'                 => 'admin',
                'is_active'            => true,
                'must_change_password' => false,
            ]
        );
    }
}
