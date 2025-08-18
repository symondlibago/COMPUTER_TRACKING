<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@computertracking.com',
            'student_id' => 'ADMIN001',
            'university' => 'System Administrator',
            'role' => 'admin',
            'password' => Hash::make('admin123'),
        ]);

        User::create([
            'name' => 'John Student',
            'email' => 'john@student.com',
            'student_id' => 'STU001',
            'university' => 'University of Technology',
            'role' => 'student',
            'password' => Hash::make('student123'),
        ]);

        User::create([
            'name' => 'Jane Instructor',
            'email' => 'jane@instructor.com',
            'student_id' => 'INS001',
            'university' => 'University of Technology',
            'role' => 'instructor',
            'password' => Hash::make('instructor123'),
        ]);
    }
}

