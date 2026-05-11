<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gmp_anomalies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->enum('type_anomalie', [
                'doublon',
                'offre_anormale',
                'fractionnement',
                'rotation_suspecte',
                'incoherence_montant',
                'attribution_suspecte',
            ]);
            $table->string('entite_type', 50);
            $table->uuid('entite_id');
            $table->text('description');
            $table->jsonb('donnees_json')->default('{}');
            $table->decimal('score_confiance', 5, 2)->default(0);
            $table->enum('statut', ['detectee', 'analysee', 'confirmee', 'faux_positif', 'resolue'])->default('detectee');
            $table->foreignUuid('traite_par')->nullable()->constrained('utilisateurs')->nullOnDelete();
            $table->timestampTz('traite_le')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->index('organisation_id');
            $table->index(['entite_type', 'entite_id']);
            $table->index('statut');
            $table->index('type_anomalie');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gmp_anomalies');
    }
};
