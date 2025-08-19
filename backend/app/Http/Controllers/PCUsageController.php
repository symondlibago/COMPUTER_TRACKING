<?php

namespace App\Http\Controllers;

use App\Models\PC;
use App\Models\PCUsage;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

class PCUsageController extends Controller
{
    /**
     * Get all active PC usage sessions and auto-update expired ones.
     */
    public function getActiveUsage(): JsonResponse
    {
        try {
            // First, auto-complete expired sessions
            $this->autoCompleteExpiredSessions();

            $activeUsage = PCUsage::with(['pc', 'student'])
                ->active()
                ->orderBy('start_time', 'desc')
                ->get()
                ->map(function ($usage) {
                    return [
                        'id' => $usage->id,
                        'pc_id' => $usage->pc_id,
                        'pc_name' => $usage->pc->name,
                        'pc_row' => $usage->pc->row,
                        'student_id' => $usage->student_id,
                        'student_name' => $usage->student_name,
                        'minutes_requested' => $usage->minutes_requested,
                        'hours_requested' => ceil($usage->minutes_requested / 60), // For backward compatibility
                        'start_time' => $usage->start_time->format('Y-m-d H:i:s'),
                        'remaining_minutes' => $usage->remaining_time,
                        'elapsed_minutes' => $usage->elapsed_time,
                        'is_expired' => $usage->isExpired(),
                        'status' => $usage->status
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $activeUsage,
                'message' => 'Active PC usage retrieved successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving active PC usage: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all PCs with their current usage status for students.
     * This endpoint shows PC availability and remaining time without revealing student names.
     */
    public function getPCStatusForStudents(): JsonResponse
    {
        try {
            // First, auto-complete expired sessions
            $this->autoCompleteExpiredSessions();

            // Get all PCs
            $pcs = PC::all();
            
            // Get all active usage sessions
            $activeUsages = PCUsage::with('pc')
                ->active()
                ->get()
                ->keyBy('pc_id');

            $pcData = $pcs->map(function ($pc) use ($activeUsages) {
                $activeUsage = $activeUsages->get($pc->id);
                
                return [
                    'id' => $pc->id,
                    'name' => $pc->name,
                    'row' => $pc->row,
                    'status' => $pc->status,
                    'is_available' => $pc->status === 'active',
                    'is_in_use' => $pc->status === 'in-use',
                    'remaining_minutes' => $activeUsage ? $activeUsage->remaining_time : 0,
                    'elapsed_minutes' => $activeUsage ? $activeUsage->elapsed_time : 0,
                    'start_time' => $activeUsage ? $activeUsage->start_time->format('Y-m-d H:i:s') : null,
                    // Don't include student information for privacy
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $pcData,
                'message' => 'PC status retrieved successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving PC status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get active PC usage for a specific student.
     */
    public function getStudentActiveUsage($studentId): JsonResponse
    {
        try {
            // First, auto-complete expired sessions
            $this->autoCompleteExpiredSessions();

            $activeUsage = PCUsage::with('pc')
                ->where('student_id', $studentId)
                ->active()
                ->first();

            if (!$activeUsage) {
                return response()->json([
                    'success' => true,
                    'data' => null,
                    'message' => 'No active PC usage found for this student'
                ], 200);
            }

            $data = [
                'id' => $activeUsage->id,
                'pc_id' => $activeUsage->pc_id,
                'pc_name' => $activeUsage->pc->name,
                'pc_row' => $activeUsage->pc->row,
                'student_id' => $activeUsage->student_id,
                'student_name' => $activeUsage->student_name,
                'minutes_requested' => $activeUsage->minutes_requested,
                'hours_requested' => ceil($activeUsage->minutes_requested / 60),
                'start_time' => $activeUsage->start_time->format('Y-m-d H:i:s'),
                'remaining_minutes' => $activeUsage->remaining_time,
                'elapsed_minutes' => $activeUsage->elapsed_time,
                'is_expired' => $activeUsage->isExpired(),
                'status' => $activeUsage->status
            ];

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Student active usage retrieved successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving student active usage: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Auto-complete expired PC usage sessions.
     */
    private function autoCompleteExpiredSessions(): void
    {
        try {
            $expiredSessions = PCUsage::with('pc')
                ->active()
                ->get()
                ->filter(function ($usage) {
                    return $usage->isExpired();
                });

            foreach ($expiredSessions as $session) {
                $session->update([
                    'status' => 'completed',
                    'end_time' => Carbon::now()
                ]);

                // Update PC status back to active
                $session->pc->update(['status' => 'active']);
            }
        } catch (\Exception $e) {
            // Log error but don't throw to avoid breaking the main request
            \Log::error('Error auto-completing expired sessions: ' . $e->getMessage());
        }
    }

    /**
     * Set a PC in use by a student.
     */
    public function setPCInUse(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'pc_id' => 'required|exists:pcs,id',
                'student_id' => 'required|exists:users,student_id',
                'minutes' => 'required|integer|min:5|max:480', // 5 minutes to 8 hours
                'hours' => 'sometimes|integer|min:0|max:8' // For backward compatibility
            ]);

            // Handle both minutes and hours input for backward compatibility
            $totalMinutes = $validated['minutes'] ?? (($validated['hours'] ?? 1) * 60);

            // Check if PC is available
            $pc = PC::find($validated['pc_id']);
            if (!$pc->isAvailable()) {
                return response()->json([
                    'success' => false,
                    'message' => 'PC is not available for use'
                ], 400);
            }

            // Check if student already has an active session
            $existingUsage = PCUsage::where('student_id', $validated['student_id'])
                ->active()
                ->first();

            if ($existingUsage) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student already has an active PC session'
                ], 400);
            }

            // Get student information
            $student = User::where('student_id', $validated['student_id'])->first();

            // Create PC usage record
            $usage = PCUsage::create([
                'pc_id' => $validated['pc_id'],
                'student_id' => $validated['student_id'],
                'student_name' => $student->name,
                'minutes_requested' => $totalMinutes,
                'hours_requested' => ceil($totalMinutes / 60), // For backward compatibility
                'start_time' => Carbon::now(),
                'status' => 'active'
            ]);

            // Update PC status to in-use
            $pc->update(['status' => 'in-use']);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $usage->id,
                    'pc_name' => $pc->name,
                    'student_name' => $student->name,
                    'minutes_requested' => $usage->minutes_requested,
                    'hours_requested' => $usage->hours_requested,
                    'start_time' => $usage->start_time->format('Y-m-d H:i:s')
                ],
                'message' => 'PC set in use successfully'
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error setting PC in use: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Complete a PC usage session.
     */
    public function completeUsage(Request $request, $id): JsonResponse
    {
        try {
            $usage = PCUsage::find($id);

            if (!$usage) {
                return response()->json([
                    'success' => false,
                    'message' => 'PC usage session not found'
                ], 404);
            }

            if ($usage->status !== 'active') {
                return response()->json([
                    'success' => false,
                    'message' => 'PC usage session is not active'
                ], 400);
            }

            $usage->complete();

            return response()->json([
                'success' => true,
                'message' => 'PC usage session completed successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error completing PC usage: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel a PC usage session.
     */
    public function cancelUsage(Request $request, $id): JsonResponse
    {
        try {
            $usage = PCUsage::find($id);

            if (!$usage) {
                return response()->json([
                    'success' => false,
                    'message' => 'PC usage session not found'
                ], 404);
            }

            if ($usage->status !== 'active') {
                return response()->json([
                    'success' => false,
                    'message' => 'PC usage session is not active'
                ], 400);
            }

            $usage->cancel();

            return response()->json([
                'success' => true,
                'message' => 'PC usage session cancelled successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error cancelling PC usage: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get usage history for a specific PC.
     */
    public function getPCUsageHistory($pcId): JsonResponse
    {
        try {
            $usage = PCUsage::with('student')
                ->where('pc_id', $pcId)
                ->orderBy('start_time', 'desc')
                ->get()
                ->map(function ($usage) {
                    return [
                        'id' => $usage->id,
                        'student_id' => $usage->student_id,
                        'student_name' => $usage->student_name,
                        'minutes_requested' => $usage->minutes_requested,
                        'hours_requested' => $usage->hours_requested,
                        'start_time' => $usage->start_time->format('Y-m-d H:i:s'),
                        'end_time' => $usage->end_time ? $usage->end_time->format('Y-m-d H:i:s') : null,
                        'status' => $usage->status,
                        'elapsed_minutes' => $usage->elapsed_time
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $usage,
                'message' => 'PC usage history retrieved successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving PC usage history: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get usage history for a specific student.
     */
    public function getStudentUsageHistory($studentId): JsonResponse
    {
        try {
            $usage = PCUsage::with('pc')
                ->where('student_id', $studentId)
                ->orderBy('start_time', 'desc')
                ->get()
                ->map(function ($usage) {
                    return [
                        'id' => $usage->id,
                        'pc_id' => $usage->pc_id,
                        'pc_name' => $usage->pc->name,
                        'pc_row' => $usage->pc->row,
                        'minutes_requested' => $usage->minutes_requested,
                        'hours_requested' => $usage->hours_requested,
                        'start_time' => $usage->start_time->format('Y-m-d H:i:s'),
                        'end_time' => $usage->end_time ? $usage->end_time->format('Y-m-d H:i:s') : null,
                        'status' => $usage->status,
                        'elapsed_minutes' => $usage->elapsed_time
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $usage,
                'message' => 'Student usage history retrieved successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving student usage history: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Endpoint to manually trigger expired session cleanup.
     */
    public function cleanupExpiredSessions(): JsonResponse
    {
        try {
            $this->autoCompleteExpiredSessions();

            return response()->json([
                'success' => true,
                'message' => 'Expired sessions cleaned up successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error cleaning up expired sessions: ' . $e->getMessage()
            ], 500);
        }
    }
}

