<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('factures', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignUuid('abonnement_id')->constrained('abonnements');
            $table->string('numero', 50)->unique();
            $table->decimal('montant_ht', 10, 2);
            $table->decimal('taux_tva', 5, 2)->default(18.00);
            $table->decimal('montant_tva', 10, 2);
            $table->decimal('montant_ttc', 10, 2);
            $table->string('devise', 3)->default('XOF');
            $table->string('statut', 20)->default('en_attente');
            $table->date('periode_debut');
            $table->date('periode_fin');
            $table->string('url_pdf', 500)->nullable();
            $table->timestampTz('paye_le')->nullable();
            $table->timestampTz('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('factures');
    }
};
