<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gmp_avenants', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignUuid('marche_id')->constrained('gmp_marches')->cascadeOnDelete();
            $table->integer('numero_avenant');
            $table->string('objet', 500);
            $table->text('motif');
            $table->decimal('montant_initial', 18, 2);
            $table->decimal('montant_avenant', 18, 2);
            $table->decimal('nouveau_montant', 18, 2);
            $table->integer('delai_initial_jours');
            $table->integer('delai_avenant_jours');
            $table->integer('nouveau_delai_jours');
            $table->date('nouvelle_date_fin');
            $table->text('impact_budget_analyse')->nullable();
            $table->enum('statut', ['en_attente', 'approuve', 'rejete'])->default('en_attente');
            $table->foreignUuid('document_id')->nullable()->constrained('documents')->nullOnDelete();
            $table->foreignUuid('approuve_par')->nullable()->constrained('utilisateurs')->nullOnDelete();
            $table->timestampTz('approuve_le')->nullable();
            $table->foreignUuid('created_by')->constrained('utilisateurs');
            $table->timestampsTz();

            $table->unique(['marche_id', 'numero_avenant']);
            $table->index('marche_id');
            $table->index('statut');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gmp_avenants');
    }
};
