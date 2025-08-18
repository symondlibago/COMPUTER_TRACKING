<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\Computer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class ReservationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        $query = Reservation::with(['user', 'computer']);
        
        // Non-admin users can only see their own reservations
        if ($user->role !== 'admin') {
            $query->where('user_id', $user->id);
        }
        
        $reservations = $query->orderBy('start_time')->get();
        
        return response()->json($reservations);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        
        $validator = Validator::make($request->all(), [
            'computer_id' => 'sometimes|exists:computers,id',
            'duration_hours' => 'required|integer|min:1|max:8',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Auto-queue logic: find the computer with the shortest queue
        if (!$request->has('computer_id')) {
            $computer = $this->findBestAvailableComputer();
            if (!$computer) {
                return response()->json([
                    'message' => 'No computers available for reservation'
                ], 422);
            }
        } else {
            $computer = Computer::find($request->computer_id);
            if (!$computer || !$computer->is_active) {
                return response()->json([
                    'message' => 'Computer not available'
                ], 422);
            }
        }

        // Check if user already has a pending reservation
        $existingReservation = Reservation::where('user_id', $user->id)
            ->where('status', 'Pending')
            ->first();
            
        if ($existingReservation) {
            return response()->json([
                'message' => 'You already have a pending reservation'
            ], 422);
        }

        // Calculate start time based on queue position
        $startTime = $this->calculateStartTime($computer->id);

        $reservation = Reservation::create([
            'user_id' => $user->id,
            'computer_id' => $computer->id,
            'start_time' => $startTime,
            'duration_hours' => $request->duration_hours,
            'status' => 'Pending',
        ]);

        return response()->json([
            'message' => 'Reservation created successfully',
            'reservation' => $reservation->load(['user', 'computer']),
            'queue_position' => $this->getQueuePosition($reservation)
        ], 201);
    }

    public function show(Reservation $reservation)
    {
        $user = request()->user();
        
        if ($user->role !== 'admin' && $reservation->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        return response()->json($reservation->load(['user', 'computer']));
    }

    public function update(Request $request, Reservation $reservation)
    {
        $user = $request->user();
        
        if ($user->role !== 'admin' && $reservation->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'status' => 'sometimes|in:Pending,Active,Completed,Cancelled',
            'duration_hours' => 'sometimes|integer|min:1|max:8',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Handle status changes
        if ($request->has('status')) {
            if ($request->status === 'Active') {
                // Start the session
                $this->startSession($reservation);
            } elseif ($request->status === 'Completed') {
                // End the session
                $this->endSession($reservation);
            }
        }

        $reservation->update($request->only(['status', 'duration_hours']));

        return response()->json([
            'message' => 'Reservation updated successfully',
            'reservation' => $reservation->load(['user', 'computer'])
        ]);
    }

    public function destroy(Reservation $reservation)
    {
        $user = request()->user();
        
        if ($user->role !== 'admin' && $reservation->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        if ($reservation->status === 'Active') {
            return response()->json([
                'message' => 'Cannot delete active reservation'
            ], 422);
        }

        $reservation->delete();

        return response()->json([
            'message' => 'Reservation cancelled successfully'
        ]);
    }

    private function findBestAvailableComputer()
    {
        // Find computer with shortest queue (FIFO logic)
        return Computer::where('is_active', true)
            ->withCount(['reservations' => function ($query) {
                $query->where('status', 'Pending');
            }])
            ->orderBy('reservations_count')
            ->first();
    }

    private function calculateStartTime($computerId)
    {
        // Get the last reservation for this computer
        $lastReservation = Reservation::where('computer_id', $computerId)
            ->where('status', 'Pending')
            ->orderBy('start_time', 'desc')
            ->first();

        if (!$lastReservation) {
            return now();
        }

        // Add the duration of the last reservation to get the next start time
        return $lastReservation->start_time->addHours($lastReservation->duration_hours);
    }

    private function getQueuePosition($reservation)
    {
        return Reservation::where('computer_id', $reservation->computer_id)
            ->where('status', 'Pending')
            ->where('start_time', '<=', $reservation->start_time)
            ->count();
    }

    private function startSession($reservation)
    {
        // Update computer status
        $reservation->computer->update([
            'status' => 'In Use',
            'last_user' => $reservation->user->name
        ]);

        // Create session record
        $reservation->user->sessions()->create([
            'computer_id' => $reservation->computer_id,
            'login_time' => now(),
        ]);
    }

    private function endSession($reservation)
    {
        // Find and end the active session
        $session = $reservation->user->sessions()
            ->where('computer_id', $reservation->computer_id)
            ->whereNull('logout_time')
            ->first();

        if ($session) {
            $logoutTime = now();
            $duration = $logoutTime->diffInMinutes($session->login_time);
            
            $session->update([
                'logout_time' => $logoutTime,
                'duration_minutes' => $duration,
            ]);
        }

        // Update computer status back to available
        $reservation->computer->update(['status' => 'Available']);
    }
}
