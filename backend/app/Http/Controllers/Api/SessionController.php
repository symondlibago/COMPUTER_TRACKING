<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Session;
use App\Models\Computer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SessionController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        $query = Session::with(['user', 'computer']);
        
        // Non-admin users can only see their own sessions
        if ($user->role !== 'admin') {
            $query->where('user_id', $user->id);
        }
        
        $sessions = $query->orderBy('login_time', 'desc')->get();
        
        return response()->json($sessions);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        
        $validator = Validator::make($request->all(), [
            'computer_id' => 'required|exists:computers,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $computer = Computer::find($request->computer_id);
        
        // Check if computer is available
        if ($computer->status !== 'Available' || !$computer->is_active) {
            return response()->json([
                'message' => 'Computer is not available'
            ], 422);
        }

        // Check if user already has an active session
        $activeSession = Session::where('user_id', $user->id)
            ->whereNull('logout_time')
            ->first();
            
        if ($activeSession) {
            return response()->json([
                'message' => 'You already have an active session'
            ], 422);
        }

        // Create new session
        $session = Session::create([
            'user_id' => $user->id,
            'computer_id' => $computer->id,
            'login_time' => now(),
        ]);

        // Update computer status
        $computer->update([
            'status' => 'In Use',
            'last_user' => $user->name
        ]);

        return response()->json([
            'message' => 'Session started successfully',
            'session' => $session->load(['user', 'computer'])
        ], 201);
    }

    public function show(Session $session)
    {
        $user = request()->user();
        
        if ($user->role !== 'admin' && $session->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        return response()->json($session->load(['user', 'computer']));
    }

    public function update(Request $request, Session $session)
    {
        $user = $request->user();
        
        if ($user->role !== 'admin' && $session->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        // Only allow ending sessions (logout)
        if ($session->logout_time) {
            return response()->json([
                'message' => 'Session already ended'
            ], 422);
        }

        $logoutTime = now();
        $duration = $logoutTime->diffInMinutes($session->login_time);
        
        $session->update([
            'logout_time' => $logoutTime,
            'duration_minutes' => $duration,
            'notes' => $request->notes,
        ]);

        // Update computer status back to available
        $session->computer->update(['status' => 'Available']);

        return response()->json([
            'message' => 'Session ended successfully',
            'session' => $session->load(['user', 'computer'])
        ]);
    }

    public function destroy(Session $session)
    {
        $user = request()->user();
        
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $session->delete();

        return response()->json([
            'message' => 'Session deleted successfully'
        ]);
    }

    public function active(Request $request)
    {
        $user = $request->user();
        
        $activeSession = Session::with(['user', 'computer'])
            ->where('user_id', $user->id)
            ->whereNull('logout_time')
            ->first();
            
        if (!$activeSession) {
            return response()->json([
                'message' => 'No active session found'
            ], 404);
        }

        // Calculate remaining time if there's a reservation
        $reservation = $user->reservations()
            ->where('computer_id', $activeSession->computer_id)
            ->where('status', 'Active')
            ->first();
            
        $remainingMinutes = null;
        if ($reservation) {
            $endTime = $activeSession->login_time->addHours($reservation->duration_hours);
            $remainingMinutes = max(0, now()->diffInMinutes($endTime, false));
        }

        return response()->json([
            'session' => $activeSession,
            'remaining_minutes' => $remainingMinutes
        ]);
    }
}
