<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gmp_fournisseurs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->string('raison_sociale', 255);
            $table->string('sigle', 50)->nullable();
            $table->string('ninea', 50)->nullable();
            $table->string('rc', 50)->nullable();
            $table->string('forme_juridique', 100)->nullable();
            $table->string('adresse', 500)->nullable();
            $table->string('ville', 100)->nullable();
            $table->string('pays', 5)->default('SN');
            $table->string('telephone', 20)->nullable();
            $table->string('email', 255)->nullable();
            $table->string('site_web', 255)->nullable();
            $table->jsonb('domaines_competence')->default('[]');
            $table->string('categorie', 50)->nullable();
            $table->decimal('score_global', 4, 2)->nullable();
            $table->enum('statut', ['actif', 'suspendu', 'blackliste'])->default('actif');
            $table->integer('nombre_marches_executes')->default(0);
            $table->boolean('alerte_score_faible')->default(false);
            $table->timestampsTz();

            $table->index('organisation_id');
            $table->index('ninea');
            $table->index('statut');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gmp_fournisseurs');
    }
};
