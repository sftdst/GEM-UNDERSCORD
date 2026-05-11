<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gmp_recommendations_ia', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->string('entite_type', 50);
            $table->uuid('entite_id')->nullable();
            $table->text('recommandation');
            $table->text('explication');
            $table->enum('priorite', ['basse', 'normale', 'haute', 'critique'])->default('normale');
            $table->string('impact_estime', 200)->nullable();
            $table->enum('statut', ['generee', 'vue', 'appliquee', 'ignoree'])->default('generee');
            $table->foreignUuid('vue_par')->nullable()->constrained('utilisateurs')->nullOnDelete();
            $table->timestampTz('created_at')->useCurrent();

            $table->index('organisation_id');
            $table->index('statut');
            $table->index('priorite');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gmp_recommendations_ia');
    }
};
