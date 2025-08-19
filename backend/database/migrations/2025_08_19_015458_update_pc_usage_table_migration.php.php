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
        Schema::table('pc_usage', function (Blueprint $table) {
            // Add minutes_requested column
            $table->integer('minutes_requested')->after('student_name')->nullable();
            
            // Update existing records to populate minutes_requested from hours_requested
            // This will be done in a separate data migration or manually
        });
        
        // Update existing records
        DB::statement('UPDATE pc_usage SET minutes_requested = hours_requested * 60 WHERE minutes_requested IS NULL');
        
        // Make minutes_requested not nullable after populating data
        Schema::table('pc_usage', function (Blueprint $table) {
            $table->integer('minutes_requested')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pc_usage', function (Blueprint $table) {
            $table->dropColumn('minutes_requested');
        });
    }
};

