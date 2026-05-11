<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gmp_decomptes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignUuid('situation_id')->constrained('gmp_situations_travaux')->cascadeOnDelete();
            $table->foreignUuid('marche_id')->constrained('gmp_marches')->cascadeOnDelete();
            $table->integer('numero_decompte');
            $table->decimal('montant_brut', 18, 2);
            $table->decimal('retenue_garantie', 18, 2)->default(0);
            $table->decimal('avance_sur_marche', 18, 2)->default(0);
            $table->decimal('montant_net', 18, 2);
            $table->enum('statut', ['soumis', 'verifie', 'certifie', 'rejete'])->default('soumis');
            $table->foreignUuid('document_id')->nullable()->constrained('documents')->nullOnDelete();
            $table->foreignUuid('certifie_par')->nullable()->constrained('utilisateurs')->nullOnDelete();
            $table->timestampTz('certifie_le')->nullable();
            $table->timestampsTz();

            $table->index('marche_id');
            $table->index('situation_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gmp_decomptes');
    }
};
