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
        Schema::create('pcs', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique()->comment('PC identifier like PC-001, PC-002');
            $table->string('row', 100)->comment('Row location like Row 1, Row 2');
            $table->enum('status', ['active', 'in-use'])->default('active')->comment('PC status');
            $table->timestamps();
            
            // Add indexes for better performance
            $table->index('status');
            $table->index('row');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pcs');
    }
};

