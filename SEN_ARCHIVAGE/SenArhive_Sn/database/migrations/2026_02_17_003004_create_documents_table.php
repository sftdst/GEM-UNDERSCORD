<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignUuid('dossier_id')->nullable()->constrained('dossiers')->nullOnDelete();
            $table->foreignUuid('categorie_id')->nullable()->constrained('categories');
            $table->string('titre', 500);
            $table->text('description')->nullable();
            $table->string('nom_fichier_original', 500);
            $table->string('extension', 20);
            $table->string('type_mime', 100);
            $table->bigInteger('taille_octets')->default(0);
            $table->string('statut', 30)->default('actif');
            $table->integer('version_courante')->default(1);
            $table->boolean('est_chiffre')->default(false);
            $table->string('hash_sha256', 64)->nullable();
            $table->date('date_expiration')->nullable();
            $table->jsonb('metadonnees')->default('{}');
            $table->text('texte_extrait')->nullable();
            $table->foreignUuid('created_by')->constrained('utilisateurs');
            $table->foreignUuid('updated_by')->nullable()->constrained('utilisateurs');
            $table->timestampTz('deleted_at')->nullable();
            $table->timestampsTz();

            $table->index('organisation_id');
            $table->index('dossier_id');
            $table->index('statut');
            $table->index('extension');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
