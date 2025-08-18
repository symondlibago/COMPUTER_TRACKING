<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Computer;

class ComputerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Computer::create([
            'hostname' => 'PC-LAB-001',
            'mac_address' => '00:1B:44:11:3A:B7',
            'university' => 'University of Technology',
            'status' => 'Available',
            'is_active' => true,
        ]);

        Computer::create([
            'hostname' => 'PC-LAB-002',
            'mac_address' => '00:1B:44:11:3A:B8',
            'university' => 'University of Technology',
            'status' => 'Available',
            'is_active' => true,
        ]);

        Computer::create([
            'hostname' => 'PC-LAB-003',
            'mac_address' => '00:1B:44:11:3A:B9',
            'university' => 'University of Technology',
            'status' => 'Available',
            'is_active' => true,
        ]);

        Computer::create([
            'hostname' => 'PC-LAB-004',
            'mac_address' => '00:1B:44:11:3A:C0',
            'university' => 'University of Technology',
            'status' => 'Maintenance',
            'is_active' => false,
        ]);

        Computer::create([
            'hostname' => 'PC-LAB-005',
            'mac_address' => '00:1B:44:11:3A:C1',
            'university' => 'University of Technology',
            'status' => 'Available',
            'is_active' => true,
        ]);
    }
}
