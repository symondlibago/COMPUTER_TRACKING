<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Computer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ComputerController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        $query = Computer::query();
        
        // Non-admin users can only see active computers
        if ($user->role !== 'admin') {
            $query->where('is_active', true);
        }
        
        $computers = $query->orderBy('id')->get();
        
        return response()->json($computers);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'hostname' => 'required|string|max:255|unique:computers',
            'mac_address' => 'required|string|max:255|unique:computers',
            'university' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $computer = Computer::create([
            'hostname' => $request->hostname,
            'mac_address' => $request->mac_address,
            'university' => $request->university,
            'status' => 'Available',
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'Computer created successfully',
            'computer' => $computer
        ], 201);
    }

    public function show(Computer $computer)
    {
        return response()->json($computer);
    }

    public function update(Request $request, Computer $computer)
    {
        $user = $request->user();
        
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'hostname' => 'sometimes|string|max:255|unique:computers,hostname,' . $computer->id,
            'mac_address' => 'sometimes|string|max:255|unique:computers,mac_address,' . $computer->id,
            'university' => 'sometimes|string|max:255',
            'status' => 'sometimes|in:Available,In Use,Offline,Maintenance',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $computer->update($request->only([
            'hostname', 'mac_address', 'university', 'status', 'is_active'
        ]));

        return response()->json([
            'message' => 'Computer updated successfully',
            'computer' => $computer
        ]);
    }

    public function destroy(Computer $computer)
    {
        $user = request()->user();
        
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        // Check for active sessions
        if ($computer->sessions()->whereNull('logout_time')->exists()) {
            return response()->json([
                'message' => 'Cannot delete computer with active sessions'
            ], 422);
        }
        
        // Check for pending reservations
        if ($computer->reservations()->where('status', 'Pending')->exists()) {
            return response()->json([
                'message' => 'Cannot delete computer with pending reservations'
            ], 422);
        }

        $computer->delete();

        return response()->json([
            'message' => 'Computer deleted successfully'
        ]);
    }
}
