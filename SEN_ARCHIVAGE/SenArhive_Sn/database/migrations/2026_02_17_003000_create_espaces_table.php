<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('espaces', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->string('nom', 255);
            $table->text('description')->nullable();
            $table->string('couleur', 7)->nullable();
            $table->string('icone', 50)->nullable();
            $table->foreignUuid('created_by')->constrained('utilisateurs');
            $table->timestampsTz();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('espaces');
    }
};
