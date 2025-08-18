<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ComputerController;
use App\Http\Controllers\Api\SessionController;
use App\Http\Controllers\Api\ReservationController;

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

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    
    // Dashboard routes
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/dashboard/admin-stats', [DashboardController::class, 'adminStats']);
    
    // Computer routes
    Route::apiResource('computers', ComputerController::class);
    
    // Session routes
    Route::apiResource('sessions', SessionController::class);
    
    // Reservation routes
    Route::apiResource('reservations', ReservationController::class);
});

    // Additional session routes
    Route::get('/sessions/active', [SessionController::class, 'active']);

