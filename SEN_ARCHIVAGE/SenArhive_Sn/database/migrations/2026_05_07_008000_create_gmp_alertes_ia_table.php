<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gmp_alertes_ia', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->string('type_alerte', 100);
            $table->enum('niveau', ['info', 'attention', 'urgent', 'critique']);
            $table->string('entite_type', 50);
            $table->uuid('entite_id');
            $table->string('titre', 300);
            $table->text('message');
            $table->jsonb('details_json')->nullable();
            $table->text('recommandation')->nullable();
            $table->boolean('traite')->default(false);
            $table->foreignUuid('traite_par')->nullable()->constrained('utilisateurs')->nullOnDelete();
            $table->timestampTz('traite_le')->nullable();
            $table->text('note_traitement')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->index('organisation_id');
            $table->index(['entite_type', 'entite_id']);
            $table->index('niveau');
            $table->index('traite');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gmp_alertes_ia');
    }
};
