<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Handle user login
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
    {
        try {
            // Validate the request
            $validator = Validator::make($request->all(), [
                'student_id' => 'required|string',
                'password' => 'required|string',
                'role' => 'required|in:admin,student'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Find user by student_id and role
            $user = User::where('student_id', $request->student_id)
                       ->where('role', $request->role)
                       ->first();

            // Check if user exists and password is correct
            if (!$user || !Hash::check($request->password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid credentials'
                ], 401);
            }

            // Create token for API authentication
            $token = $user->createToken('auth-token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'student_id' => $user->student_id,
                        'role' => $user->role
                    ],
                    'token' => $token
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred during login',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle user logout
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout(Request $request)
    {
        try {
            // Delete current access token
            $request->user()->currentAccessToken()->delete();

            return response()->json([
                'success' => true,
                'message' => 'Logout successful'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred during logout',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get authenticated user details
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function me(Request $request)
    {
        try {
            $user = $request->user();

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'student_id' => $user->student_id,
                        'role' => $user->role
                    ]
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Admin login with username instead of student_id
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function adminLogin(Request $request)
    {
        try {
            // Validate the request
            $validator = Validator::make($request->all(), [
                'username' => 'required|string',
                'password' => 'required|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Find admin user by student_id (using username as student_id for admin)
            $user = User::where('student_id', $request->username)
                       ->where('role', 'admin')
                       ->first();

            // Check if user exists and password is correct
            if (!$user || !Hash::check($request->password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid username or password'
                ], 401);
            }

            // Create token for API authentication
            $token = $user->createToken('auth-token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Admin login successful',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'username' => $user->student_id,
                        'role' => $user->role
                    ],
                    'token' => $token
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred during admin login',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Student login with student_id and password
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function studentLogin(Request $request)
    {
        try {
            // Validate the request
            $validator = Validator::make($request->all(), [
                'student_id' => 'required|string',
                'password' => 'required|string',
                'hours' => 'nullable|integer|min:1|max:8'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Find student by student_id and role
            $user = User::where('student_id', $request->student_id)
                       ->where('role', 'student')
                       ->first();

            // Check if user exists and password is correct
            if (!$user || !Hash::check($request->password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid student ID or password'
                ], 401);
            }

            // Create token for API authentication
            $token = $user->createToken('auth-token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Student login successful',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'student_id' => $user->student_id,
                        'email' => $user->student_id . '@student.edu',
                        'role' => $user->role,
                        'requestedHours' => $request->hours ?? 2
                    ],
                    'token' => $token
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred during student login',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateProfile(Request $request)
    {
        try {
            /** @var \App\Models\User $user */
            $user = $request->user();

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'password' => 'nullable|string|min:8|confirmed',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Update user's name
            $user->name = $request->name;

            // Update password only if a new one is provided
            if ($request->filled('password')) {
                $user->password = Hash::make($request->password);
            }

            $user->save();

            // Return the updated user data
            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'student_id' => $user->student_id, // or username for admin
                        'role' => $user->role
                    ]
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

