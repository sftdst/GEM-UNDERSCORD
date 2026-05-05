<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('demandes_essai', function (Blueprint $table) {
            $table->id();
            $table->uuid('organisation_id');
            $table->uuid('utilisateur_id');

            $table->enum('statut', ['en_attente', 'approuvee', 'rejetee'])->default('en_attente');

            // Informations complémentaires saisies lors de l'inscription
            $table->string('secteur_activite')->nullable();
            $table->unsignedSmallInteger('nb_utilisateurs_prevu')->nullable();
            $table->text('message')->nullable();           // message libre du demandeur

            // Traitement par le superadmin
            $table->string('traite_par')->nullable();       // email superadmin
            $table->text('raison_rejet')->nullable();
            $table->timestamp('traite_le')->nullable();

            $table->timestamps();

            $table->foreign('organisation_id')->references('id')->on('organisations')->onDelete('cascade');
            $table->foreign('utilisateur_id')->references('id')->on('utilisateurs')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('demandes_essai');
    }
};
