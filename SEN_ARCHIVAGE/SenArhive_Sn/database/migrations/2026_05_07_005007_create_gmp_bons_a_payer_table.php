<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gmp_bons_a_payer', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignUuid('marche_id')->constrained('gmp_marches')->cascadeOnDelete();
            $table->foreignUuid('decompte_id')->nullable()->constrained('gmp_decomptes')->nullOnDelete();
            $table->string('numero_bap', 50);
            $table->decimal('montant', 18, 2);
            $table->date('date_emission');
            $table->foreignUuid('valideur1_id')->nullable()->constrained('utilisateurs')->nullOnDelete();
            $table->timestampTz('date_validation1')->nullable();
            $table->foreignUuid('valideur2_id')->nullable()->constrained('utilisateurs')->nullOnDelete();
            $table->timestampTz('date_validation2')->nullable();
            $table->enum('statut', ['en_attente', 'validation1', 'validation2', 'valide', 'rejete'])->default('en_attente');
            $table->text('motif_rejet')->nullable();
            $table->timestampsTz();

            $table->unique(['marche_id', 'numero_bap']);
            $table->index('marche_id');
            $table->index('statut');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gmp_bons_a_payer');
    }
};
