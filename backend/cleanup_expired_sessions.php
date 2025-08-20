<?php

/**
 * Background script to automatically clean up PC usage sessions
 * that have been paused for more than 10 minutes.
 * 
 * This script should be run periodically (e.g., every minute) via cron job:
 * * * * * * php /path/to/cleanup_expired_sessions.php
 */

require_once __DIR__ . '/vendor/autoload.php';

use App\Models\PCUsage;
use Carbon\Carbon;

// Bootstrap Laravel application
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    echo "[" . Carbon::now()->format('Y-m-d H:i:s') . "] Starting expired session cleanup...\n";
    
    // Find all paused sessions that have exceeded 10 minutes
    $expiredSessions = PCUsage::with('pc')
        ->where('status', 'paused')
        ->where('is_paused', true)
        ->whereNotNull('pause_start_time')
        ->get()
        ->filter(function ($usage) {
            // Check if paused for more than 10 minutes (600 seconds)
            $pauseDuration = Carbon::now()->diffInSeconds($usage->pause_start_time);
            return $pauseDuration >= 600;
        });

    $cleanedCount = 0;
    
    foreach ($expiredSessions as $session) {
        try {
            echo "  - Cleaning up session ID {$session->id} (PC: {$session->pc->name}, Student: {$session->student_name})\n";
            
            // Calculate final durations
            $finalUsageDuration = $session->actual_usage_duration;
            $finalPauseDuration = $session->total_pause_duration + Carbon::now()->diffInSeconds($session->pause_start_time);
            
            // Complete the session
            $session->update([
                'status' => 'completed',
                'end_time' => Carbon::now(),
                'is_paused' => false,
                'pause_start_time' => null,
                'actual_usage_duration' => $finalUsageDuration,
                'total_pause_duration' => $finalPauseDuration
            ]);

            // Update PC status back to active
            $session->pc->update(['status' => 'active']);
            
            $cleanedCount++;
            
            echo "    ✓ Session completed successfully\n";
            
        } catch (Exception $e) {
            echo "    ✗ Error cleaning up session ID {$session->id}: " . $e->getMessage() . "\n";
        }
    }
    
    echo "[" . Carbon::now()->format('Y-m-d H:i:s') . "] Cleanup completed. Processed {$cleanedCount} expired sessions.\n";
    
    // Also log to Laravel log
    \Log::info("Expired session cleanup completed", [
        'cleaned_sessions' => $cleanedCount,
        'timestamp' => Carbon::now()->toISOString()
    ]);
    
} catch (Exception $e) {
    echo "[" . Carbon::now()->format('Y-m-d H:i:s') . "] Error during cleanup: " . $e->getMessage() . "\n";
    \Log::error("Expired session cleanup failed", [
        'error' => $e->getMessage(),
        'timestamp' => Carbon::now()->toISOString()
    ]);
}

echo "\n";

