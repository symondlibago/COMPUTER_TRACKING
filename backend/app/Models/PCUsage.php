<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;
use App\Models\PCQueue;

class PCUsage extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'pc_usage';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'pc_id',
        'student_id',
        'student_name',
        'minutes_requested',
        'hours_requested', // Keep for backward compatibility
        'start_time',
        'end_time',
        'pause_start_time',
        'total_pause_duration',
        'actual_usage_duration',
        'is_paused',
        'last_activity_time',
        'status',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'pause_start_time' => 'datetime',
        'last_activity_time' => 'datetime',
        'is_paused' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Boot the model and set up event listeners.
     */
    protected static function boot()
    {
        parent::boot();

        // Auto-complete expired sessions when querying
        static::retrieved(function ($usage) {
            if ($usage->shouldAutoComplete()) {
                $usage->autoComplete();
            }
        });
    }

    /**
     * Get the PC that this usage belongs to.
     */
    public function pc()
    {
        return $this->belongsTo(PC::class);
    }

    /**
     * Get the user (student) that this usage belongs to.
     */
    public function student()
    {
        return $this->belongsTo(User::class, 'student_id', 'student_id');
    }

    /**
     * Scope a query to only include active usage records.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope a query to only include paused usage records.
     */
    public function scopePaused($query)
    {
        return $query->where('status', 'paused');
    }

    /**
     * Scope a query to only include completed usage records.
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Get the current actual usage time in seconds.
     */
    public function getCurrentUsageTimeAttribute()
    {
        if (!$this->start_time) {
            return 0;
        }

        $baseUsageTime = $this->actual_usage_duration;
        
        // If currently active (not paused), add time since last activity or start
        if ($this->status === 'active' && !$this->is_paused) {
            $lastTime = $this->last_activity_time ?? $this->start_time;
            $baseUsageTime += Carbon::now()->diffInSeconds($lastTime);
        }

        return $baseUsageTime;
    }

    /**
     * Get the current pause duration in seconds.
     */
    public function getCurrentPauseDurationAttribute()
    {
        $basePauseDuration = $this->total_pause_duration;
        
        // If currently paused, add time since pause started
        if ($this->is_paused && $this->pause_start_time) {
            $basePauseDuration += Carbon::now()->diffInSeconds($this->pause_start_time);
        }

        return $basePauseDuration;
    }

    /**
     * Check if the session should be auto-completed.
     * This happens when paused for more than 10 minutes.
     */
    public function shouldAutoComplete()
    {
        if ($this->status !== 'paused' || !$this->is_paused || !$this->pause_start_time) {
            return false;
        }

        // Check if paused for more than 10 minutes (600 seconds)
        $pauseDuration = Carbon::now()->diffInSeconds($this->pause_start_time);
        return $pauseDuration >= 600; // 10 minutes
    }

    /**
     * Automatically complete the usage session when paused too long.
     */
    public function autoComplete()
    {
        if ($this->shouldAutoComplete()) {
            $this->update([
                'status' => 'completed',
                'end_time' => Carbon::now(),
                'is_paused' => false,
                'total_pause_duration' => $this->current_pause_duration,
                'actual_usage_duration' => $this->current_usage_time
            ]);

            // Update PC status back to active
            $this->pc()->update(['status' => 'active']);

            return true;
        }

        return false;
    }

    /**
     * Start a new session.
     */
    public function startSession()
    {
        $this->update([
            'start_time' => Carbon::now(),
            'last_activity_time' => Carbon::now(),
            'status' => 'active',
            'is_paused' => false
        ]);

        // Update PC status to in-use
        $this->pc()->update(['status' => 'in-use']);
    }

    /**
     * Pause the current session.
     */
    public function pauseSession()
    {
        if ($this->status !== 'active' || $this->is_paused) {
            return false;
        }

        // Update actual usage time before pausing
        $currentUsageTime = $this->current_usage_time;

        $this->update([
            'status' => 'paused',
            'is_paused' => true,
            'pause_start_time' => Carbon::now(),
            'actual_usage_duration' => $currentUsageTime
        ]);

        return true;
    }

    /**
     * Resume the paused session.
     */
    public function resumeSession()
    {
        if ($this->status !== 'paused' || !$this->is_paused) {
            return false;
        }

        // Add pause duration to total
        $pauseDuration = $this->current_pause_duration;

        $this->update([
            'status' => 'active',
            'is_paused' => false,
            'pause_start_time' => null,
            'total_pause_duration' => $pauseDuration,
            'last_activity_time' => Carbon::now()
        ]);

        return true;
    }

    /**
     * Complete the usage session.
     */
    public function complete()
    {
        $currentUsageTime = $this->current_usage_time;
        $currentPauseDuration = $this->current_pause_duration;

        $this->update([
            'status' => 'completed',
            'end_time' => Carbon::now(),
            'is_paused' => false,
            'pause_start_time' => null,
            'actual_usage_duration' => $currentUsageTime,
            'total_pause_duration' => $currentPauseDuration
        ]);

        // Update PC status back to active
        $this->pc()->update(['status' => 'active']);

        PCQueue::processQueue();
    }

    /**
     * Cancel the usage session.
     */
    public function cancel()
    {
        $currentUsageTime = $this->current_usage_time;
        $currentPauseDuration = $this->current_pause_duration;

        $this->update([
            'status' => 'cancelled',
            'end_time' => Carbon::now(),
            'is_paused' => false,
            'pause_start_time' => null,
            'actual_usage_duration' => $currentUsageTime,
            'total_pause_duration' => $currentPauseDuration
        ]);

        // Update PC status back to active
        $this->pc()->update(['status' => 'active']);
        PCQueue::processQueue();
    }

    /**
     * Get formatted duration string for actual usage.
     */
    public function getFormattedUsageDurationAttribute()
    {
        $seconds = $this->current_usage_time;
        return $this->formatDuration($seconds);
    }

    /**
     * Get formatted duration string for pause time.
     */
    public function getFormattedPauseDurationAttribute()
    {
        $seconds = $this->current_pause_duration;
        return $this->formatDuration($seconds);
    }

    /**
     * Format duration from seconds to human readable format.
     */
    private function formatDuration($seconds)
    {
        if ($seconds < 60) {
            return $seconds . 's';
        }
        
        $minutes = floor($seconds / 60);
        $remainingSeconds = $seconds % 60;
        
        if ($minutes < 60) {
            return $remainingSeconds > 0 ? $minutes . 'm ' . $remainingSeconds . 's' : $minutes . 'm';
        }
        
        $hours = floor($minutes / 60);
        $remainingMinutes = $minutes % 60;
        
        $result = $hours . 'h';
        if ($remainingMinutes > 0) {
            $result .= ' ' . $remainingMinutes . 'm';
        }
        if ($remainingSeconds > 0 && $hours == 0) {
            $result .= ' ' . $remainingSeconds . 's';
        }
        
        return $result;
    }

    /**
     * Get remaining pause time before auto-completion (in seconds).
     */
    public function getRemainingPauseTimeAttribute()
    {
        if (!$this->is_paused || !$this->pause_start_time) {
            return 0;
        }

        $pausedFor = Carbon::now()->diffInSeconds($this->pause_start_time);
        $remaining = 600 - $pausedFor; // 10 minutes = 600 seconds
        
        return max(0, $remaining);
    }

    /**
     * Static method to clean up all expired sessions.
     */
    public static function cleanupExpiredSessions()
    {
        $expiredSessions = static::with('pc')
            ->where('status', 'paused')
            ->where('is_paused', true)
            ->whereNotNull('pause_start_time')
            ->get()
            ->filter(function ($usage) {
                return $usage->shouldAutoComplete();
            });

        $cleanedCount = 0;
        foreach ($expiredSessions as $session) {
            if ($session->autoComplete()) {
                $cleanedCount++;
            }
        }

        return $cleanedCount;
    }
}

