<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gmp_attributions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignUuid('appel_offre_id')->constrained('gmp_appels_offres')->cascadeOnDelete();
            $table->foreignUuid('soumission_id')->constrained('gmp_soumissions')->cascadeOnDelete();
            $table->foreignUuid('fournisseur_id')->constrained('gmp_fournisseurs');
            $table->decimal('montant_attribue', 18, 2);
            $table->date('date_attribution');
            $table->text('motif_choix');
            $table->enum('statut', ['provisoire', 'definitif', 'conteste', 'annule'])->default('provisoire');
            $table->boolean('alerte_ia')->default(false);
            $table->boolean('notification_envoyee')->default(false);
            $table->foreignUuid('created_by')->constrained('utilisateurs');
            $table->timestampsTz();

            $table->index('appel_offre_id');
            $table->index('fournisseur_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gmp_attributions');
    }
};
