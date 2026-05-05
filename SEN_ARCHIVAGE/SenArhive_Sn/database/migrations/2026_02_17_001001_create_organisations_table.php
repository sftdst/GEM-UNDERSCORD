<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organisations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('plan_id')->constrained('plans');
            $table->string('nom', 255);
            $table->string('slug', 100)->unique();
            $table->string('logo_url', 500)->nullable();
            $table->string('domaine', 255)->nullable();
            $table->string('pays', 10)->default('SN');
            $table->string('langue_defaut', 10)->default('fr');
            $table->string('timezone', 50)->default('Africa/Dakar');
            $table->bigInteger('stockage_utilise_mo')->default(0);
            $table->string('statut', 20)->default('actif');
            $table->date('date_essai_fin')->nullable();
            $table->jsonb('parametres')->default('{}');
            $table->timestampsTz();

            $table->index('slug');
            $table->index('plan_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organisations');
    }
};
