<?php

namespace App\Http\Controllers;

use App\Models\PC;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class PCController extends Controller
{
    /**
     * Display a listing of all PCs.
     */
    public function index(): JsonResponse
    {
        try {
            $pcs = PC::all();
            
            return response()->json([
                'success' => true,
                'data' => $pcs,
                'message' => 'PCs retrieved successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving PCs: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created PC in storage.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:pcs,name',
                'row' => 'required|string|max:100',
                'status' => 'sometimes|in:active,in-use,reserved'
            ]);

            $pc = PC::create([
                'name' => $validated['name'],
                'row' => $validated['row'],
                'status' => $validated['status'] ?? 'active'
            ]);

            return response()->json([
                'success' => true,
                'data' => $pc,
                'message' => 'PC created successfully'
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
                'message' => 'Error creating PC: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified PC.
     */
    public function show(PC $pc): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $pc,
                'message' => 'PC retrieved successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving PC: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified PC in storage.
     */
    public function update(Request $request, PC $pc): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'sometimes|string|max:255|unique:pcs,name,' . $pc->id,
                'row' => 'sometimes|string|max:100',
                'status' => 'sometimes|in:active,in-use,reserved'
            ]);

            $pc->update($validated);

            return response()->json([
                'success' => true,
                'data' => $pc->fresh(),
                'message' => 'PC updated successfully'
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
                'message' => 'Error updating PC: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified PC from storage.
     */
    public function destroy(PC $pc): JsonResponse
    {
        try {
            $pc->delete();

            return response()->json([
                'success' => true,
                'message' => 'PC deleted successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting PC: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update PC status.
     */
    public function updateStatus(Request $request, PC $pc): JsonResponse
    {
        try {
            $validated = $request->validate([
                'status' => 'required|in:active,in-use'
            ]);

            $pc->update(['status' => $validated['status']]);

            return response()->json([
                'success' => true,
                'data' => $pc->fresh(),
                'message' => 'PC status updated successfully'
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
                'message' => 'Error updating PC status: ' . $e->getMessage()
            ], 500);
        }
    }
}

