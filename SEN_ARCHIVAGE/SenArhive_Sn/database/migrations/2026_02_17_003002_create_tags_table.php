<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tags', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->string('nom', 100);
            $table->string('couleur', 7)->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->unique(['organisation_id', 'nom']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tags');
    }
};
