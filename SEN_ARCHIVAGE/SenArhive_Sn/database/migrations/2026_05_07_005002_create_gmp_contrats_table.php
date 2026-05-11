<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gmp_contrats', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignUuid('marche_id')->constrained('gmp_marches')->cascadeOnDelete();
            $table->string('numero_contrat', 100);
            $table->date('date_signature');
            $table->decimal('montant_ht', 18, 2);
            $table->decimal('montant_ttc', 18, 2);
            $table->integer('duree_jours');
            $table->date('date_debut');
            $table->date('date_fin');
            $table->decimal('cautionnement', 18, 2)->nullable();
            $table->decimal('garantie_bonne_execution', 18, 2)->nullable();
            $table->text('conditions_paiement')->nullable();
            $table->string('rubrique_budgetaire', 100)->nullable();
            $table->foreignUuid('document_id')->nullable()->constrained('documents')->nullOnDelete();
            $table->foreignUuid('created_by')->constrained('utilisateurs');
            $table->timestampsTz();

            $table->index('marche_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gmp_contrats');
    }
};
