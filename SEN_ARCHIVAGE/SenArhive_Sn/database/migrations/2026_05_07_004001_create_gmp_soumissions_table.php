<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gmp_soumissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignUuid('appel_offre_id')->constrained('gmp_appels_offres')->cascadeOnDelete();
            $table->foreignUuid('fournisseur_id')->constrained('gmp_fournisseurs')->cascadeOnDelete();
            $table->string('reference_soumission', 100);
            $table->timestampTz('date_depot');
            $table->decimal('montant_offre_ht', 18, 2);
            $table->decimal('montant_offre_ttc', 18, 2);
            $table->integer('delai_execution_propose')->nullable();
            $table->enum('statut', ['deposee', 'conforme', 'non_conforme', 'retenue', 'eliminee'])->default('deposee');
            $table->decimal('score_technique', 5, 2)->nullable();
            $table->decimal('score_financier', 5, 2)->nullable();
            $table->decimal('score_global', 5, 2)->nullable();
            $table->text('motif_elimination')->nullable();
            $table->boolean('alerte_offre_anormale')->default(false);
            $table->foreignUuid('dossier_id')->nullable()->constrained('dossiers')->nullOnDelete();
            $table->timestampsTz();

            $table->index('appel_offre_id');
            $table->index('fournisseur_id');
            $table->index('statut');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gmp_soumissions');
    }
};
