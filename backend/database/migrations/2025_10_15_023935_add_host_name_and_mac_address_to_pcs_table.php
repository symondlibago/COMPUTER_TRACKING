<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('pcs', function (Blueprint $table) {
            $table->string('host_name')->unique()->nullable()->after('name')->comment('The network host name of the PC');
            $table->macAddress('mac_address')->unique()->nullable()->after('host_name')->comment('The MAC address of the PC');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pcs', function (Blueprint $table) {
            $table->dropColumn(['host_name', 'mac_address']);
        });
    }
};