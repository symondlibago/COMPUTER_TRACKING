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
        // Create admin user
        User::create([
            'name' => 'Administrator',
            'role' => 'admin',
            'student_id' => 'admin',
            'password' => Hash::make('admin123'),
        ]);

        // Create sample student users
        $students = [
            [
                'name' => 'John Doe',
                'role' => 'student',
                'student_id' => '2024001',
                'password' => Hash::make('student123'),
            ],
            [
                'name' => 'Jane Smith',
                'role' => 'student',
                'student_id' => '2024002',
                'password' => Hash::make('student123'),
            ],
            [
                'name' => 'Mike Johnson',
                'role' => 'student',
                'student_id' => '2024003',
                'password' => Hash::make('student123'),
            ],
            [
                'name' => 'Sarah Wilson',
                'role' => 'student',
                'student_id' => '2024004',
                'password' => Hash::make('student123'),
            ],
            [
                'name' => 'David Brown',
                'role' => 'student',
                'student_id' => '2024005',
                'password' => Hash::make('student123'),
            ],
            [
                'name' => 'Emily Davis',
                'role' => 'student',
                'student_id' => '2024006',
                'password' => Hash::make('student123'),
            ],
            [
                'name' => 'Chris Miller',
                'role' => 'student',
                'student_id' => '2024007',
                'password' => Hash::make('student123'),
            ],
            [
                'name' => 'Lisa Garcia',
                'role' => 'student',
                'student_id' => '2024008',
                'password' => Hash::make('student123'),
            ],
            [
                'name' => 'Tom Anderson',
                'role' => 'student',
                'student_id' => '2024009',
                'password' => Hash::make('student123'),
            ],
            [
                'name' => 'Anna Martinez',
                'role' => 'student',
                'student_id' => '2024010',
                'password' => Hash::make('student123'),
            ]
        ];

        foreach ($students as $student) {
            User::create($student);
        }

        $this->command->info('Users seeded successfully!');
        $this->command->info('Admin credentials: username=admin, password=admin123');
        $this->command->info('Student credentials: student_id=2024001-2024010, password=student123');
    }
}

