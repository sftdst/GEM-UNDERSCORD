<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gmp_exercices_budgetaires', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->unsignedSmallInteger('annee');
            $table->string('libelle', 100);
            $table->decimal('budget_global', 18, 2)->default(0);
            $table->enum('statut', ['preparation', 'ouvert', 'cloture'])->default('preparation');
            $table->date('date_ouverture')->nullable();
            $table->date('date_cloture')->nullable();
            $table->foreignUuid('created_by')->constrained('utilisateurs');
            $table->foreignUuid('cloture_par')->nullable()->constrained('utilisateurs')->nullOnDelete();
            $table->timestampTz('cloture_le')->nullable();
            $table->timestampsTz();

            $table->unique(['organisation_id', 'annee']);
            $table->index('organisation_id');
            $table->index('statut');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gmp_exercices_budgetaires');
    }
};
