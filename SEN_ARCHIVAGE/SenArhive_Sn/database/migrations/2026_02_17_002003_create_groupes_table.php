<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('groupes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->string('nom', 100);
            $table->text('description')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->unique(['organisation_id', 'nom']);
        });

        Schema::create('groupes_utilisateurs', function (Blueprint $table) {
            $table->foreignUuid('groupe_id')->constrained('groupes')->cascadeOnDelete();
            $table->foreignUuid('utilisateur_id')->constrained('utilisateurs')->cascadeOnDelete();
            $table->timestampTz('ajoute_le')->useCurrent();

            $table->primary(['groupe_id', 'utilisateur_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('groupes_utilisateurs');
        Schema::dropIfExists('groupes');
    }
};
