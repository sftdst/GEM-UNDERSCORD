<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dossiers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignUuid('espace_id')->nullable()->constrained('espaces')->nullOnDelete();
            $table->foreignUuid('parent_id')->nullable()->constrained('dossiers')->cascadeOnDelete();
            $table->string('nom', 255);
            $table->text('description')->nullable();
            $table->text('chemin')->nullable();
            $table->integer('niveau')->default(0);
            $table->string('couleur', 7)->nullable();
            $table->string('icone', 50)->nullable();
            $table->foreignUuid('created_by')->constrained('utilisateurs');
            $table->timestampsTz();

            $table->index('organisation_id');
            $table->index('parent_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dossiers');
    }
};
