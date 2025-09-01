<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PushSubscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'endpoint',
        'auth_token',
        'public_key',
    ];

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id', 'student_id');
    }
}