<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gmp_affectations_equipe', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('marche_id')->constrained('gmp_marches')->cascadeOnDelete();
            $table->foreignUuid('utilisateur_id')->constrained('utilisateurs')->cascadeOnDelete();
            $table->string('role_dans_marche', 100);
            $table->date('date_debut')->nullable();
            $table->date('date_fin')->nullable();
            $table->boolean('actif')->default(true);
            $table->timestampsTz();

            $table->index('marche_id');
            $table->index('utilisateur_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gmp_affectations_equipe');
    }
};
