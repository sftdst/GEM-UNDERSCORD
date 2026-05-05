<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('journaux_activite', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignUuid('utilisateur_id')->nullable()->constrained('utilisateurs')->nullOnDelete();
            $table->string('action', 100);
            $table->string('ressource_type', 50)->nullable();
            $table->uuid('ressource_id')->nullable();
            $table->jsonb('detail')->default('{}');
            $table->ipAddress('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->string('statut', 10)->default('succes');
            $table->timestampTz('created_at')->useCurrent();

            $table->index('organisation_id');
            $table->index('utilisateur_id');
            $table->index('action');
            $table->index('created_at');
            $table->index(['ressource_type', 'ressource_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('journaux_activite');
    }
};
