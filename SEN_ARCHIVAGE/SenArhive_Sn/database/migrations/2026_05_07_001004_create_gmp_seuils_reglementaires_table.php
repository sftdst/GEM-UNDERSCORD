<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gmp_seuils_reglementaires', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->string('pays', 5)->default('SN');
            $table->foreignUuid('type_marche_id')->constrained('gmp_types_marche')->cascadeOnDelete();
            $table->foreignUuid('mode_passation_id')->constrained('gmp_modes_passation')->cascadeOnDelete();
            $table->decimal('montant_min', 18, 2)->default(0);
            $table->decimal('montant_max', 18, 2)->nullable();
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('annee_application');
            $table->boolean('actif')->default(true);
            $table->timestampsTz();

            $table->unique(['organisation_id', 'type_marche_id', 'mode_passation_id', 'pays', 'annee_application'], 'gmp_seuils_unique');
            $table->index('organisation_id');
            $table->index(['pays', 'annee_application']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gmp_seuils_reglementaires');
    }
};
