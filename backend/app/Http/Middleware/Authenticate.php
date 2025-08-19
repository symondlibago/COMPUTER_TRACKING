<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     */
    protected function redirectTo(Request $request): ?string
    {
        // For API requests, return null to avoid redirect and return JSON response instead
        if ($request->expectsJson() || $request->is('api/*')) {
            return null;
        }
        
        // For web requests, redirect to login route
        return route('login');
    }

    /**
     * Handle unauthenticated user for API requests
     */
    protected function unauthenticated($request, array $guards)
    {
        // For API requests, return JSON response
        if ($request->expectsJson() || $request->is('api/*')) {
            abort(response()->json([
                'success' => false,
                'message' => 'Unauthenticated. Please login to access this resource.'
            ], 401));
        }

        // For web requests, use default behavior
        parent::unauthenticated($request, $guards);
    }
}

