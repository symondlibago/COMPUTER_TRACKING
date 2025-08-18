<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Computer;
use App\Models\Session;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $user = $request->user();
        
        $totalComputers = Computer::count();
        $availableComputers = Computer::where('status', 'Available')->where('is_active', true)->count();
        $activeSessions = Session::whereNull('logout_time')->count();
        
        $userReservations = 0;
        $userTimeUsed = 0;
        
        if ($user) {
            $userReservations = Reservation::where('user_id', $user->id)
                ->where('status', 'Pending')
                ->count();
                
            // Calculate user time used today
            $userTimeUsed = Session::where('user_id', $user->id)
                ->whereNotNull('logout_time')
                ->whereDate('login_time', today())
                ->sum('duration_minutes') ?? 0;
        }

        return response()->json([
            'totalComputers' => $totalComputers,
            'availableComputers' => $availableComputers,
            'activeSessions' => $activeSessions,
            'userReservations' => $userReservations,
            'userTimeUsed' => $userTimeUsed,
        ]);
    }

    public function adminStats(Request $request)
    {
        $user = $request->user();
        
        if (!$user || $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $totalUsers = User::count();
        $loggedInUsers = Session::whereNull('logout_time')->distinct('user_id')->count();
        $totalReservations = Reservation::count();
        $pendingReservations = Reservation::where('status', 'Pending')->count();
        
        // Get unique queued users
        $queuedUsers = Reservation::where('status', 'Pending')
            ->distinct('user_id')
            ->count();
        
        // Calculate session time statistics
        $sessionStats = Session::whereNotNull('logout_time')
            ->selectRaw('AVG(duration_minutes) as avg_duration, SUM(duration_minutes) as total_duration')
            ->first();
        
        $averageSessionTime = $sessionStats->avg_duration ?? 0;
        $totalSessionTime = $sessionStats->total_duration ?? 0;

        return response()->json([
            'totalUsers' => $totalUsers,
            'activeUsers' => [
                'loggedIn' => $loggedInUsers,
                'inQueue' => $queuedUsers,
                'total' => $loggedInUsers + $queuedUsers
            ],
            'totalReservations' => $totalReservations,
            'pendingReservations' => $pendingReservations,
            'totalSessionTime' => $totalSessionTime,
            'averageSessionTime' => round($averageSessionTime),
        ]);
    }
}
