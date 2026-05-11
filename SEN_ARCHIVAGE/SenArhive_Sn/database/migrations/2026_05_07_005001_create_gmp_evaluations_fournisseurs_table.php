<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gmp_evaluations_fournisseurs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignUuid('fournisseur_id')->constrained('gmp_fournisseurs')->cascadeOnDelete();
            $table->foreignUuid('marche_id')->constrained('gmp_marches')->cascadeOnDelete();
            $table->foreignUuid('evaluateur_id')->constrained('utilisateurs');
            $table->decimal('score_delais', 4, 2);
            $table->decimal('score_qualite', 4, 2);
            $table->decimal('score_financier', 4, 2);
            $table->decimal('score_conformite', 4, 2);
            $table->decimal('score_global', 4, 2);
            $table->text('commentaire')->nullable();
            $table->boolean('rapport_reception')->default(false);
            $table->text('reserves')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->index('fournisseur_id');
            $table->index('marche_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gmp_evaluations_fournisseurs');
    }
};
