<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

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
            if ($usage->isExpired() && $usage->status === 'active') {
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
     * Scope a query to only include completed usage records.
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Get the remaining time in minutes.
     */
    public function getRemainingTimeAttribute()
    {
        if ($this->status !== 'active' || !$this->start_time) {
            return 0;
        }

        // Use minutes_requested if available, otherwise fall back to hours_requested
        $totalMinutes = $this->minutes_requested ?? ($this->hours_requested * 60);
        $endTime = $this->start_time->copy()->addMinutes($totalMinutes);
        $now = Carbon::now();

        if ($now >= $endTime) {
            return 0;
        }

        return $now->diffInMinutes($endTime);
    }

    /**
     * Get the elapsed time in minutes.
     */
    public function getElapsedTimeAttribute()
    {
        if (!$this->start_time) {
            return 0;
        }

        $now = $this->end_time ?? Carbon::now();
        return $this->start_time->diffInMinutes($now);
    }

    /**
     * Check if the usage session has expired.
     */
    public function isExpired()
    {
        if ($this->status !== 'active' || !$this->start_time) {
            return false;
        }

        // Use minutes_requested if available, otherwise fall back to hours_requested
        $totalMinutes = $this->minutes_requested ?? ($this->hours_requested * 60);
        $endTime = $this->start_time->copy()->addMinutes($totalMinutes);
        return Carbon::now() >= $endTime;
    }

    /**
     * Automatically complete the usage session when expired.
     */
    public function autoComplete()
    {
        if ($this->isExpired() && $this->status === 'active') {
            $this->update([
                'status' => 'completed',
                'end_time' => Carbon::now()
            ]);

            // Update PC status back to active
            $this->pc()->update(['status' => 'active']);

            return true;
        }

        return false;
    }

    /**
     * Complete the usage session.
     */
    public function complete()
    {
        $this->update([
            'status' => 'completed',
            'end_time' => Carbon::now()
        ]);

        // Update PC status back to active
        $this->pc()->update(['status' => 'active']);
    }

    /**
     * Cancel the usage session.
     */
    public function cancel()
    {
        $this->update([
            'status' => 'cancelled',
            'end_time' => Carbon::now()
        ]);

        // Update PC status back to active
        $this->pc()->update(['status' => 'active']);
    }

    /**
     * Get the total requested time in minutes.
     */
    public function getTotalMinutesAttribute()
    {
        return $this->minutes_requested ?? ($this->hours_requested * 60);
    }

    /**
     * Get formatted duration string.
     */
    public function getFormattedDurationAttribute()
    {
        $totalMinutes = $this->total_minutes;
        
        if ($totalMinutes < 60) {
            return $totalMinutes . 'm';
        }
        
        $hours = floor($totalMinutes / 60);
        $minutes = $totalMinutes % 60;
        
        if ($minutes === 0) {
            return $hours . 'h';
        }
        
        return $hours . 'h ' . $minutes . 'm';
    }

    /**
     * Static method to clean up all expired sessions.
     */
    public static function cleanupExpiredSessions()
    {
        $expiredSessions = static::with('pc')
            ->active()
            ->get()
            ->filter(function ($usage) {
                return $usage->isExpired();
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

