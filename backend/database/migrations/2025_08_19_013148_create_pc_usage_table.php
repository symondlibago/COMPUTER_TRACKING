<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pc_usage', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('pc_id');
            $table->string('student_id');
            $table->string('student_name');
            $table->integer('hours_requested');
            $table->timestamp('start_time');
            $table->timestamp('end_time')->nullable();
            $table->enum('status', ['active', 'completed', 'cancelled'])->default('active');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();


            // Foreign key constraints
            $table->foreign('pc_id')->references('id')->on('pcs')->onDelete('cascade');
            $table->foreign('student_id')->references('student_id')->on('users')->onDelete('cascade');
            
            // Indexes for better performance
            $table->index(['pc_id', 'status']);
            $table->index(['student_id', 'status']);
            $table->index('start_time');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pc_usage');
    }
};

