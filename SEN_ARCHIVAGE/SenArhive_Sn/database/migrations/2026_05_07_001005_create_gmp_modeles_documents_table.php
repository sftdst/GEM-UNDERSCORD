<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gmp_modeles_documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->string('code', 50);
            $table->string('libelle', 200);
            $table->foreignUuid('type_marche_id')->nullable()->constrained('gmp_types_marche')->nullOnDelete();
            $table->foreignUuid('mode_passation_id')->nullable()->constrained('gmp_modes_passation')->nullOnDelete();
            $table->longText('contenu_template');
            $table->jsonb('variables_json')->default('[]');
            $table->boolean('actif')->default(true);
            $table->foreignUuid('created_by')->constrained('utilisateurs');
            $table->timestampsTz();

            $table->unique(['organisation_id', 'code']);
            $table->index('organisation_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gmp_modeles_documents');
    }
};
