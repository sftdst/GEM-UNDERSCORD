<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gmp_directives', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignUuid('emetteur_id')->constrained('utilisateurs');
            $table->jsonb('organisations_cibles')->default('[]');
            $table->string('objet', 300);
            $table->text('contenu');
            $table->enum('priorite', ['info', 'normale', 'urgente', 'critique'])->default('normale');
            $table->date('date_echeance')->nullable();
            $table->enum('statut', ['envoyee', 'lue', 'acquittee'])->default('envoyee');
            $table->timestampsTz();

            $table->index('organisation_id');
            $table->index('priorite');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gmp_directives');
    }
};
