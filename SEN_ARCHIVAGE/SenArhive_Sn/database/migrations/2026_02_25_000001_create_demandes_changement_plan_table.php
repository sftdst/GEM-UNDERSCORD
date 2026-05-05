<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('demandes_changement_plan', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignUuid('plan_actuel_id')->nullable()->constrained('plans')->nullOnDelete();
            $table->foreignUuid('plan_demande_id')->constrained('plans');
            $table->string('periodicite_demandee', 10)->default('mensuel');
            $table->string('statut', 20)->default('en_attente'); // en_attente, approuvee, rejetee
            $table->text('message')->nullable();
            $table->text('motif_rejet')->nullable();
            $table->timestampTz('traite_le')->nullable();
            $table->timestampsTz();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('demandes_changement_plan');
    }
};
