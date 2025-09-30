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
        // Validate the request, including the new otp_code
        $validator = Validator::make($request->all(), [
            'username' => 'required|string',
            'password' => 'required|string',
            'otp_code' => 'required|string|digits:6', // Add this validation
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Find admin user by username
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

        // Check if OTP code is valid and not expired
        if (!$user->otp_code || !Hash::check($request->otp_code, $user->otp_code)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid PIN code. Access denied.'
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

    public function changeName(Request $request)
{
    /** @var \App\Models\User $user */
    $user = $request->user();

    $validator = Validator::make($request->all(), [
        'name' => 'required|string|max:255',
        'otp_code' => 'required|string|digits:6',
    ]);

    if ($validator->fails()) {
        return response()->json(['success' => false, 'message' => 'Validation failed', 'errors' => $validator->errors()], 422);
    }

    // Verify OTP
    if (!Hash::check($request->otp_code, $user->otp_code)) {
        return response()->json(['success' => false, 'message' => 'Invalid OTP code.'], 401);
    }

    $user->name = $request->name;
    $user->save();

    return response()->json(['success' => true, 'message' => 'Name updated successfully', 'data' => ['user' => $user]]);
}

public function changePassword(Request $request)
{
    /** @var \App\Models\User $user */
    $user = $request->user();

    $validator = Validator::make($request->all(), [
        'password' => 'required|string|min:8|confirmed',
        'otp_code' => 'required|string|digits:6',
    ]);

    if ($validator->fails()) {
        return response()->json(['success' => false, 'message' => 'Validation failed', 'errors' => $validator->errors()], 422);
    }

    // Verify OTP
    if (!Hash::check($request->otp_code, $user->otp_code)) {
        return response()->json(['success' => false, 'message' => 'Invalid OTP code.'], 401);
    }

    $user->password = Hash::make($request->password);
    $user->save();

    return response()->json(['success' => true, 'message' => 'Password updated successfully.']);
}

public function changeOtp(Request $request)
{
    /** @var \App\Models\User $user */
    $user = $request->user();

    $validator = Validator::make($request->all(), [
        'current_password' => 'required|string',
        'new_otp_code' => 'required|string|digits:6|confirmed',
    ]);

    if ($validator->fails()) {
        return response()->json(['success' => false, 'message' => 'Validation failed', 'errors' => $validator->errors()], 422);
    }

    // Verify current password
    if (!Hash::check($request->current_password, $user->password)) {
        return response()->json(['success' => false, 'message' => 'Incorrect current password.'], 401);
    }

    $user->otp_code = Hash::make($request->new_otp_code);
    $user->save();

    return response()->json(['success' => true, 'message' => 'OTP code updated successfully.']);
}

public function changeUsername(Request $request)
{
    /** @var \App\Models\User $user */
    $user = $request->user();

    $validator = Validator::make($request->all(), [
        'current_password' => 'required|string',
        'otp_code' => 'required|string|digits:6',
        'new_username' => 'required|string|max:255|unique:users,student_id,' . $user->id,
    ]);

    if ($validator->fails()) {
        return response()->json(['success' => false, 'message' => 'Validation failed', 'errors' => $validator->errors()], 422);
    }

    // Verify current password and OTP
    if (!Hash::check($request->current_password, $user->password)) {
        return response()->json(['success' => false, 'message' => 'Incorrect current password.'], 401);
    }
    if (!Hash::check($request->otp_code, $user->otp_code)) {
        return response()->json(['success' => false, 'message' => 'Invalid OTP code.'], 401);
    }

    $user->student_id = $request->new_username;
    $user->save();

    return response()->json(['success' => true, 'message' => 'Username updated successfully', 'data' => ['user' => $user]]);
}

    
}

