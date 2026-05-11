<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gmp_parametres_ia', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->decimal('seuil_alerte_budget', 5, 2)->default(80.00);
            $table->integer('seuil_alerte_delai')->default(7);
            $table->enum('sensibilite_anomalie', ['faible', 'normale', 'elevee'])->default('normale');
            $table->boolean('score_risque_actif')->default(true);
            $table->boolean('assistant_ia_actif')->default(true);
            $table->boolean('generation_docs_active')->default(true);
            $table->enum('rapport_anomalies_frequence', ['quotidien', 'hebdo', 'mensuel'])->default('hebdo');
            $table->jsonb('rapport_anomalies_destinataires')->default('[]');
            $table->string('modele_ia', 100)->default('claude-sonnet-4-6');
            $table->timestampsTz();

            $table->unique('organisation_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gmp_parametres_ia');
    }
};
