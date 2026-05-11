<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gmp_enveloppes_sectorielles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignUuid('exercice_id')->constrained('gmp_exercices_budgetaires')->cascadeOnDelete();
            $table->foreignUuid('secteur_id')->constrained('gmp_secteurs_intervention')->cascadeOnDelete();
            $table->decimal('montant_alloue', 18, 2);
            $table->decimal('montant_engage', 18, 2)->default(0);
            $table->timestampsTz();

            $table->unique(['exercice_id', 'secteur_id']);
            $table->index('organisation_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gmp_enveloppes_sectorielles');
    }
};
