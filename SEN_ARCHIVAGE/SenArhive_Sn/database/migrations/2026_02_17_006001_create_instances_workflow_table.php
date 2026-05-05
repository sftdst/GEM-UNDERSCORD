<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('instances_workflow', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('workflow_id')->constrained('workflows');
            $table->foreignUuid('document_id')->constrained('documents')->cascadeOnDelete();
            $table->string('statut', 30)->default('en_cours');
            $table->integer('etape_courante')->default(1);
            $table->foreignUuid('initie_par')->constrained('utilisateurs');
            $table->text('commentaire')->nullable();
            $table->timestampsTz();
        });

        Schema::create('etapes_workflow', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('instance_id')->constrained('instances_workflow')->cascadeOnDelete();
            $table->integer('numero_etape');
            $table->foreignUuid('approbateur_id')->constrained('utilisateurs');
            $table->string('statut', 20)->default('en_attente');
            $table->text('commentaire')->nullable();
            $table->timestampTz('traite_le')->nullable();
            $table->timestampTz('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('etapes_workflow');
        Schema::dropIfExists('instances_workflow');
    }
};
