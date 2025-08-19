<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class StudentController extends Controller
{
    /**
     * Display a listing of students
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        try {
            $students = User::where('role', 'student')
                          ->select('id', 'name', 'student_id', 'created_at')
                          ->orderBy('created_at', 'desc')
                          ->get();

            return response()->json([
                'success' => true,
                'data' => $students
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching students',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created student
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        try {
            // Validate the request
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'student_id' => 'required|string|max:255|unique:users,student_id',
                'password' => 'required|string|min:6'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Create new student
            $student = User::create([
                'name' => $request->name,
                'student_id' => $request->student_id,
                'password' => Hash::make($request->password),
                'role' => 'student' // Default role
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Student created successfully',
                'data' => [
                    'id' => $student->id,
                    'name' => $student->name,
                    'student_id' => $student->student_id,
                    'role' => $student->role,
                    'created_at' => $student->created_at
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating student',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified student
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        try {
            $student = User::where('role', 'student')
                         ->where('id', $id)
                         ->select('id', 'name', 'student_id', 'created_at')
                         ->first();

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $student
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching student',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified student
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        try {
            $student = User::where('role', 'student')
                         ->where('id', $id)
                         ->first();

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student not found'
                ], 404);
            }

            // Validate the request
            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'student_id' => 'sometimes|required|string|max:255|unique:users,student_id,' . $id,
                'password' => 'sometimes|required|string|min:6'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Update student data
            $updateData = [];
            if ($request->has('name')) {
                $updateData['name'] = $request->name;
            }
            if ($request->has('student_id')) {
                $updateData['student_id'] = $request->student_id;
            }
            if ($request->has('password')) {
                $updateData['password'] = Hash::make($request->password);
            }

            $student->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Student updated successfully',
                'data' => [
                    'id' => $student->id,
                    'name' => $student->name,
                    'student_id' => $student->student_id,
                    'role' => $student->role,
                    'updated_at' => $student->updated_at
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating student',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified student
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        try {
            $student = User::where('role', 'student')
                         ->where('id', $id)
                         ->first();

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student not found'
                ], 404);
            }

            $student->delete();

            return response()->json([
                'success' => true,
                'message' => 'Student deleted successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting student',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Search students by ID or name
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function search(Request $request)
    {
        try {
            $query = $request->get('q', '');
            
            if (empty($query)) {
                return response()->json([
                    'success' => true,
                    'data' => []
                ], 200);
            }

            $students = User::where('role', 'student')
                          ->where(function($q) use ($query) {
                              $q->where('student_id', 'LIKE', "%{$query}%")
                                ->orWhere('name', 'LIKE', "%{$query}%");
                          })
                          ->select('id', 'name', 'student_id')
                          ->limit(10)
                          ->get();

            return response()->json([
                'success' => true,
                'data' => $students
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while searching students',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get student by student ID
     *
     * @param string $studentId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getByStudentId($studentId)
    {
        try {
            $student = User::where('role', 'student')
                         ->where('student_id', $studentId)
                         ->select('id', 'name', 'student_id', 'created_at')
                         ->first();

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $student
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching student',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

