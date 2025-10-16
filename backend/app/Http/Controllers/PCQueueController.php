<?php

namespace App\Http\Controllers;

use App\Models\PC;
use App\Models\PCQueue;
use App\Models\PCUsage;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

class PCQueueController extends Controller
{
    /**
     * Get current queue status for students.
     */
    public function getQueueStatus(): JsonResponse
    {
        try {
            // First, cleanup expired assignments
            PCQueue::cleanupExpiredAssignments();

            // Get all active queue entries
            $queueEntries = PCQueue::with('assignedPC')
                ->active()
                ->orderByPosition()
                ->get()
                ->map(function ($entry) {
                    return [
                        'id' => $entry->id,
                        'student_id' => $entry->student_id,
                        'student_name' => $entry->student_name,
                        'status' => $entry->status,
                        'queue_position' => $entry->queue_position,
                        'queued_at' => $entry->queued_at->toIso8601String(),
                        'assigned_pc_id' => $entry->assigned_pc_id,
                        'assigned_pc_name' => $entry->assignedPC ? $entry->assignedPC->name : null,
                        'assigned_at' => $entry->assigned_at ? $entry->assigned_at->toIso8601String() : null,
                        'expires_at' => $entry->expires_at ? $entry->expires_at->toIso8601String() : null,
                        'remaining_time' => $entry->remaining_time,
                        'formatted_remaining_time' => $entry->formatted_remaining_time,
                    ];
                });

            // Get available PCs count
            $availablePCsCount = PC::where('status', 'active')->count();

            // Check if auto queue is available (all PCs are in use)
            $allPCsInUse = PC::where('status', 'active')->count() === 0;

            return response()->json([
                'success' => true,
                'data' => [
                    'queue_entries' => $queueEntries,
                    'total_in_queue' => $queueEntries->count(),
                    'available_pcs_count' => $availablePCsCount,
                    'auto_queue_available' => $allPCsInUse,
                ],
                'message' => 'Queue status retrieved successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving queue status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get queue status for a specific student.
     */
    public function getStudentQueueStatus($studentId): JsonResponse
    {
        try {
            // First, cleanup expired assignments
            PCQueue::cleanupExpiredAssignments();
    
            $queueEntry = PCQueue::with('assignedPC')
                ->where('student_id', $studentId)
                ->whereIn('status', ['waiting', 'assigned'])
                ->first();
    
            if (!$queueEntry) {
                return response()->json([
                    'success' => true, // Return success as the request succeeded
                    'data' => null,
                    'message' => 'Student is not in queue'
                ], 200);
            }
    
            $relativePosition = 0; // Default value for assigned students
        if ($queueEntry->status === 'waiting') {
            // Count how many other students are WAITING with a lower queue position.
            $waitingStudentsAhead = PCQueue::waiting()
                ->where('queue_position', '<', $queueEntry->queue_position)
                ->count();
            
            // The student's position is the number of people ahead of them + 1.
            $relativePosition = $waitingStudentsAhead + 1;
        }
    
            $data = [
                'id' => $queueEntry->id,
                'student_id' => $queueEntry->student_id,
                'student_name' => $queueEntry->student_name,
                'status' => $queueEntry->status,
                'queue_position' => $queueEntry->queue_position, // The absolute position
                'relative_queue_position' => $relativePosition, // The NEW calculated relative position
                'queued_at' => $queueEntry->queued_at->toIso8601String(),
                'assigned_pc_id' => $queueEntry->assigned_pc_id,
                'assigned_pc_name' => $queueEntry->assignedPC ? $queueEntry->assignedPC->name : null,
                'assigned_at' => $queueEntry->assigned_at ? $queueEntry->assigned_at->toIso8601String() : null,
                'expires_at' => $queueEntry->expires_at ? $queueEntry->expires_at->toIso8601String() : null,
                'remaining_time' => $queueEntry->remaining_time,
                'formatted_remaining_time' => $queueEntry->formatted_remaining_time,
            ];
    
            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Student queue status retrieved successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving student queue status: ' . $e->getMessage()
            ], 500);
        }
    }
    /**
     * Add student to auto queue.
     */
    public function joinQueue(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'student_id' => 'required|exists:users,student_id'
            ]);

            // Get student information
            $student = User::where('student_id', $validated['student_id'])->first();

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student not found'
                ], 404);
            }

            // Add to queue
            $result = PCQueue::addToQueue($validated['student_id'], $student->name);

            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'message' => $result['message']
                ], 400);
            }

            $queueEntry = $result['data'];
            $data = [
                'id' => $queueEntry->id,
                'student_id' => $queueEntry->student_id,
                'student_name' => $queueEntry->student_name,
                'status' => $queueEntry->status,
                'queue_position' => $queueEntry->queue_position,
                'queued_at' => $queueEntry->queued_at->toIso8601String(),
            ];

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Successfully joined the auto queue'
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
                'message' => 'Error joining queue: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove student from queue.
     */
    public function leaveQueue(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'student_id' => 'required|string'
            ]);

            $queueEntry = PCQueue::where('student_id', $validated['student_id'])
                ->whereIn('status', ['waiting', 'assigned'])
                ->first();

            if (!$queueEntry) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student is not in queue'
                ], 404);
            }

            $queueEntry->removeFromQueue();

            return response()->json([
                'success' => true,
                'message' => 'Successfully left the queue'
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error leaving queue: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Admin: Get queue monitor data.
     */
    public function getQueueMonitor(): JsonResponse
    {
        try {
            // First, cleanup expired assignments
            PCQueue::cleanupExpiredAssignments();

            // Get all queue entries with assigned PCs
            $assignedEntries = PCQueue::with('assignedPC')
                ->assigned()
                ->orderBy('assigned_at', 'asc')
                ->get()
                ->map(function ($entry) {
                    return [
                        'id' => $entry->id,
                        'student_id' => $entry->student_id,
                        'student_name' => $entry->student_name,
                        'status' => $entry->status,
                        'assigned_pc_id' => $entry->assigned_pc_id,
                        'assigned_pc_name' => $entry->assignedPC ? $entry->assignedPC->name : null,
                        'assigned_pc_row' => $entry->assignedPC ? $entry->assignedPC->row : null,
                        'assigned_at' => $entry->assigned_at->toIso8601String(),
                        'expires_at' => $entry->expires_at->toIso8601String(),
                        'remaining_time' => $entry->remaining_time,
                        'formatted_remaining_time' => $entry->formatted_remaining_time,
                    ];
                });

            // Get waiting queue entries
            $waitingEntries = PCQueue::waiting()
                ->orderByPosition()
                ->get()
                ->map(function ($entry) {
                    return [
                        'id' => $entry->id,
                        'student_id' => $entry->student_id,
                        'student_name' => $entry->student_name,
                        'status' => $entry->status,
                        'queue_position' => $entry->queue_position,
                        'queued_at' => $entry->queued_at->toIso8601String(),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'assigned_entries' => $assignedEntries,
                    'waiting_entries' => $waitingEntries,
                    'total_assigned' => $assignedEntries->count(),
                    'total_waiting' => $waitingEntries->count(),
                ],
                'message' => 'Queue monitor data retrieved successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving queue monitor data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Admin: Check in student (complete queue entry and start PC usage).
     */
    public function checkInStudent(Request $request, $id): JsonResponse
    {
        try {
            $queueEntry = PCQueue::find($id);

            if (!$queueEntry) {
                return response()->json([
                    'success' => false,
                    'message' => 'Queue entry not found'
                ], 404);
            }

            if ($queueEntry->status !== 'assigned') {
                return response()->json([
                    'success' => false,
                    'message' => 'Queue entry is not assigned to a PC'
                ], 400);
            }

            if ($queueEntry->shouldAutoExpire()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Assignment has expired'
                ], 400);
            }

            if ($queueEntry->complete()) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'id' => $queueEntry->id,
                        'student_id' => $queueEntry->student_id,
                        'student_name' => $queueEntry->student_name,
                        'assigned_pc_name' => $queueEntry->assignedPC ? $queueEntry->assignedPC->name : null,
                        'completed_at' => $queueEntry->completed_at->format('Y-m-d H:i:s'),
                    ],
                    'message' => 'Student checked in successfully and PC usage started'
                ], 200);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to check in student'
                ], 400);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error checking in student: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Admin: Manually expire a queue entry.
     */
    public function expireQueueEntry(Request $request, $id): JsonResponse
    {
        try {
            $queueEntry = PCQueue::find($id);

            if (!$queueEntry) {
                return response()->json([
                    'success' => false,
                    'message' => 'Queue entry not found'
                ], 404);
            }

            if ($queueEntry->status !== 'assigned') {
                return response()->json([
                    'success' => false,
                    'message' => 'Queue entry is not assigned'
                ], 400);
            }

            $queueEntry->autoExpire();

            return response()->json([
                'success' => true,
                'message' => 'Queue entry expired and moved to end of queue'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error expiring queue entry: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process queue manually (for testing or admin use).
     */
    public function processQueue(): JsonResponse
    {
        try {
            // First, cleanup expired assignments
            PCQueue::cleanupExpiredAssignments();

            // Process the queue
            PCQueue::processQueue();

            return response()->json([
                'success' => true,
                'message' => 'Queue processed successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error processing queue: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cleanup expired assignments.
     */
    public function cleanupExpiredAssignments(): JsonResponse
    {
        try {
            $expiredCount = PCQueue::cleanupExpiredAssignments();

            return response()->json([
                'success' => true,
                'data' => [
                    'expired_count' => $expiredCount
                ],
                'message' => "Cleaned up {$expiredCount} expired assignments"
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error cleaning up expired assignments: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get queue statistics.
     */
    public function getQueueStatistics(): JsonResponse
    {
        try {
            $totalWaiting = PCQueue::waiting()->count();
            $totalAssigned = PCQueue::assigned()->count();
            $totalCompleted = PCQueue::where('status', 'completed')->count();
            $totalExpired = PCQueue::where('status', 'expired')->count();
            $availablePCs = PC::where('status', 'active')->count();
            $reservedPCs = PC::where('status', 'reserved')->count();
            $inUsePCs = PC::where('status', 'in-use')->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'queue_stats' => [
                        'waiting' => $totalWaiting,
                        'assigned' => $totalAssigned,
                        'completed' => $totalCompleted,
                        'expired' => $totalExpired,
                        'total_active' => $totalWaiting + $totalAssigned,
                    ],
                    'pc_stats' => [
                        'available' => $availablePCs,
                        'reserved' => $reservedPCs,
                        'in_use' => $inUsePCs,
                        'total' => $availablePCs + $reservedPCs + $inUsePCs,
                    ],
                ],
                'message' => 'Queue statistics retrieved successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving queue statistics: ' . $e->getMessage()
            ], 500);
        }
    }
}