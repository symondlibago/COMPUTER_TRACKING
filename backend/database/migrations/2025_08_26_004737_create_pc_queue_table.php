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
        Schema::create('pc_queue', function (Blueprint $table) {
            $table->id();
            $table->string('student_id')->comment('Student ID from users table');
            $table->string('student_name')->comment('Student name for quick reference');
            $table->enum('status', ['waiting', 'assigned', 'expired', 'completed'])->default('waiting')->comment('Queue entry status');
            $table->unsignedBigInteger('assigned_pc_id')->nullable()->comment('PC assigned when available');
            $table->timestamp('queued_at')->useCurrent()->comment('When student joined the queue');
            $table->timestamp('assigned_at')->nullable()->comment('When PC was assigned to student');
            $table->timestamp('expires_at')->nullable()->comment('When the assignment expires (5 minutes from assigned_at)');
            $table->timestamp('completed_at')->nullable()->comment('When student checked in with admin');
            $table->integer('queue_position')->comment('Position in queue for FIFO ordering');
            $table->timestamps();
            
            // Foreign key constraints
            $table->foreign('assigned_pc_id')->references('id')->on('pcs')->onDelete('set null');
            $table->index('student_id');
            
            // Indexes for better performance
            $table->index('status');
            $table->index('queue_position');
            $table->index('queued_at');
            $table->index('assigned_at');
            $table->index('expires_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pc_queue');
    }
};

