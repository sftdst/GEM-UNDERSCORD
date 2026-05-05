<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('versions_documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('document_id')->constrained('documents')->cascadeOnDelete();
            $table->integer('numero_version');
            $table->string('nom_fichier', 500);
            $table->bigInteger('taille_octets');
            $table->string('hash_sha256', 64)->nullable();
            $table->string('chemin_stockage', 1000);
            $table->string('url_stockage', 1000)->nullable();
            $table->text('commentaire')->nullable();
            $table->foreignUuid('created_by')->constrained('utilisateurs');
            $table->timestampTz('created_at')->useCurrent();

            $table->unique(['document_id', 'numero_version']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('versions_documents');
    }
};
