<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('abonnements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignUuid('plan_id')->constrained('plans');
            $table->string('statut', 20)->default('actif');
            $table->string('periodicite', 10)->default('mensuel');
            $table->date('date_debut')->default(now());
            $table->date('date_fin')->nullable();
            $table->date('date_renouvellement')->nullable();
            $table->decimal('prix_applique', 10, 2);
            $table->string('devise', 3)->default('XOF');
            $table->timestampsTz();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('abonnements');
    }
};
