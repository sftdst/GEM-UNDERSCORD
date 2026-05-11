<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gmp_modes_passation', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->string('code', 30);
            $table->string('libelle', 150);
            $table->text('description')->nullable();
            $table->boolean('actif')->default(true);
            $table->timestampsTz();

            $table->unique(['organisation_id', 'code']);
            $table->index('organisation_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gmp_modes_passation');
    }
};
