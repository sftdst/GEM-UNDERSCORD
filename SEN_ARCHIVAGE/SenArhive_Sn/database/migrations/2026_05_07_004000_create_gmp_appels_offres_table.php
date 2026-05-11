<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gmp_appels_offres', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignUuid('marche_prevu_id')->constrained('gmp_marches_prevus')->cascadeOnDelete();
            $table->string('numero_aao', 100)->unique();
            $table->string('objet', 500);
            $table->foreignUuid('type_marche_id')->constrained('gmp_types_marche');
            $table->foreignUuid('mode_passation_id')->constrained('gmp_modes_passation');
            $table->decimal('montant_estimatif', 18, 2)->nullable();
            $table->date('date_publication')->nullable();
            $table->date('date_limite_questions')->nullable();
            $table->date('date_cloture');
            $table->string('lieu_depot', 255)->nullable();
            $table->enum('statut', ['preparation', 'publie', 'clos', 'evalue', 'attribue', 'annule'])->default('preparation');
            $table->string('pdf_aao_path', 500)->nullable();
            $table->foreignUuid('dossier_id')->nullable()->constrained('dossiers')->nullOnDelete();
            $table->foreignUuid('created_by')->constrained('utilisateurs');
            $table->timestampsTz();

            $table->index('organisation_id');
            $table->index('statut');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gmp_appels_offres');
    }
};
