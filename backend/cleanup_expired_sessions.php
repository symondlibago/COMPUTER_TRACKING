<?php

/**
 * Automated Cleanup Script
 * 
 * This script should be run periodically (every minute) via cron job to:
 * 1. Clean up expired PC usage sessions (paused for more than 10 minutes).
 * 2. Clean up expired queue assignments (students who didn't check in within 5 minutes).
 * 3. Process the queue to assign PCs to waiting students.
 * 4. Log cleanup activities.
 * 
 * Usage: php cleanup_expired_sessions.php
 */

require_once __DIR__ . 
'/vendor/autoload.php';

use Illuminate\Foundation\Application;
use Illuminate\Contracts\Console\Kernel;
use App\Models\PCUsage;
use App\Models\PCQueue;
use App\Models\PC;
use Carbon\Carbon;

// Bootstrap Laravel application
$app = require_once __DIR__ . 
'/bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

// Set up logging
$logFile = __DIR__ . 
'/storage/logs/cleanup.log';

function logMessage($message) {
    global $logFile;
    $timestamp = Carbon::now()->format('Y-m-d H:i:s');
    $logEntry = "[{$timestamp}] {$message}" . PHP_EOL;
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
    echo $logEntry;
}

try {
    logMessage("Starting automated cleanup process...");
    
    // --- PC Usage Session Cleanup ---
    logMessage("Starting expired PC usage session cleanup...");
    
    $expiredSessions = PCUsage::with('pc')
        ->where('status', 'paused')
        ->where('is_paused', true)
        ->whereNotNull('pause_start_time')
        ->get()
        ->filter(function ($usage) {
            $pauseDuration = Carbon::now()->diffInSeconds($usage->pause_start_time);
            return $pauseDuration >= 600; // 10 minutes
        });

    $cleanedUsageCount = 0;
    
    foreach ($expiredSessions as $session) {
        try {
            logMessage("  - Cleaning up usage session ID {$session->id} (PC: {$session->pc->name}, Student: {$session->student_name})");
            
            $finalUsageDuration = $session->actual_usage_duration;
            $finalPauseDuration = $session->total_pause_duration + Carbon::now()->diffInSeconds($session->pause_start_time);
            
            $session->update([
                'status' => 'completed',
                'end_time' => Carbon::now(),
                'is_paused' => false,
                'pause_start_time' => null,
                'actual_usage_duration' => $finalUsageDuration,
                'total_pause_duration' => $finalPauseDuration
            ]);

            $session->pc->update(['status' => 'active']);
            
            $cleanedUsageCount++;
            logMessage("    ✓ Usage session completed successfully");
            
        } catch (Exception $e) {
            logMessage("    ✗ Error cleaning up usage session ID {$session->id}: " . $e->getMessage());
        }
    }
    logMessage("Completed expired PC usage session cleanup. Processed {$cleanedUsageCount} expired sessions.");

    // --- PC Queue Cleanup and Processing ---
    logMessage("Starting PC queue cleanup and processing...");
    
    // 1. Clean up expired queue assignments
    logMessage("Cleaning up expired queue assignments...");
    $expiredQueueCount = PCQueue::cleanupExpiredAssignments();
    logMessage("Cleaned up {$expiredQueueCount} expired queue assignments.");
    
    // 2. Process the queue to assign available PCs
    logMessage("Processing queue for new assignments...");
    
    $availablePCs = PC::where('status', 'active')->get();
    logMessage("Found " . $availablePCs->count() . " available PCs.");
    
    $waitingEntries = PCQueue::waiting()
        ->orderBy('queue_position', 'asc')
        ->limit($availablePCs->count())
        ->get();
    
    logMessage("Found " . $waitingEntries->count() . " students waiting in queue.");
    
    $assignedQueueCount = 0;
    foreach ($waitingEntries as $index => $queueEntry) {
        if (isset($availablePCs[$index])) {
            $pc = $availablePCs[$index];
            
            $queueEntry->assignPC($pc);
            $assignedQueueCount++;
            
            logMessage("Assigned PC {$pc->name} to student {$queueEntry->student_name} (ID: {$queueEntry->student_id}).");
        }
    }
    logMessage("Assigned {$assignedQueueCount} PCs to waiting students.");
    
    // Log current queue and PC statistics
    $totalWaiting = PCQueue::waiting()->count();
    $totalAssigned = PCQueue::assigned()->count();
    $totalAvailable = PC::where('status', 'active')->count();
    $totalReserved = PC::where('status', 'reserved')->count();
    $totalInUse = PC::where('status', 'in-use')->count();
    
    logMessage("Current System Statistics:");
    logMessage("  - Students waiting in queue: {$totalWaiting}");
    logMessage("  - Students assigned PC (check-in pending): {$totalAssigned}");
    logMessage("  - PCs available: {$totalAvailable}");
    logMessage("  - PCs reserved (assigned to queue): {$totalReserved}");
    logMessage("  - PCs in use: {$totalInUse}");
    
    // Check for any queue assignments about to expire (within 1 minute)
    $aboutToExpire = PCQueue::assigned()
        ->where('expires_at', '<=', Carbon::now()->addMinute())
        ->where('expires_at', '>', Carbon::now())
        ->get();
    
    if ($aboutToExpire->count() > 0) {
        logMessage("Warning: " . $aboutToExpire->count() . " queue assignments will expire within 1 minute:");
        foreach ($aboutToExpire as $entry) {
            $remainingSeconds = $entry->expires_at->diffInSeconds(Carbon::now(), false);
            logMessage("  - {$entry->student_name} (PC: {$entry->assignedPC->name}) expires in {$remainingSeconds} seconds.");
        }
    }
    
    logMessage("Automated cleanup process completed successfully.");
    
} catch (Exception $e) {
    logMessage("ERROR: Automated cleanup failed - " . $e->getMessage());
    logMessage("Stack trace: " . $e->getTraceAsString());
    exit(1);
}

exit(0);

