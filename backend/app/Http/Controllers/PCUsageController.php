<?php

namespace App\Http\Controllers;

use App\Models\PC;
use App\Models\PCUsage;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

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
                ->whereIn('status', ['active', 'paused'])
                ->orderBy('start_time', 'desc')
                ->get()
                ->map(function ($usage) {
                    return [
                        'id' => $usage->id,
                        'pc_id' => $usage->pc_id,
                        'pc_name' => $usage->pc->name,
                        'pc_row' => $usage->pc->row,
                        'mac_address' => $usage->pc->mac_address,
                        'student_id' => $usage->student_id,
                        'student_name' => $usage->student_name,
                        'start_time' => $usage->start_time->toIso8601String(),
                        'created_at' => $usage->created_at->toIso8601String(),
                        'actual_usage_duration' => $usage->current_usage_time,
                        'total_pause_duration' => $usage->current_pause_duration,
                        'formatted_usage_duration' => $usage->formatted_usage_duration,
                        'formatted_pause_duration' => $usage->formatted_pause_duration,
                        'is_paused' => $usage->is_paused,
                        // FIX: Changed date format to ISO 8601 to include timezone info
                        'pause_start_time' => $usage->pause_start_time ? $usage->pause_start_time->toIso8601String() : null,
                        'remaining_pause_time' => $usage->remaining_pause_time,
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
     * Get PC performance analytics for dashboard.
     */
    public function getPCPerformanceAnalytics(): JsonResponse
    {
        try {
            // First, auto-complete expired sessions
            $this->autoCompleteExpiredSessions();

            // Get all PCs with their usage statistics
            $pcs = PC::all();
            $performanceData = [];

            foreach ($pcs as $pc) {
                // Get completed sessions for this PC
                $completedSessions = PCUsage::where('pc_id', $pc->id)
                    ->where('status', 'completed')
                    ->get();

                // Get active session for this PC
                $activeSession = PCUsage::where('pc_id', $pc->id)
                    ->whereIn('status', ['active', 'paused'])
                    ->first();

                // Calculate statistics
                $totalSessions = $completedSessions->count();
                $totalUsageTime = $completedSessions->sum('actual_usage_duration'); // in seconds
                
                // Find highest session time (in minutes)
                $highestSessionTime = $completedSessions->max('actual_usage_duration');
                $avgSessionTime = $totalSessions > 0 ? round($totalUsageTime / $totalSessions / 60) : 0; // in minutes
                $highestSessionTimeMinutes = $highestSessionTime ? round($highestSessionTime / 60) : 0;

                // Calculate utilization rate based on total time vs available time
                // For simplicity, we'll calculate based on sessions vs total possible sessions in a day
                $utilizationRate = min(100, ($totalSessions * 10)); // Rough estimate, adjust as needed

                // If there's an active session, include it in calculations
                if ($activeSession) {
                    $totalSessions += 1;
                    $currentSessionTime = round($activeSession->current_usage_time / 60); // in minutes
                    if ($currentSessionTime > $highestSessionTimeMinutes) {
                        $highestSessionTimeMinutes = $currentSessionTime;
                    }
                }

                $performanceData[] = [
                    'id' => $pc->id,
                    'name' => $pc->name,
                    'location' => $pc->row, // Using row as location
                    'status' => $pc->status,
                    'avgSessionTime' => max($avgSessionTime, $highestSessionTimeMinutes), // Use highest time as requested
                    'totalSessions' => $totalSessions,
                    'utilizationRate' => min(100, $utilizationRate),
                    'highestSessionTime' => $highestSessionTimeMinutes,
                    'isCurrentlyInUse' => $activeSession !== null,
                    'currentSessionDuration' => $activeSession ? round($activeSession->current_usage_time / 60) : 0
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $performanceData,
                'message' => 'PC performance analytics retrieved successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving PC performance analytics: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all PCs with their current usage status for students.
     */
    public function getPCStatusForStudents(): JsonResponse
    {
        // ... (function remains the same, but the student's active usage data will be correct now)
        try {
            // First, auto-complete expired sessions
            $this->autoCompleteExpiredSessions();

            // Get all PCs
            $pcs = PC::all();
            
            // Get all active usage sessions (including paused)
            $activeUsages = PCUsage::with('pc')
                ->whereIn('status', ['active', 'paused'])
                ->get()
                ->keyBy('pc_id');

            $pcData = $pcs->map(function ($pc) use ($activeUsages) {
                $activeUsage = $activeUsages->get($pc->id);
                
                return [
                    'id' => $pc->id,
                    'name' => $pc->name,
                    'row' => $pc->row,
                    'mac_address' => $pc->mac_address,
                    'status' => $pc->status,
                    'is_available' => $pc->status === 'active',
                    'is_in_use' => $pc->status === 'in-use',
                    'usage_duration' => $activeUsage ? $activeUsage->current_usage_time : 0,
                    'formatted_usage_duration' => $activeUsage ? $activeUsage->formatted_usage_duration : '0s',
                    'is_paused' => $activeUsage ? $activeUsage->is_paused : false,
                    // FIX: Changed date format to ISO 8601 to include timezone info
                    'start_time' => $activeUsage ? $activeUsage->start_time->toIso8601String() : null,
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
                ->whereIn('status', ['active', 'paused'])
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
                'pc_mac_address' => $activeUsage->pc->mac_address,
                'student_id' => $activeUsage->student_id,
                'student_name' => $activeUsage->student_name,
                 // FIX: Changed date format to ISO 8601 to include timezone info
                'start_time' => $activeUsage->start_time->toIso8601String(),
                'actual_usage_duration' => $activeUsage->current_usage_time,
                'total_pause_duration' => $activeUsage->current_pause_duration,
                'formatted_usage_duration' => $activeUsage->formatted_usage_duration,
                'formatted_pause_duration' => $activeUsage->formatted_pause_duration,
                'is_paused' => $activeUsage->is_paused,
                // FIX: Changed date format to ISO 8601 to include timezone info
                'pause_start_time' => $activeUsage->pause_start_time ? $activeUsage->pause_start_time->toIso8601String() : null,
                'remaining_pause_time' => $activeUsage->remaining_pause_time,
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
     * Auto-complete expired PC usage sessions (paused for more than 10 minutes).
     */
    private function autoCompleteExpiredSessions(): void
    {
        try {
            PCUsage::cleanupExpiredSessions();
        } catch (\Exception $e) {
            // Log error but don't throw to avoid breaking the main request
        }
    }

    /**
     * Set a PC in use by a student (start session).
     */
    public function setPCInUse(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'pc_id' => 'required|exists:pcs,id',
                'student_id' => 'required|exists:users,student_id'
            ]);

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
                ->whereIn('status', ['active', 'paused'])
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
                'start_time' => Carbon::now(),
                'last_activity_time' => Carbon::now(),
                'status' => 'active',
                'is_paused' => false,
                'actual_usage_duration' => 0,
                'total_pause_duration' => 0
            ]);

            // Update PC status to in-use
            $pc->update(['status' => 'in-use']);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $usage->id,
                    'pc_name' => $pc->name,
                    'student_name' => $student->name,
                    'start_time' => $usage->start_time->format('Y-m-d H:i:s')
                ],
                'message' => 'PC session started successfully'
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
                'message' => 'Error starting PC session: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Pause a PC usage session.
     */
    public function pauseUsage(Request $request, $id): JsonResponse
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

            if ($usage->is_paused) {
                return response()->json([
                    'success' => false,
                    'message' => 'PC usage session is already paused'
                ], 400);
            }

            if ($usage->pauseSession()) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'id' => $usage->id,
                        'status' => $usage->status,
                        'is_paused' => $usage->is_paused,
                        'pause_start_time' => $usage->pause_start_time->format('Y-m-d H:i:s'),
                        'remaining_pause_time' => $usage->remaining_pause_time
                    ],
                    'message' => 'PC usage session paused successfully'
                ], 200);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to pause PC usage session'
                ], 400);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error pausing PC usage: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Resume a paused PC usage session.
     */
    public function resumeUsage(Request $request, $id): JsonResponse
    {
        try {
            $usage = PCUsage::find($id);

            if (!$usage) {
                return response()->json([
                    'success' => false,
                    'message' => 'PC usage session not found'
                ], 404);
            }

            if ($usage->status !== 'paused') {
                return response()->json([
                    'success' => false,
                    'message' => 'PC usage session is not paused'
                ], 400);
            }

            if (!$usage->is_paused) {
                return response()->json([
                    'success' => false,
                    'message' => 'PC usage session is not currently paused'
                ], 400);
            }

            if ($usage->resumeSession()) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'id' => $usage->id,
                        'status' => $usage->status,
                        'is_paused' => $usage->is_paused,
                        'total_pause_duration' => $usage->total_pause_duration
                    ],
                    'message' => 'PC usage session resumed successfully'
                ], 200);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to resume PC usage session'
                ], 400);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error resuming PC usage: ' . $e->getMessage()
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

            if (!in_array($usage->status, ['active', 'paused'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'PC usage session is not active or paused'
                ], 400);
            }

            $usage->complete();

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $usage->id,
                    'status' => $usage->status,
                    'end_time' => $usage->end_time->format('Y-m-d H:i:s'),
                    'actual_usage_duration' => $usage->actual_usage_duration,
                    'total_pause_duration' => $usage->total_pause_duration,
                    'formatted_usage_duration' => $usage->formatted_usage_duration,
                    'formatted_pause_duration' => $usage->formatted_pause_duration
                ],
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

            if (!in_array($usage->status, ['active', 'paused'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'PC usage session is not active or paused'
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
                        // OPTIMIZED: Use consistent ISO 8601 date format
                        'start_time' => $usage->start_time->toIso8601String(),
                        'end_time' => $usage->end_time ? $usage->end_time->toIso8601String() : null,
                        'created_at' => $usage->created_at->toIso8601String(),
                        'updated_at' => $usage->updated_at->toIso8601String(),
                        'actual_usage_duration' => $usage->actual_usage_duration,
                        'total_pause_duration' => $usage->total_pause_duration,
                        'formatted_usage_duration' => $usage->formatted_usage_duration,
                        'formatted_pause_duration' => $usage->formatted_pause_duration,
                        'status' => $usage->status
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
                        // OPTIMIZED: Use consistent ISO 8601 date format
                        'start_time' => $usage->start_time->toIso8601String(),
                        'end_time' => $usage->end_time ? $usage->end_time->toIso8601String() : null,
                        'created_at' => $usage->created_at->toIso8601String(),
                        'updated_at' => $usage->updated_at->toIso8601String(),
                        'actual_usage_duration' => $usage->actual_usage_duration,
                        'total_pause_duration' => $usage->total_pause_duration,
                        'formatted_usage_duration' => $usage->formatted_usage_duration,
                        'formatted_pause_duration' => $usage->formatted_pause_duration,
                        'status' => $usage->status
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

    public function getAllUsageHistory(): JsonResponse
    {
        try {
            $history = PCUsage::with('pc')
                ->whereNotIn('status', ['active', 'paused'])
                ->orderBy('start_time', 'desc')
                ->get()
                ->map(function ($usage) {
                    return [
                        'id' => $usage->id,
                        'student_id' => $usage->student_id,
                        'student_name' => $usage->student_name,
                        'pc_id' => $usage->pc_id,
                        'pc_name' => $usage->pc->name,
                        'pc_row' => $usage->pc->row,
                        'start_time' => $usage->start_time->toIso8601String(),
                        'end_time' => $usage->end_time ? $usage->end_time->toIso8601String() : null,
                        'created_at' => $usage->created_at->toIso8601String(),
                        'updated_at' => $usage->updated_at->toIso8601String(),
                        'actual_usage_duration' => $usage->actual_usage_duration,
                        'status' => $usage->status
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $history,
                'message' => 'All usage history retrieved successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving all usage history: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Endpoint to manually trigger expired session cleanup.
     */
    public function cleanupExpiredSessions(): JsonResponse
    {
        try {
            $cleanedCount = PCUsage::cleanupExpiredSessions();

            return response()->json([
                'success' => true,
                'data' => ['cleaned_sessions' => $cleanedCount],
                'message' => "Cleaned up {$cleanedCount} expired sessions"
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error cleaning up expired sessions: ' . $e->getMessage()
            ], 500);
        }
    }
}

