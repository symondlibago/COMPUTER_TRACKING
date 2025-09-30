<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PCController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\PCUsageController;
use App\Http\Controllers\PCQueueController;
use App\Http\Controllers\PushNotificationController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public authentication routes
Route::post('/login', [AuthController::class, 'login']);

// Specific login routes for frontend compatibility (FIXED - removed /auth/ prefix)
Route::post('/admin/login', [AuthController::class, 'adminLogin']);
Route::post('/student/login', [AuthController::class, 'studentLogin']);

// Public PC Management routes (for testing - remove auth middleware temporarily)
Route::apiResource('pcs', PCController::class);
Route::patch('/pcs/{pc}/status', [PCController::class, 'updateStatus']);

// Student Management routes (public for admin access)
Route::apiResource('students', StudentController::class);
Route::get('/students/search', [StudentController::class, 'search']);
Route::get('/students/by-id/{studentId}', [StudentController::class, 'getByStudentId']);

// PC Usage Management routes
Route::get('/pc-usage/active', [PCUsageController::class, 'getActiveUsage']);
Route::post('/pc-usage/set-in-use', [PCUsageController::class, 'setPCInUse']);
Route::patch('/pc-usage/{id}/complete', [PCUsageController::class, 'completeUsage']);
Route::patch('/pc-usage/{id}/cancel', [PCUsageController::class, 'cancelUsage']);

// New pause/resume functionality routes
Route::patch('/pc-usage/{id}/pause', [PCUsageController::class, 'pauseUsage']);
Route::patch('/pc-usage/{id}/resume', [PCUsageController::class, 'resumeUsage']);

// History and status routes
Route::get('/pc-usage/pc/{pcId}/history', [PCUsageController::class, 'getPCUsageHistory']);
Route::get('/pc-usage/student/{studentId}/history', [PCUsageController::class, 'getStudentUsageHistory']);

// OPTIMIZED: New route to get all usage history in a single call
Route::get('/pc-usage/history/all', [PCUsageController::class, 'getAllUsageHistory']);

// NEW: PC Performance Analytics route for dashboard
Route::get('/pc-usage/performance-analytics', [PCUsageController::class, 'getPCPerformanceAnalytics']);

// Push Notification routes - Public VAPID key endpoint
Route::get('/push/vapid-public-key', [PushNotificationController::class, 'getVapidPublicKey'])->withoutMiddleware(['auth:sanctum', 'web']);

// Push Notification routes - Protected endpoints
Route::post('/push/subscribe', [PushNotificationController::class, 'subscribe']);
Route::post('/push/unsubscribe', [PushNotificationController::class, 'unsubscribe']);

// Routes for student portal
Route::get('/pc-status/students', [PCUsageController::class, 'getPCStatusForStudents']);
Route::get('/student/{studentId}/active-usage', [PCUsageController::class, 'getStudentActiveUsage']);

// Cleanup route
Route::post('/pc-usage/cleanup-expired', [PCUsageController::class, 'cleanupExpiredSessions']);

// PC Queue Management routes
Route::get('/pc-queue/status', [PCQueueController::class, 'getQueueStatus']);
Route::get('/pc-queue/student/{studentId}', [PCQueueController::class, 'getStudentQueueStatus']);
Route::post('/pc-queue/join', [PCQueueController::class, 'joinQueue']);
Route::post('/pc-queue/leave', [PCQueueController::class, 'leaveQueue']);
Route::post('/pc-queue/process', [PCQueueController::class, 'processQueue']);
Route::post('/pc-queue/cleanup-expired', [PCQueueController::class, 'cleanupExpiredAssignments']);
Route::get('/pc-queue/statistics', [PCQueueController::class, 'getQueueStatistics']);

// Student prefix routes for queue management
Route::prefix('student')->group(function () {
    Route::get('/queue-status', [PCQueueController::class, 'getQueueStatus']);
    Route::post('/join-queue', [PCQueueController::class, 'joinQueue']);
    Route::post('/leave-queue', [PCQueueController::class, 'leaveQueue']);
    Route::get('/current-assignment', [PCQueueController::class, 'getCurrentAssignment']);
    Route::get('/check-pc-available', [PCQueueController::class, 'checkPcAvailable']);
});

Route::get('/pc-queue/check-pc-available', [PCQueueController::class, 'checkPcAvailable']);

// Admin Queue Monitor routes
Route::get('/pc-queue/monitor', [PCQueueController::class, 'getQueueMonitor']);
Route::post('/pc-queue/{id}/check-in', [PCQueueController::class, 'checkInStudent']);
Route::post('/pc-queue/{id}/expire', [PCQueueController::class, 'expireQueueEntry']);



// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);

    Route::put('/profile/change-name', [AuthController::class, 'changeName']);
    Route::put('/profile/change-password', [AuthController::class, 'changePassword']);
    Route::put('/profile/change-otp', [AuthController::class, 'changeOtp']);
    Route::put('/profile/change-username', [AuthController::class, 'changeUsername']);
    
});

