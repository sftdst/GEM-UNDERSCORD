<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gmp_arbitrages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignUuid('superviseur_id')->constrained('utilisateurs');
            $table->jsonb('organisations_concernees')->default('[]');
            $table->string('objet', 300);
            $table->text('description_conflit');
            $table->text('decision');
            $table->jsonb('pieces_jointes_json')->nullable();
            $table->enum('statut', ['ouvert', 'en_cours', 'clos'])->default('ouvert');
            $table->timestampsTz();

            $table->index('statut');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gmp_arbitrages');
    }
};
