<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gmp_pieces_requises', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignUuid('appel_offre_id')->constrained('gmp_appels_offres')->cascadeOnDelete();
            $table->string('libelle', 255);
            $table->text('description')->nullable();
            // Formats acceptés : chaîne séparée par virgule ex. "pdf,docx"
            $table->string('formats_acceptes', 100)->nullable();
            $table->unsignedInteger('taille_max_mo')->default(10);
            $table->boolean('obligatoire')->default(true);
            $table->unsignedSmallInteger('ordre')->default(0);
            $table->timestampsTz();

            $table->index('appel_offre_id');
            $table->index('organisation_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gmp_pieces_requises');
    }
};
