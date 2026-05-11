<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gmp_marches_prevus', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('plan_id')->constrained('gmp_plans_passation')->cascadeOnDelete();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->string('numero', 50);
            $table->string('objet', 500);
            $table->text('description')->nullable();
            $table->foreignUuid('type_marche_id')->constrained('gmp_types_marche');
            $table->foreignUuid('mode_passation_id')->constrained('gmp_modes_passation');
            $table->foreignUuid('source_financement_id')->constrained('gmp_sources_financement');
            $table->foreignUuid('secteur_id')->constrained('gmp_secteurs_intervention');
            $table->decimal('montant_previsionnel', 18, 2);
            $table->date('date_lancement_prevue');
            $table->date('date_attribution_prevue');
            $table->date('date_debut_prevue');
            $table->date('date_fin_prevue');
            $table->integer('duree_prevue_jours');
            $table->enum('statut', ['planifie', 'lance', 'attribue', 'en_execution', 'solde', 'annule'])->default('planifie');
            $table->text('observations')->nullable();
            $table->decimal('score_risque_ia', 4, 2)->nullable();
            $table->foreignUuid('dossier_id')->nullable()->constrained('dossiers')->nullOnDelete();
            $table->foreignUuid('created_by')->constrained('utilisateurs');
            $table->timestampsTz();

            $table->unique(['plan_id', 'numero']);
            $table->index('plan_id');
            $table->index('organisation_id');
            $table->index('statut');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gmp_marches_prevus');
    }
};
