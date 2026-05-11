<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gmp_scores_risque', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignUuid('marche_id')->nullable()->constrained('gmp_marches')->cascadeOnDelete();
            $table->foreignUuid('marche_prevu_id')->nullable()->constrained('gmp_marches_prevus')->cascadeOnDelete();
            $table->decimal('score', 4, 2);
            $table->enum('niveau', ['faible', 'modere', 'eleve', 'critique']);
            $table->jsonb('variables_json')->default('{}');
            $table->text('recommandation')->nullable();
            $table->text('explication');
            $table->timestampTz('date_calcul');
            $table->timestampTz('created_at')->useCurrent();

            $table->index('marche_id');
            $table->index('marche_prevu_id');
            $table->index('niveau');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gmp_scores_risque');
    }
};
