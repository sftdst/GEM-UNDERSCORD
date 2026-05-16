<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gmp_soumissions_pieces', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignUuid('soumission_id')->constrained('gmp_soumissions')->cascadeOnDelete();
            $table->foreignUuid('piece_requise_id')->constrained('gmp_pieces_requises');
            // Lien vers le document archivé (nullable : peut être manquant pour pièces facultatives)
            $table->foreignUuid('document_id')->nullable()->constrained('documents')->nullOnDelete();
            $table->string('nom_fichier_original', 255)->nullable();
            $table->unsignedBigInteger('taille_octets')->nullable();
            $table->enum('statut', ['uploade', 'valide', 'rejete'])->default('uploade');
            $table->text('motif_rejet')->nullable();
            $table->timestampsTz();

            $table->index('soumission_id');
            $table->index('organisation_id');
            $table->unique(['soumission_id', 'piece_requise_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gmp_soumissions_pieces');
    }
};
