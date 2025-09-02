<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class PCQueue extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'pc_queue';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'student_id',
        'student_name',
        'status',
        'assigned_pc_id',
        'queued_at',
        'assigned_at',
        'expires_at',
        'completed_at',
        'queue_position',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'queued_at' => 'datetime',
        'assigned_at' => 'datetime',
        'expires_at' => 'datetime',
        'completed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Boot the model and set up event listeners.
     */
    protected static function boot()
    {
        parent::boot();

        // Auto-expire assignments when querying
        static::retrieved(function ($queueEntry) {
            if ($queueEntry->shouldAutoExpire()) {
                $queueEntry->autoExpire();
            }
        });
    }

    /**
     * Get the PC that this queue entry is assigned to.
     */
    public function assignedPC()
    {
        return $this->belongsTo(PC::class, 'assigned_pc_id');
    }

    /**
     * Get the student that this queue entry belongs to.
     */
    public function student()
    {
        return $this->belongsTo(User::class, 'student_id', 'student_id');
    }

    /**
     * Scope a query to only include waiting queue entries.
     */
    public function scopeWaiting($query)
    {
        return $query->where('status', 'waiting');
    }

    /**
     * Scope a query to only include assigned queue entries.
     */
    public function scopeAssigned($query)
    {
        return $query->where('status', 'assigned');
    }

    /**
     * Scope a query to only include active queue entries (waiting or assigned).
     */
    public function scopeActive($query)
    {
        return $query->whereIn('status', ['waiting', 'assigned']);
    }

    /**
     * Scope a query to order by queue position (FIFO).
     */
    public function scopeOrderByPosition($query)
    {
        return $query->orderBy('queue_position', 'asc');
    }

    /**
     * Check if the assignment should be auto-expired.
     * This happens when assigned for more than 5 minutes.
     */
    public function shouldAutoExpire()
    {
        if ($this->status !== 'assigned' || !$this->expires_at) {
            return false;
        }

        return Carbon::now()->isAfter($this->expires_at);
    }

    /**
     * Automatically expire the assignment when timeout is reached.
     */
    public function autoExpire()
    {
        if ($this->shouldAutoExpire()) {
            // Store the assigned PC ID before nullifying it
            $assignedPcId = $this->assigned_pc_id;
            
            $this->update([
                'status' => 'expired',
                'assigned_pc_id' => null,
                'assigned_at' => null,
                'expires_at' => null,
            ]);

            // Update PC status back to active if it was assigned to this queue entry
            if ($assignedPcId) {
                $pc = PC::find($assignedPcId);
                if ($pc && $pc->status === 'reserved') {
                    $pc->update(['status' => 'active']);
                }
            }

            // Move to end of queue
            $this->moveToEndOfQueue();

            // Process queue to assign next student
            static::processQueue();

            return true;
        }

        return false;
    }

    /**
     * Add student to queue.
     */
    public static function addToQueue($studentId, $studentName)
    {
        // Check if student is already in queue
        $existingEntry = static::where('student_id', $studentId)
            ->whereIn('status', ['waiting', 'assigned'])
            ->first();

        if ($existingEntry) {
            return ['success' => false, 'message' => 'Student is already in queue'];
        }

        // Check if student has active PC usage
        $activeUsage = PCUsage::where('student_id', $studentId)
            ->whereIn('status', ['active', 'paused'])
            ->first();

        if ($activeUsage) {
            return ['success' => false, 'message' => 'Student already has an active PC session'];
        }

        // Get next queue position
        $nextPosition = static::max('queue_position') + 1;

        // Create queue entry
        $queueEntry = static::create([
            'student_id' => $studentId,
            'student_name' => $studentName,
            'status' => 'waiting',
            'queue_position' => $nextPosition,
            'queued_at' => Carbon::now(),
        ]);

        // Try to assign PC immediately if available
        static::processQueue();

        return ['success' => true, 'data' => $queueEntry, 'message' => 'Added to queue successfully'];
    }

    /**
     * Remove student from queue.
     */
    public function removeFromQueue()
    {
        // If assigned, free up the PC
        if ($this->status === 'assigned' && $this->assigned_pc_id) {
            $pc = PC::find($this->assigned_pc_id);
            if ($pc && $pc->status === 'reserved') {
                $pc->update(['status' => 'active']);
            }
        }

        $this->delete();

        // Reorder queue positions
        static::reorderQueue();

        // Process queue to assign next student
        static::processQueue();
    }

    /**
     * Move this queue entry to the end of the queue.
     */
    public function moveToEndOfQueue()
    {
        $maxPosition = static::max('queue_position');
        $this->update([
            'queue_position' => $maxPosition + 1,
            'status' => 'waiting',
            'assigned_pc_id' => null,
            'assigned_at' => null,
            'expires_at' => null,
        ]);

        // Reorder queue positions
        static::reorderQueue();
    }

    /**
     * Process the queue and assign PCs to waiting students.
     */
    public static function processQueue()
    {
        // First, expire any overdue assignments
        static::expireOverdueAssignments();

        // Get available PCs
        $availablePCs = PC::where('status', 'active')->get();

        if ($availablePCs->isEmpty()) {
            return;
        }

        // Get waiting queue entries in order
        $waitingEntries = static::waiting()
            ->orderByPosition()
            ->limit($availablePCs->count())
            ->get();

        foreach ($waitingEntries as $index => $queueEntry) {
            if (isset($availablePCs[$index])) {
                $pc = $availablePCs[$index];
                $queueEntry->assignPC($pc);
            }
        }
    }

    /**
     * Assign a PC to this queue entry.
     */
    public function assignPC(PC $pc)
    {
        $assignedAt = Carbon::now();
        $expiresAt = $assignedAt->copy()->addMinutes(5);

        $this->update([
            'status' => 'assigned',
            'assigned_pc_id' => $pc->id,
            'assigned_at' => $assignedAt,
            'expires_at' => $expiresAt,
        ]);

        // Update PC status to reserved
        $pc->update(['status' => 'reserved']);
        
        // Send push notification to student
        $this->sendPcAvailableNotification($pc);
    }
    
    /**
     * Send push notification to student when PC becomes available
     */
    protected function sendPcAvailableNotification(PC $pc)
    {
        try {
            \Illuminate\Support\Facades\Log::info("PCQueue: Sending PC available notification to student ID: {$this->student_id} for PC: {$pc->name}");
            
            // Get the PushNotificationController
            $controller = app()->make('App\Http\Controllers\PushNotificationController');
            
            // Send notification to student
            $result = $controller->notifyPcAvailable($this->student_id, $pc->name);
            
            if ($result) {
                \Illuminate\Support\Facades\Log::info("PCQueue: Successfully sent notification to student ID: {$this->student_id}");
            } else {
                \Illuminate\Support\Facades\Log::warning("PCQueue: Failed to send notification to student ID: {$this->student_id}");
            }
            
            return $result;
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("PCQueue: Failed to send PC available notification: {$e->getMessage()}");
            \Illuminate\Support\Facades\Log::error("PCQueue: Stack trace: {$e->getTraceAsString()}");
            return false;
        }
    }

    /**
     * Complete the queue entry (student checked in with admin).
     */
    public function complete()
    {
        if ($this->status !== 'assigned') {
            return false;
        }

        $this->update([
            'status' => 'completed',
            'completed_at' => Carbon::now(),
        ]);

        // Start PC usage session
        if ($this->assigned_pc_id) {
            $student = User::where('student_id', $this->student_id)->first();
            
            PCUsage::create([
                'pc_id' => $this->assigned_pc_id,
                'student_id' => $this->student_id,
                'student_name' => $this->student_name,
                'start_time' => Carbon::now(),
                'last_activity_time' => Carbon::now(),
                'status' => 'active',
                'is_paused' => false,
                'actual_usage_duration' => 0,
                'total_pause_duration' => 0
            ]);

            // Update PC status to in-use
            $pc = PC::find($this->assigned_pc_id);
            if ($pc) {
                $pc->update(['status' => 'in-use']);
            }
        }

        return true;
    }

    /**
     * Expire overdue assignments.
     */
    public static function expireOverdueAssignments()
    {
        $overdueEntries = static::assigned()
            ->where('expires_at', '<', Carbon::now())
            ->get();

        foreach ($overdueEntries as $entry) {
            $entry->autoExpire();
        }
    }

    /**
     * Reorder queue positions to eliminate gaps.
     */
    public static function reorderQueue()
    {
        $entries = static::active()
            ->orderBy('queue_position', 'asc')
            ->get();

        foreach ($entries as $index => $entry) {
            $entry->update(['queue_position' => $index + 1]);
        }
    }

    /**
     * Get remaining time before assignment expires (in seconds).
     */
    public function getRemainingTimeAttribute()
    {
        if ($this->status !== 'assigned' || !$this->expires_at) {
            return 0;
        }

        $remaining = $this->expires_at->diffInSeconds(Carbon::now(), false);
        return max(0, $remaining);
    }

    /**
     * Get formatted remaining time.
     */
    public function getFormattedRemainingTimeAttribute()
    {
        $seconds = $this->remaining_time;
        
        if ($seconds <= 0) {
            return 'Expired';
        }

        $minutes = floor($seconds / 60);
        $remainingSeconds = $seconds % 60;

        if ($minutes > 0) {
            return $minutes . 'm ' . $remainingSeconds . 's';
        }

        return $remainingSeconds . 's';
    }

    /**
     * Static method to clean up expired assignments.
     */
    public static function cleanupExpiredAssignments()
    {
        $expiredCount = 0;
        
        $expiredEntries = static::assigned()
            ->where('expires_at', '<', Carbon::now())
            ->get();

        foreach ($expiredEntries as $entry) {
            if ($entry->autoExpire()) {
                $expiredCount++;
            }
        }

        // Process queue after cleanup
        static::processQueue();

        return $expiredCount;
    }
}

