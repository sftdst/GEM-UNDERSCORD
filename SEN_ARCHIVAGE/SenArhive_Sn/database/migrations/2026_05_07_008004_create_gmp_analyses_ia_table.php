<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gmp_analyses_ia', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->string('type_analyse', 100);
            $table->string('entite_type', 50)->nullable();
            $table->uuid('entite_id')->nullable();
            $table->text('prompt_envoye')->nullable();
            $table->jsonb('resultat_json')->default('{}');
            $table->text('explication')->nullable();
            $table->integer('tokens_utilises')->nullable();
            $table->integer('duree_ms')->nullable();
            $table->foreignUuid('utilisateur_id')->nullable()->constrained('utilisateurs')->nullOnDelete();
            $table->timestampTz('created_at')->useCurrent();

            $table->index('organisation_id');
            $table->index('type_analyse');
            $table->index(['entite_type', 'entite_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gmp_analyses_ia');
    }
};
