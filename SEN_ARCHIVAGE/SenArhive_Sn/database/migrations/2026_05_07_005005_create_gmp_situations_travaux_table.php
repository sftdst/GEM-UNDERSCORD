<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gmp_situations_travaux', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignUuid('marche_id')->constrained('gmp_marches')->cascadeOnDelete();
            $table->integer('numero_situation');
            $table->date('date_situation');
            $table->date('periode_du');
            $table->date('periode_au');
            $table->decimal('taux_avancement_physique', 5, 2);
            $table->decimal('montant_situation', 18, 2);
            $table->decimal('cumul_situations_precedentes', 18, 2)->default(0);
            $table->decimal('cumul_total', 18, 2);
            $table->text('observations')->nullable();
            $table->enum('statut', ['soumise', 'validee', 'rejetee'])->default('soumise');
            $table->foreignUuid('document_id')->nullable()->constrained('documents')->nullOnDelete();
            $table->foreignUuid('valide_par')->nullable()->constrained('utilisateurs')->nullOnDelete();
            $table->timestampsTz();

            $table->unique(['marche_id', 'numero_situation']);
            $table->index('marche_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gmp_situations_travaux');
    }
};
