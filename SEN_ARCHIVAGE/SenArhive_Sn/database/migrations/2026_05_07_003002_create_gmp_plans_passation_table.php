<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gmp_plans_passation', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignUuid('exercice_id')->constrained('gmp_exercices_budgetaires')->cascadeOnDelete();
            $table->string('reference', 50);
            $table->string('intitule', 255);
            $table->integer('version')->default(1);
            $table->enum('statut', [
                'brouillon',
                'soumis',
                'en_validation',
                'valide_sectoriel',
                'soumis_approbation',
                'approuve',
                'publie',
                'revise',
            ])->default('brouillon');
            $table->decimal('montant_total_previsionnel', 18, 2)->default(0);
            $table->integer('nombre_marches')->default(0);
            $table->timestampTz('date_soumission')->nullable();
            $table->timestampTz('date_approbation')->nullable();
            $table->timestampTz('date_publication')->nullable();
            $table->string('pdf_officiel_path', 500)->nullable();
            $table->string('portail_publication_url', 500)->nullable();
            $table->foreignUuid('pipeline_instance_id')->nullable()->constrained('pipeline_instances')->nullOnDelete();
            $table->foreignUuid('created_by')->constrained('utilisateurs');
            $table->timestampsTz();

            $table->unique(['organisation_id', 'exercice_id', 'version']);
            $table->index('organisation_id');
            $table->index('statut');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gmp_plans_passation');
    }
};
