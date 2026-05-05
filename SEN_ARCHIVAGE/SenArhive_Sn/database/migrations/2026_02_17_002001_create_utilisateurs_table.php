<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('utilisateurs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignUuid('role_id')->nullable()->constrained('roles');
            $table->string('email', 255)->unique();
            $table->string('nom', 100);
            $table->string('prenom', 100);
            $table->string('telephone', 20)->nullable();
            $table->string('avatar_url', 500)->nullable();
            $table->string('langue', 10)->default('fr');
            $table->string('timezone', 50)->nullable();
            $table->string('mot_de_passe_hash');
            $table->string('statut', 20)->default('actif');
            $table->boolean('email_verifie')->default(false);
            $table->timestamp('email_verified_at')->nullable();
            $table->boolean('mfa_active')->default(false);
            $table->string('mfa_secret', 255)->nullable();
            $table->text('two_factor_secret')->nullable();
            $table->text('two_factor_recovery_codes')->nullable();
            $table->timestamp('two_factor_confirmed_at')->nullable();
            $table->timestampTz('derniere_connexion')->nullable();
            $table->rememberToken();
            $table->timestampsTz();

            $table->index('organisation_id');
            $table->index('email');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('utilisateurs');
    }
};
