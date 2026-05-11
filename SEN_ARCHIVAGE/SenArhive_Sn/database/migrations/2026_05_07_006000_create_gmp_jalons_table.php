<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gmp_jalons', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignUuid('marche_id')->constrained('gmp_marches')->cascadeOnDelete();
            $table->string('libelle', 255);
            $table->enum('type', ['debut', 'fin', 'livraison', 'validation', 'paiement', 'autre']);
            $table->date('date_prevue');
            $table->date('date_reelle')->nullable();
            $table->enum('statut', ['a_venir', 'en_cours', 'atteint', 'depasse'])->default('a_venir');
            $table->boolean('alerte_envoyee')->default(false);
            $table->integer('ordre')->default(0);
            $table->timestampsTz();

            $table->index('marche_id');
            $table->index('statut');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gmp_jalons');
    }
};
