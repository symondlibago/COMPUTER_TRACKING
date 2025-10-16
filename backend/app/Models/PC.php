<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PC extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'pcs';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'host_name',
        'mac_address',
        'row',
        'status',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Get the PC usage records for this PC.
     */
    public function pcUsages()
    {
        return $this->hasMany(PCUsage::class);
    }

    /**
     * Get the current active usage for this PC.
     */
    public function currentUsage()
    {
        return $this->hasOne(PCUsage::class)->where('status', 'active');
    }

    /**
     * Scope a query to only include active PCs.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope a query to only include in-use PCs.
     */
    public function scopeInUse($query)
    {
        return $query->where('status', 'in-use');
    }

    /**
     * Get the PC's status badge color.
     */
    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            'active' => 'green',
            'in-use' => 'blue',
            default => 'gray'
        };
    }

    /**
     * Check if PC is available for use.
     */
    public function isAvailable(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Check if PC is currently in use.
     */
    public function isInUse(): bool
    {
        return $this->status === 'in-use';
    }
}

