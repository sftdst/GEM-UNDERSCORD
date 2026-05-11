<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gmp_evaluations_offres', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('soumission_id')->constrained('gmp_soumissions')->cascadeOnDelete();
            $table->foreignUuid('evaluateur_id')->constrained('utilisateurs')->cascadeOnDelete();
            $table->string('critere', 200);
            $table->decimal('ponderation', 5, 2);
            $table->decimal('note', 5, 2);
            $table->decimal('note_ponderee', 5, 2);
            $table->text('commentaire')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->index('soumission_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gmp_evaluations_offres');
    }
};
