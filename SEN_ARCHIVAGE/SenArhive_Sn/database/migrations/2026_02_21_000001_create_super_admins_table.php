<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('super_admins', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('email')->unique();
            $table->string('nom');
            $table->string('prenom');
            $table->string('telephone')->nullable();
            $table->string('avatar_url')->nullable();
            $table->string('mot_de_passe_hash');
            $table->enum('statut', ['actif', 'inactif', 'suspendu'])->default('actif');
            $table->boolean('mfa_active')->default(false);
            $table->string('mfa_secret')->nullable();
            $table->boolean('email_verifie')->default(false);
            $table->timestamp('derniere_connexion')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('super_admins');
    }
};
