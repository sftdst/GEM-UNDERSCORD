<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commentaires', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('document_id')->constrained('documents')->cascadeOnDelete();
            $table->foreignUuid('parent_id')->nullable()->constrained('commentaires')->cascadeOnDelete();
            $table->foreignUuid('utilisateur_id')->constrained('utilisateurs');
            $table->text('contenu');
            $table->jsonb('position_json')->nullable();
            $table->boolean('est_resolu')->default(false);
            $table->timestampTz('modifie_le')->nullable();
            $table->timestampTz('deleted_at')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->index('document_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commentaires');
    }
};
