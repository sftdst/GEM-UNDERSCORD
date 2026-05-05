<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permissions_documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('document_id')->nullable()->constrained('documents')->cascadeOnDelete();
            $table->foreignUuid('dossier_id')->nullable()->constrained('dossiers')->cascadeOnDelete();
            $table->foreignUuid('espace_id')->nullable()->constrained('espaces')->cascadeOnDelete();
            $table->foreignUuid('utilisateur_id')->nullable()->constrained('utilisateurs')->cascadeOnDelete();
            $table->foreignUuid('groupe_id')->nullable()->constrained('groupes')->cascadeOnDelete();
            $table->boolean('peut_lire')->default(true);
            $table->boolean('peut_ecrire')->default(false);
            $table->boolean('peut_supprimer')->default(false);
            $table->boolean('peut_partager')->default(false);
            $table->boolean('peut_telecharger')->default(true);
            $table->boolean('peut_commenter')->default(true);
            $table->timestampTz('expire_le')->nullable();
            $table->foreignUuid('accorde_par')->constrained('utilisateurs');
            $table->timestampTz('created_at')->useCurrent();

            $table->index('document_id');
            $table->index('dossier_id');
            $table->index('utilisateur_id');
            $table->index('groupe_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permissions_documents');
    }
};
