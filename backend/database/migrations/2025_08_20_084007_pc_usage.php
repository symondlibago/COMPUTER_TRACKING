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
        Schema::table("pc_usage", function (Blueprint $table) {
            // Drop the old time-based columns as we are moving to open-time tracking
            $table->dropColumn("minutes_requested");
            $table->dropColumn("hours_requested");

            // Add new columns for real-time session tracking
            $table->timestamp("pause_start_time")->nullable()->after("end_time");
            $table->integer("total_pause_duration")->default(0)->after("pause_start_time"); // in seconds
            $table->integer("actual_usage_duration")->default(0)->after("total_pause_duration"); // in seconds
            $table->boolean("is_paused")->default(false)->after("actual_usage_duration");
            $table->timestamp("last_activity_time")->nullable()->after("is_paused");
            
            // Update status enum to include 'paused'
            $table->dropColumn("status");
        });
        
        // Re-add status column with new enum values
        Schema::table("pc_usage", function (Blueprint $table) {
            $table->enum("status", ["active", "paused", "completed", "cancelled"])->default("active")->after("last_activity_time");
        });
        
        // Add indexes for better performance
        Schema::table("pc_usage", function (Blueprint $table) {
            $table->index(["is_paused", "status"]);
            $table->index("pause_start_time");
            $table->index("last_activity_time");
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table("pc_usage", function (Blueprint $table) {
            // Remove new columns
            $table->dropColumn([
                "pause_start_time",
                "total_pause_duration",
                "actual_usage_duration",
                "is_paused",
                "last_activity_time"
            ]);
            
            // Drop indexes
            $table->dropIndex(["is_paused", "status"]);
            $table->dropIndex(["pause_start_time"]);
            $table->dropIndex(["last_activity_time"]);
            
            // Restore original status enum
            $table->dropColumn("status");
        });
        
        Schema::table("pc_usage", function (Blueprint $table) {
            $table->enum("status", ["active", "completed", "cancelled"])->default("active");
            // Re-add old time-based columns if needed for rollback scenario
            $table->integer("minutes_requested")->nullable();
            $table->integer("hours_requested")->nullable();
        });
    }
};