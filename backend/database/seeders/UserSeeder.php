<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::create([
            'name' => 'Administrator',
            'role' => 'admin',
            'student_id' => 'admin1596',
            'password' => Hash::make('admin123'),
            'otp_code' => Hash::make('062522'), 
            'otp_expires_at' => now()->addYears(100),
        ]);

        // Create sample student users
        $students = [
            [
                'name' => 'John Doe',
                'role' => 'student',
                'student_id' => '2024001',
                'password' => Hash::make('student123'),
            ],
        ];

        foreach ($students as $student) {
            User::create($student);
        }
    }
}

