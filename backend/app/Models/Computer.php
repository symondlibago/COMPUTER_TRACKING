<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Computer extends Model
{
    use HasFactory;

    protected $fillable = [
        'hostname',
        'mac_address',
        'university',
        'status',
        'last_user',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get the sessions for the computer.
     */
    public function sessions()
    {
        return $this->hasMany(Session::class);
    }

    /**
     * Get the reservations for the computer.
     */
    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }

    /**
     * Get the current active session for the computer.
     */
    public function currentSession()
    {
        return $this->hasOne(Session::class)->whereNull('logout_time');
    }
}
