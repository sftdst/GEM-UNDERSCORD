<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gmp_revisions_ppm', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignUuid('plan_id')->constrained('gmp_plans_passation')->cascadeOnDelete();
            $table->foreignUuid('marche_prevu_id')->nullable()->constrained('gmp_marches_prevus')->nullOnDelete();
            $table->enum('type_revision', ['ajout', 'modification', 'suppression']);
            $table->text('motif');
            $table->jsonb('donnees_avant')->nullable();
            $table->jsonb('donnees_apres')->nullable();
            $table->decimal('impact_budgetaire', 18, 2)->nullable();
            $table->text('analyse_ia')->nullable();
            $table->enum('statut_validation', ['en_attente', 'approuve', 'rejete'])->default('en_attente');
            $table->foreignUuid('valide_par')->nullable()->constrained('utilisateurs')->nullOnDelete();
            $table->timestampTz('valide_le')->nullable();
            $table->foreignUuid('created_by')->constrained('utilisateurs');
            $table->timestampTz('created_at')->useCurrent();

            $table->index('plan_id');
            $table->index('statut_validation');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gmp_revisions_ppm');
    }
};
