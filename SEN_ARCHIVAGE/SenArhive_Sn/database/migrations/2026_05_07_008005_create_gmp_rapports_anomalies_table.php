<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gmp_rapports_anomalies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->date('periode_debut');
            $table->date('periode_fin');
            $table->integer('nombre_anomalies')->default(0);
            $table->jsonb('par_type_json')->default('{}');
            $table->integer('anomalies_critiques')->default(0);
            $table->text('contenu_rapport')->nullable();
            $table->boolean('envoye')->default(false);
            $table->timestampTz('envoye_le')->nullable();
            $table->jsonb('destinataires_json')->default('[]');
            $table->timestampTz('created_at')->useCurrent();

            $table->index('organisation_id');
            $table->index(['periode_debut', 'periode_fin']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gmp_rapports_anomalies');
    }
};
