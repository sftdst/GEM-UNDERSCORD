<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gmp_dependances_marches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('marche_id')->constrained('gmp_marches')->cascadeOnDelete();
            $table->foreignUuid('marche_prerequis_id')->constrained('gmp_marches')->cascadeOnDelete();
            $table->enum('type', ['FS', 'SS', 'FF', 'SF'])->default('FS');
            $table->integer('decalage_jours')->default(0);
            $table->timestampTz('created_at')->useCurrent();

            $table->unique(['marche_id', 'marche_prerequis_id']);
            $table->index('marche_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gmp_dependances_marches');
    }
};
