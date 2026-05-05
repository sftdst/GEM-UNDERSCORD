<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plan_fonctionnalite', function (Blueprint $table) {
            $table->uuid('plan_id');
            $table->uuid('fonctionnalite_id');
            $table->primary(['plan_id', 'fonctionnalite_id']);
            $table->foreign('plan_id')->references('id')->on('plans')->cascadeOnDelete();
            $table->foreign('fonctionnalite_id')->references('id')->on('fonctionnalites')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plan_fonctionnalite');
    }
};
