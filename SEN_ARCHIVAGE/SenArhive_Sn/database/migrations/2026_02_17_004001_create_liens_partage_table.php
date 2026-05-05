<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('liens_partage', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignUuid('document_id')->nullable()->constrained('documents')->cascadeOnDelete();
            $table->foreignUuid('dossier_id')->nullable()->constrained('dossiers')->cascadeOnDelete();
            $table->string('token', 100)->unique();
            $table->string('mot_de_passe', 255)->nullable();
            $table->boolean('peut_telecharger')->default(true);
            $table->timestampTz('expire_le')->nullable();
            $table->integer('max_telechargements')->nullable();
            $table->integer('nb_telechargements')->default(0);
            $table->foreignUuid('created_by')->constrained('utilisateurs');
            $table->timestampTz('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('liens_partage');
    }
};
